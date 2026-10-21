import { createHmac, randomInt } from "node:crypto";
import { unstable_cache } from "next/cache";
import { and, asc, count, eq, gt, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { couponBlocks, couponCredits, couponRedemptions, coupons, users } from "@/db/schema";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { istDate, istDayEnd, istDayStart } from "@/lib/festivals";
import { syncEventCoupons, WELCOME_COUPON, welcomeCode, type QueryFn } from "@/lib/offer-sync";
import { balanceDiscount, cappedDiscount, cleanScope, scopeAllows, scopeLabel, type ScopeContext } from "@/lib/promo-scope";
import { findService, publishedServiceDetails, serviceCatalog } from "@/lib/services";
import { curatedEventPromos } from "@/lib/promo-calendar";
import { isPosterUrl } from "@/lib/poster-library";
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
    discountType: row.discountType === "percent" ? "percent" : row.discountType === "balance" ? "balance" : "fixed", discount: Number(row.discountValue), minimum: Number(row.minimumAmount),
    startsOn: row.startsAt ? istDate(row.startsAt) : istDate(row.createdAt ?? new Date()),
    endsOn: row.expiresAt ? istDate(new Date(row.expiresAt.getTime() - 1)) : "2099-12-31",
    eventStarts: row.eventStarts ?? null, eventEnds: row.eventEnds ?? null, tentative: row.tentative,
    posters: row.posters ?? null,
    appliesTo: cleanScope(row.appliesTo),
    validOn: cleanScope(row.appliesTo) ? scopeLabel(cleanScope(row.appliesTo), scopeNames()) : null,
    maxDiscount: row.maxDiscount ? Number(row.maxDiscount) : null,
    ...(row.discountType === "balance" ? { isBalance: true, maxPercent: row.maxPercent } : {}),
  };
}

/**
 * Festival and sports codes that haven't ended, soonest first. Falls back to the checked dates in
 * festivals.ts / sports-events.ts when the database isn't reachable or hasn't been migrated yet.
 */
async function loadRealPromoCalendar(): Promise<{ views: PromoView[]; source: "database" | "fallback" }> {
  const now = new Date();
  try {
    const rows = await db.select().from(coupons)
      .where(and(
        eq(coupons.active, true), isNull(coupons.userId), or(isNull(coupons.expiresAt), gt(coupons.expiresAt, now)),
        // Festival / sports codes, plus promotions the owner created in the admin area (they have a title).
        or(inArray(coupons.kind, ["festival", "sport"]), and(eq(coupons.kind, "public"), sql`${coupons.title} is not null`)),
      ))
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

// ---------------------------------------------------------------------------------------------
// Public pages never contain real codes. Visitors get an opaque token and see XXXXXX; the real
// codes are fetched after sign-in (see /api/offers/codes), so hiding a pop-up in the browser
// reveals nothing.
// ---------------------------------------------------------------------------------------------

function tokenFor(code: string) {
  const secret = process.env.OTP_SECRET && process.env.OTP_SECRET.length >= 32 ? process.env.OTP_SECRET : "development-only-offer-token-secret";
  return `m${createHmac("sha256", secret).update(`offer:${code}`).digest("hex").slice(0, 12)}`;
}
const maskView = (view: PromoView): PromoView => ({ ...view, code: tokenFor(view.code), masked: true });

/** Cached for 5 minutes; every code in it is masked. Switching a code off takes effect at checkout immediately regardless. */
export const getPromoCalendar = unstable_cache(async () => {
  const { views, source } = await loadRealPromoCalendar();
  return { views: views.map(maskView), source };
}, ["promo-calendar-masked-v1"], { revalidate: 300, tags: ["offers"] });

/** Token -> real code, for signed-in customers only. */
export async function promoCodeReveal() {
  const { views } = await loadRealPromoCalendar();
  return Object.fromEntries(views.map((view) => [tokenFor(view.code), view.code])) as Record<string, string>;
}

/** Codes that can be used today (for the ticker, offer rails and chat). */
export async function getLivePromos() {
  // A database or cache problem should hide the promo codes, not break every page that lists them.
  const { views } = await getPromoCalendar().catch((error) => { console.error("[promotions] calendar unavailable", error instanceof Error ? error.message : error); return { views: [] as PromoView[] }; });
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
/** Where a code is being used: print orders, PAN, or a service (with its category). */
export function scopeContext(service?: string | null): ScopeContext | undefined {
  if (!service) return undefined;
  if (service === "print" || service === "pan") return { service };
  const found = findService(service);
  return { service, category: found && "categorySlug" in found ? String(found.categorySlug) : service };
}

/** Names for scope labels: category and service slugs → titles. */
export function scopeNames() {
  return Object.fromEntries([...serviceCatalog, ...publishedServiceDetails].map((item) => [item.slug, item.title]));
}

/**
 * Checks a code for a customer. With `context` (the service being requested, or "print"), a code
 * limited to other services is refused with a message saying where it does work.
 */
export async function resolveCoupon(input: { code: string; userId: string; amount?: number; context?: ScopeContext }): Promise<ResolvedCoupon> {
  const code = normaliseCode(input.code);
  if (!/^[A-Z0-9-]{3,40}$/.test(code)) throw new PublicError("Enter a valid coupon code.", 400, { fields: { coupon: "Check the code." } });
  const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
  const invalid = () => new PublicError("This code isn’t valid. Check the spelling or pick one of the live codes.", 400, { code: "coupon_invalid", fields: { coupon: "Unknown code." } });
  if (!coupon || !coupon.active) throw invalid();
  if (coupon.userId && coupon.userId !== input.userId) throw invalid();
  const [blocked] = await db.select({ id: couponBlocks.id }).from(couponBlocks).where(and(eq(couponBlocks.userId, input.userId), or(eq(couponBlocks.couponId, coupon.id), isNull(couponBlocks.couponId)))).limit(1).catch(() => []);
  if (blocked) throw new PublicError("This code can’t be used on your account. Please contact the shop.", 400, { code: "coupon_blocked", fields: { coupon: "Not available on this account." } });
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    throw new PublicError(`This code starts on ${istDayLabel(coupon.startsAt)}.`, 400, { code: "coupon_not_started", fields: { coupon: "Not live yet." } });
  }
  if (coupon.expiresAt && coupon.expiresAt <= now) throw new PublicError("This code has ended.", 400, { code: "coupon_expired", fields: { coupon: "Expired." } });
  const scope = cleanScope(coupon.appliesTo);
  if (input.context && !scopeAllows(scope, input.context)) {
    throw new PublicError(`This code works only on: ${scopeLabel(scope, scopeNames())}.`, 400, { code: "coupon_wrong_service", fields: { coupon: "Not for this service." } });
  }
  if (coupon.discountType === "balance") {
    // A balance coupon is used up by rupees, not by counts: each order can take at most maxPercent% of its amount.
    const [{ spent }] = await db.select({ spent: sql<string>`coalesce(sum(${couponRedemptions.amount}), 0)` }).from(couponRedemptions).where(eq(couponRedemptions.couponId, coupon.id));
    const remaining = Math.round((Number(coupon.discountValue) - Number(spent)) * 100) / 100;
    if (remaining <= 0) throw new PublicError("The balance on this coupon has been used up.", 400, { code: "coupon_used_up", fields: { coupon: "No balance left." } });
    const min = Number(coupon.minimumAmount);
    let balanceOff: number | null = null;
    if (input.amount !== undefined) {
      if (input.amount < min) throw new PublicError(`Add ${rupees(Math.ceil(min - input.amount))} more to use this code (minimum order ${rupees(min)}).`, 400, { code: "coupon_minimum", fields: { coupon: `Minimum ${rupees(min)}.` } });
      balanceOff = balanceDiscount(remaining, input.amount, coupon.maxPercent, coupon.maxDiscount ? Number(coupon.maxDiscount) : null);
      if (!balanceOff) throw new PublicError("This code doesn’t reduce the order total.", 400, { code: "coupon_no_discount" });
    }
    return { coupon, view: { ...couponView(coupon), balance: remaining }, discount: balanceOff };
  }
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
    discount = cappedDiscount(coupon.discountType, Number(coupon.discountValue), input.amount, coupon.maxDiscount ? Number(coupon.maxDiscount) : null);
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
 * The welcome coupon is one balance per customer: ₹30 is added when they verify their email and ₹20 when
 * they verify their mobile number (₹50 in all). Each credit happens once (unique reference). Customers who
 * already hold an older fixed ₹50 welcome coupon keep it and get the wallet reward instead.
 * Returns the coupon and whether this call added money. Never throws.
 */
export async function creditWelcomeBalance(userId: string, kind: "email" | "phone") {
  try {
    const [user] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user || user.role !== "customer") return null;
    const amount = kind === "email" ? 30 : 20;
    for (let attempt = 0; attempt < 3; attempt++) {
      let [coupon] = await db.select().from(coupons).where(and(eq(coupons.userId, user.id), eq(coupons.kind, "welcome"))).limit(1);
      if (coupon && coupon.discountType !== "balance") return { coupon, created: false, legacy: true as const };
      if (!coupon) {
        const today = istDate(new Date());
        [coupon] = await db.insert(coupons).values({
          code: welcomeCode((max) => randomInt(max)), discountType: "balance", discountValue: "0.00", minimumAmount: WELCOME_COUPON.minimum.toFixed(2), maxPercent: WELCOME_COUPON.maxPercent, appliesTo: { services: [...WELCOME_COUPON.services] },
          active: true, kind: "welcome", userId: user.id, perUserLimit: null, maxRedemptions: null, source: "signup",
          title: { en: "Welcome coupon", hi: "वेलकम कूपन", bn: "ওয়েলকাম কুপন" },
          startsAt: istDayStart(today), expiresAt: istDayEnd(addDaysIso(today, WELCOME_COUPON.validDays)),
        }).onConflictDoNothing().returning();
        if (!coupon) continue; // another request created it first; read it on the next pass
      }
      const [credit] = await db.insert(couponCredits).values({ couponId: coupon.id, reference: `welcome:${kind}:${user.id}`, amount: amount.toFixed(2) }).onConflictDoNothing().returning();
      if (credit) {
        const today = istDate(new Date());
        const [updated] = await db.update(coupons).set({ discountValue: sql`${coupons.discountValue} + ${amount}`, expiresAt: istDayEnd(addDaysIso(today, WELCOME_COUPON.validDays)), updatedAt: new Date() }).where(eq(coupons.id, coupon.id)).returning();
        return { coupon: updated ?? coupon, created: true, legacy: false as const };
      }
      return { coupon, created: false, legacy: false as const };
    }
  } catch (error) {
    console.error("[offers] could not credit the welcome coupon", error instanceof Error ? error.message : error);
  }
  return null;
}

/** Kept for the email sign-up flow: adds the ₹30 email part and returns the welcome coupon. */
export async function issueWelcomeCoupon(userId: string) {
  const [user] = await db.select({ verified: users.emailVerifiedAt }).from(users).where(eq(users.id, userId)).limit(1).catch(() => []);
  if (!user?.verified) return null;
  const result = await creditWelcomeBalance(userId, "email");
  return result ? { coupon: result.coupon, created: result.created } : null;
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

export type AdminPromotion = PromoView & { id: string; active: boolean; locked: boolean; source: string | null; uses: number; perUserLimit: number | null; maxRedemptions: number | null; customerName: string | null };

export async function adminPromotions() {
  const rows = await db.select({ coupon: coupons, customer: users.name }).from(coupons).leftJoin(users, eq(users.id, coupons.userId)).where(and(isNull(coupons.batchId), ne(coupons.kind, "welcome"))).orderBy(asc(coupons.eventStarts), asc(coupons.code)).limit(500)
    .then((list) => list.map((item) => ({ ...item.coupon, customerName: item.customer })));
  const uses = await db.select({ couponId: couponRedemptions.couponId, uses: count() }).from(couponRedemptions).groupBy(couponRedemptions.couponId);
  const useMap = new Map(uses.map((row) => [row.couponId, Number(row.uses)]));
  const [welcome] = await db.select({
    issued: count(),
    used: sql<number>`count(*) filter (where exists (select 1 from ${couponRedemptions} where ${couponRedemptions.couponId} = ${coupons.id}))`,
  }).from(coupons).where(eq(coupons.kind, "welcome"));
  const today = istDate(new Date());
  const promotions: AdminPromotion[] = rows
    .map((row) => ({ ...couponView(row), id: row.id, active: row.active, locked: row.locked, source: row.source, uses: useMap.get(row.id) ?? 0, perUserLimit: row.perUserLimit, maxRedemptions: row.maxRedemptions, customerName: row.customerName }))
    .filter((row) => row.endsOn >= addDaysIso(today, -30));
  return { promotions, welcome: { issued: Number(welcome?.issued ?? 0), used: Number(welcome?.used ?? 0) } };
}

type Text3Input = { en?: string; hi?: string; bn?: string };
export type PromotionDetails = {
  names?: Text3Input; description?: Text3Input | null; discountType?: "fixed" | "percent" | "balance"; discount?: number; maxPercent?: number | null; minimum?: number;
  perUserLimit?: number | null; maxRedemptions?: number | null; posters?: Text3Input | null; emoji?: string | null;
  /** Limit to these categories/services ({ categories: [], services: [] } or null = everything). */
  appliesTo?: { categories?: string[]; services?: string[] } | null;
  /** Rupee cap for % codes (null = no cap). */
  maxDiscount?: number | null;
  /** Create only: restrict the code to one customer, found by mobile number (10 digits or +91…). */
  customerPhone?: string | null;
};

const cleanText = (value: string | undefined, max: number) => (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** Validates the editable parts of a promotion; missing Hindi/Bengali text falls back to English. */
function detailChanges(input: PromotionDetails, current?: CouponRow): Partial<typeof coupons.$inferInsert> {
  const changes: Partial<typeof coupons.$inferInsert> = {};
  if (input.names) {
    const en = cleanText(input.names.en, 80);
    if (en.length < 3) throw new PublicError("Give the promotion a name (at least 3 characters).", 400, { fields: { name: "Add a name." } });
    changes.title = { en, hi: cleanText(input.names.hi, 80) || en, bn: cleanText(input.names.bn, 80) || en };
  }
  if (input.description !== undefined) {
    const en = cleanText(input.description?.en, 240);
    changes.description = en ? { en, hi: cleanText(input.description?.hi, 240) || en, bn: cleanText(input.description?.bn, 240) || en } : null;
  }
  const type = input.discountType ?? (current?.discountType === "percent" ? "percent" : current?.discountType === "balance" ? "balance" : "fixed");
  if (input.discountType) changes.discountType = type;
  if (input.discount !== undefined) {
    const max = type === "percent" ? 50 : 5000;
    if (!(input.discount > 0 && input.discount <= max)) throw new PublicError(type === "percent" ? "Use a discount between 1% and 50%." : "Use a discount between ₹1 and ₹5,000.", 400, { fields: { discount: "Check the amount." } });
    changes.discountValue = input.discount.toFixed(2);
  }
  if (input.minimum !== undefined) {
    if (!(input.minimum >= 0 && input.minimum <= 100_000)) throw new PublicError("Check the minimum order amount.", 400, { fields: { minimum: "Check the amount." } });
    changes.minimumAmount = input.minimum.toFixed(2);
  }
  if (input.appliesTo !== undefined) changes.appliesTo = cleanScope(input.appliesTo);
  if (input.maxDiscount !== undefined) {
    if (input.maxDiscount !== null && !(input.maxDiscount > 0 && input.maxDiscount <= 5000)) throw new PublicError("Use a maximum discount between ₹1 and ₹5,000, or leave it empty.", 400, { fields: { maxDiscount: "Check the amount." } });
    changes.maxDiscount = input.maxDiscount === null ? null : input.maxDiscount.toFixed(2);
  }
  if (input.maxPercent !== undefined) {
    if (input.maxPercent !== null && !(Number.isInteger(input.maxPercent) && input.maxPercent >= 1 && input.maxPercent <= 100)) throw new PublicError("Use a whole percent between 1 and 100.", 400, { fields: { maxPercent: "Check the percent." } });
    changes.maxPercent = input.maxPercent;
  }
  if (type === "balance" && input.maxPercent === undefined && current?.maxPercent == null && !changes.maxPercent) changes.maxPercent = 20;
  if (input.perUserLimit !== undefined) changes.perUserLimit = input.perUserLimit === null ? null : Math.max(1, Math.min(50, Math.round(input.perUserLimit)));
  if (input.maxRedemptions !== undefined) changes.maxRedemptions = input.maxRedemptions === null ? null : Math.max(1, Math.min(100_000, Math.round(input.maxRedemptions)));
  if (input.posters !== undefined) {
    const posters: Partial<Record<"en" | "hi" | "bn", string>> = {};
    for (const lang of ["en", "hi", "bn"] as const) {
      const url = input.posters?.[lang];
      if (!url) continue;
      if (!isPosterUrl(url)) throw new PublicError("Choose posters from the poster library.", 400, { fields: { posters: "Invalid poster." } });
      posters[lang] = url;
    }
    changes.posters = Object.keys(posters).length ? posters : null;
  }
  if (input.emoji !== undefined) changes.emoji = cleanText(input.emoji ?? "", 8) || null;
  return changes;
}

/** A promotion the owner creates by hand in Admin → Promotions. */
async function customerByPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(-10);
  if (!/^[6-9]\d{9}$/.test(digits)) throw new PublicError("Enter the customer's 10-digit mobile number.", 400, { fields: { customerPhone: "Check the number." } });
  const [user] = await db.select({ id: users.id }).from(users).where(and(eq(users.phone, `+91${digits}`), isNull(users.deletedAt))).limit(1);
  if (!user) throw new PublicError("No customer account has that mobile number yet. They need to sign up first.", 404, { fields: { customerPhone: "No account with this number." } });
  return user.id;
}

export async function createPromotion(input: PromotionDetails & { code: string; startsOn: string; endsOn: string; active?: boolean }, actor: { id: string }) {
  const code = normaliseCode(input.code);
  if (!/^[A-Z0-9][A-Z0-9-]{2,19}$/.test(code)) throw new PublicError("Use 3–20 letters, numbers or dashes for the code, e.g. RENEW50.", 400, { fields: { code: "Check the code." } });
  if (code.startsWith("WELCOME-")) throw new PublicError("Codes starting with WELCOME- are reserved for welcome coupons.", 400, { fields: { code: "Choose another code." } });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(input.endsOn) || input.endsOn < input.startsOn) {
    throw new PublicError("Check the dates: the code must end on or after the day it starts.", 400, { fields: { endsOn: "Check the dates." } });
  }
  const customerId = input.customerPhone ? await customerByPhone(input.customerPhone) : null;
  const details = detailChanges({ discountType: "fixed", discount: 50, minimum: 150, perUserLimit: 1, ...input, names: input.names ?? { en: code } });
  try {
    const [row] = await db.insert(coupons).values({
      code, discountType: details.discountType ?? "fixed", maxPercent: details.maxPercent ?? null, discountValue: details.discountValue ?? "50.00", minimumAmount: details.minimumAmount ?? "150.00",
      active: input.active ?? true, kind: "public", userId: customerId, title: details.title, description: details.description ?? null,
      startsAt: istDayStart(input.startsOn), expiresAt: istDayEnd(input.endsOn), perUserLimit: "perUserLimit" in details ? details.perUserLimit : 1, maxRedemptions: details.maxRedemptions ?? null,
      posters: details.posters ?? null, appliesTo: details.appliesTo ?? null, maxDiscount: details.maxDiscount ?? null, emoji: details.emoji ?? "🏷️", theme: "welcome", communities: [], source: "admin", locked: true, createdBy: actor.id,
    }).returning();
    return row;
  } catch (error) {
    if ((error as { code?: string }).code === "23505" || String((error as Error).message).includes("duplicate")) throw new PublicError("That code already exists. Choose another.", 409, { fields: { code: "Already used." } });
    throw error;
  }
}

export async function updatePromotion(id: string, patch: PromotionDetails & { active?: boolean; startsOn?: string; endsOn?: string; eventStarts?: string; eventEnds?: string; unlock?: boolean }) {
  const [row] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  if (!row || row.batchId || row.kind === "welcome") throw new PublicError("Promotion not found.", 404, { code: "not_found" });
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
    changes.source = row.kind === "public" ? row.source : "admin";
  }
  // Festival / sports codes keep their generated wording and value; posters can be added to any code.
  const editable = row.kind === "public" ? patch
    : { posters: patch.posters, appliesTo: patch.appliesTo, maxDiscount: patch.maxDiscount, discountType: patch.discountType, discount: patch.discount, minimum: patch.minimum, perUserLimit: patch.perUserLimit, maxRedemptions: patch.maxRedemptions, maxPercent: patch.maxPercent };
  // Changing the value or limits of a generated festival/sports code locks it, so the daily sync keeps the owner's version.
  if (row.kind !== "public" && (patch.discount !== undefined || patch.discountType || patch.minimum !== undefined || patch.perUserLimit !== undefined || patch.maxRedemptions !== undefined || patch.maxPercent !== undefined)) changes.locked = true;
  Object.assign(changes, detailChanges(editable, row));
  if (patch.unlock && row.kind !== "public") changes.locked = false;
  const [updated] = await db.update(coupons).set(changes).where(eq(coupons.id, id)).returning();
  return updated;
}

