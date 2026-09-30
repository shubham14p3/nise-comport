import { randomInt } from "node:crypto";
import { unstable_cache } from "next/cache";
import { and, asc, count, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { couponRedemptions, coupons, users } from "@/db/schema";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { istDate, istDayEnd, istDayStart } from "@/lib/festivals";
import { syncEventCoupons, WELCOME_COUPON, welcomeCode, type QueryFn } from "@/lib/offer-sync";
import { couponDiscount } from "@/lib/print-pricing";
import { curatedEventPromos } from "@/lib/promo-calendar";
import { isPromoLive, viewFromPromo, type CustomerVoucher, type PromoView } from "@/lib/promo-view";

type CouponRow = typeof coupons.$inferSelect;

/** A `coupons` row as the site shows it. */
export function couponView(row: CouponRow): PromoView {
  const kind = row.kind === "festival" || row.kind === "sport" || row.kind === "welcome" ? row.kind : "public";
  return {
    code: row.code, kind, eventKey: row.eventKey ?? null,
    names: row.title ?? { en: row.code, hi: row.code, bn: row.code },
    blurb: row.description ?? null,
    emoji: row.emoji ?? (kind === "welcome" ? "🎁" : "🏷️"), theme: row.theme ?? (kind === "welcome" ? "welcome" : "diya"),
    communities: row.communities ?? [], categories: row.categories ?? null,
    discountType: row.discountType === "percent" ? "percent" : "fixed", discount: Number(row.discountValue), minimum: Number(row.minimumAmount),
    startsOn: row.startsAt ? istDate(row.startsAt) : istDate(row.createdAt ?? new Date()),
    endsOn: row.expiresAt ? istDate(new Date(row.expiresAt.getTime() - 1)) : "2099-12-31",
    eventStarts: row.eventStarts ?? null, eventEnds: row.eventEnds ?? null, tentative: row.tentative,
  };
}

/**
 * Festival and sports codes that haven't ended, soonest first. Falls back to the checked dates in
 * festivals.ts / sports-events.ts when the database isn't reachable or hasn't been migrated yet.
 */
async function loadPromoCalendar(): Promise<{ views: PromoView[]; source: "database" | "fallback" }> {
  const now = new Date();
  try {
    const rows = await db.select().from(coupons)
      .where(and(eq(coupons.active, true), isNull(coupons.userId), inArray(coupons.kind, ["festival", "sport"]), or(isNull(coupons.expiresAt), gt(coupons.expiresAt, now))))
      .orderBy(asc(coupons.eventStarts), asc(coupons.code))
      .limit(400);
    if (rows.length) return { views: rows.map(couponView), source: "database" };
    // Rows exist but are all switched off or ended: show nothing rather than the fallback list.
    const [{ total }] = await db.select({ total: count() }).from(coupons).where(inArray(coupons.kind, ["festival", "sport"]));
    if (Number(total) > 0) return { views: [], source: "database" };
  } catch (error) {
    console.error("[offers] could not read promotions; using fallback dates", error instanceof Error ? error.message : error);
  }
  return { views: curatedEventPromos(now).map(viewFromPromo), source: "fallback" };
}

/** Cached for 5 minutes; switching a code off takes effect at checkout immediately regardless. */
export const getPromoCalendar = unstable_cache(loadPromoCalendar, ["promo-calendar-v1"], { revalidate: 300, tags: ["offers"] });

/** Codes that can be used today (for the ticker, offer rails and chat). */
export async function getLivePromos() {
  const { views } = await getPromoCalendar();
  const now = new Date();
  return views.filter((view) => isPromoLive(view, now)).sort((a, b) => a.endsOn.localeCompare(b.endsOn) || a.code.localeCompare(b.code));
}

export function normaliseCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

const rupees = (value: number) => `₹${Number.isInteger(value) ? value : value.toFixed(2)}`;

export type ResolvedCoupon = { coupon: CouponRow; view: PromoView; discount: number | null };

/**
 * Checks a code for a customer. With `amount` (a print order total) it also checks the minimum and
 * works out the discount; without it (a service request, billed later) the discount is the face
 * value and the minimum is checked when staff bill the request.
 */
export async function resolveCoupon(input: { code: string; userId: string; amount?: number }): Promise<ResolvedCoupon> {
  const code = normaliseCode(input.code);
  if (!/^[A-Z0-9-]{3,40}$/.test(code)) throw new PublicError("Enter a valid coupon code.", 400, { fields: { coupon: "Check the code." } });
  const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
  const invalid = () => new PublicError("This code isn’t valid. Check the spelling or pick one of the live codes.", 400, { code: "coupon_invalid", fields: { coupon: "Unknown code." } });
  if (!coupon || !coupon.active) throw invalid();
  if (coupon.userId && coupon.userId !== input.userId) throw invalid();
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    throw new PublicError(`This code starts on ${istDayLabel(coupon.startsAt)}.`, 400, { code: "coupon_not_started", fields: { coupon: "Not live yet." } });
  }
  if (coupon.expiresAt && coupon.expiresAt <= now) throw new PublicError("This code has ended.", 400, { code: "coupon_expired", fields: { coupon: "Expired." } });
  if (coupon.perUserLimit !== null) {
    const [{ used }] = await db.select({ used: count() }).from(couponRedemptions).where(and(eq(couponRedemptions.couponId, coupon.id), eq(couponRedemptions.userId, input.userId)));
    if (Number(used) >= coupon.perUserLimit) throw new PublicError("You’ve already used this code. Try another live code.", 400, { code: "coupon_used", fields: { coupon: "Already used." } });
  }
  if (coupon.maxRedemptions !== null) {
    const [{ used }] = await db.select({ used: count() }).from(couponRedemptions).where(eq(couponRedemptions.couponId, coupon.id));
    if (Number(used) >= coupon.maxRedemptions) throw new PublicError("This code has been fully used.", 400, { code: "coupon_used_up", fields: { coupon: "Fully used." } });
  }
  const minimum = Number(coupon.minimumAmount);
  let discount: number | null = null;
  if (input.amount !== undefined) {
    if (input.amount < minimum) throw new PublicError(`Add ${rupees(Math.ceil(minimum - input.amount))} more to use this code (minimum order ${rupees(minimum)}).`, 400, { code: "coupon_minimum", fields: { coupon: `Minimum ${rupees(minimum)}.` } });
    discount = couponDiscount(coupon.discountType, Number(coupon.discountValue), input.amount);
    if (!discount) throw new PublicError("This code doesn’t reduce the order total.", 400, { code: "coupon_no_discount" });
  }
  return { coupon, view: couponView(coupon), discount };
}

function istDayLabel(moment: Date) {
  return new Date(`${istDate(moment)}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Records a use; the same request can't use the same code twice. */
export async function recordRedemption(couponId: string, userId: string, requestKind: "print" | "service", requestId: string, amount: number) {
  await db.insert(couponRedemptions).values({ couponId, userId, requestKind, requestId, amount: amount.toFixed(2) }).onConflictDoNothing();
}

/** Gives the code back when a request is cancelled, so the customer can use it again. */
export async function releaseRedemptions(requestKind: "print" | "service", requestId: string) {
  try { await db.delete(couponRedemptions).where(and(eq(couponRedemptions.requestKind, requestKind), eq(couponRedemptions.requestId, requestId))); }
  catch (error) { console.error("[offers] could not release coupon", error); }
}

/**
 * Issues the ₹50 welcome coupon once per verified customer account. Safe to call on every
 * sign-in: a second call returns the existing coupon. Never throws (sign-in must not fail on it).
 */
export async function issueWelcomeCoupon(userId: string) {
  try {
    const [user] = await db.select({ id: users.id, role: users.role, verified: users.emailVerifiedAt }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user || user.role !== "customer" || !user.verified) return null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const [existing] = await db.select().from(coupons).where(and(eq(coupons.userId, user.id), eq(coupons.kind, "welcome"))).limit(1);
      if (existing) return { coupon: existing, created: false };
      const today = istDate(new Date());
      const [created] = await db.insert(coupons).values({
        code: welcomeCode((max) => randomInt(max)), discountType: "fixed", discountValue: WELCOME_COUPON.discount.toFixed(2), minimumAmount: WELCOME_COUPON.minimum.toFixed(2),
        active: true, kind: "welcome", userId: user.id, perUserLimit: 1, maxRedemptions: 1, source: "signup",
        title: { en: "Welcome coupon", hi: "वेलकम कूपन", bn: "ওয়েলকাম কুপন" },
        startsAt: istDayStart(today), expiresAt: istDayEnd(addDaysIso(today, WELCOME_COUPON.validDays)),
      }).onConflictDoNothing().returning();
      if (created) return { coupon: created, created: true };
    }
  } catch (error) {
    console.error("[offers] could not issue welcome coupon", error instanceof Error ? error.message : error);
  }
  return null;
}

function addDaysIso(isoDate: string, days: number) {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}


/** Vouchers for the profile page: the customer's own coupons plus live public codes, with "used" state. */
export async function customerVouchers(userId: string): Promise<CustomerVoucher[]> {
  const now = new Date();
  const rows = await db.select().from(coupons).where(and(
    eq(coupons.active, true),
    or(eq(coupons.userId, userId), and(isNull(coupons.userId), or(isNull(coupons.startsAt), sql`${coupons.startsAt} <= ${now}`))),
    or(isNull(coupons.expiresAt), gt(coupons.expiresAt, now)),
  )).orderBy(sql`${coupons.userId} is null`, asc(coupons.expiresAt)).limit(60);
  const ids = rows.map((row) => row.id);
  const used = ids.length ? await db.select({ couponId: couponRedemptions.couponId, uses: count() }).from(couponRedemptions)
    .where(and(eq(couponRedemptions.userId, userId), inArray(couponRedemptions.couponId, ids))).groupBy(couponRedemptions.couponId) : [];
  const usedMap = new Map(used.map((row) => [row.couponId, Number(row.uses)]));
  return rows.map((row) => {
    const view = couponView(row);
    const uses = usedMap.get(row.id) ?? 0;
    return { ...view, used: row.perUserLimit !== null && uses >= row.perUserLimit, live: isPromoLive(view, now), personal: row.userId === userId };
  });
}

/** Runs the festival/sports sync against the database. */
export async function syncOffers() {
  const client = (db as unknown as { $client: { query: QueryFn } }).$client;
  return syncEventCoupons((text, params) => client.query(text, params));
}

// ---------------------------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------------------------

export type AdminPromotion = PromoView & { id: string; active: boolean; locked: boolean; source: string | null; uses: number };

export async function adminPromotions() {
  const rows = await db.select().from(coupons).where(isNull(coupons.userId)).orderBy(asc(coupons.eventStarts), asc(coupons.code)).limit(500);
  const uses = await db.select({ couponId: couponRedemptions.couponId, uses: count() }).from(couponRedemptions).groupBy(couponRedemptions.couponId);
  const useMap = new Map(uses.map((row) => [row.couponId, Number(row.uses)]));
  const [welcome] = await db.select({
    issued: count(),
    used: sql<number>`count(*) filter (where exists (select 1 from ${couponRedemptions} where ${couponRedemptions.couponId} = ${coupons.id}))`,
  }).from(coupons).where(eq(coupons.kind, "welcome"));
  const today = istDate(new Date());
  const promotions: AdminPromotion[] = rows
    .map((row) => ({ ...couponView(row), id: row.id, active: row.active, locked: row.locked, source: row.source, uses: useMap.get(row.id) ?? 0 }))
    .filter((row) => row.endsOn >= addDaysIso(today, -30));
  return { promotions, welcome: { issued: Number(welcome?.issued ?? 0), used: Number(welcome?.used ?? 0) } };
}

export async function updatePromotion(id: string, patch: { active?: boolean; startsOn?: string; endsOn?: string; eventStarts?: string; eventEnds?: string; unlock?: boolean }) {
  const [row] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  if (!row || row.userId) throw new PublicError("Promotion not found.", 404, { code: "not_found" });
  const changes: Partial<typeof coupons.$inferInsert> = { updatedAt: new Date() };
  if (patch.active !== undefined) changes.active = patch.active;
  const datesChanged = patch.startsOn || patch.endsOn || patch.eventStarts || patch.eventEnds;
  if (datesChanged) {
    const startsOn = patch.startsOn ?? (row.startsAt ? istDate(row.startsAt) : istDate(new Date()));
    const endsOn = patch.endsOn ?? (row.expiresAt ? istDate(new Date(row.expiresAt.getTime() - 1)) : startsOn);
    if (endsOn < startsOn) throw new PublicError("The code must end on or after the day it starts.", 400, { fields: { endsOn: "Pick a later date." } });
    changes.startsAt = istDayStart(startsOn);
    changes.expiresAt = istDayEnd(endsOn);
    if (patch.eventStarts) changes.eventStarts = patch.eventStarts;
    if (patch.eventEnds) changes.eventEnds = patch.eventEnds;
    changes.tentative = false;
    changes.locked = true;
    changes.source = "admin";
  }
  if (patch.unlock) changes.locked = false;
  const [updated] = await db.update(coupons).set(changes).where(eq(coupons.id, id)).returning();
  return updated;
}

