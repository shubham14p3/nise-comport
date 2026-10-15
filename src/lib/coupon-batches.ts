import { randomInt } from "node:crypto";
import { and, count, desc, eq, inArray, isNotNull, isNull, like, or, sql } from "drizzle-orm";
import { couponBatches, couponRedemptions, coupons, printJobs, serviceRequests, users } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { istDayEnd, istDayStart } from "@/lib/festivals";
import { deliverNotifications, queueNotification } from "@/lib/notifications";
import { cleanScope, personalCode, scopeLabel } from "@/lib/promo-scope";
import { scopeNames } from "@/lib/promotions";
import { servicesInCategory } from "@/lib/services";
import { site } from "@/lib/site";
import { normalizeEmail, normalizePhone } from "@/lib/validation";

export type Audience =
  | { kind: "people"; values: string[] }          // emails or mobile numbers, one per line
  | { kind: "all" }                               // every verified customer
  | { kind: "used"; services: string[] }          // customers who used these services ("print" for print orders)
  | { kind: "inactive"; days: number };           // customers with no request in the last N days

export type BatchInput = {
  name: string; prefix: string; title?: string; discountType: "fixed" | "percent"; discount: number; minimum: number;
  maxDiscount?: number | null; usesPerCode: number; appliesTo?: { categories?: string[]; services?: string[] } | null;
  audience: Audience; startsOn: string; endsOn: string; notify?: boolean;
};

const MAX_PEOPLE = 5000;

/** Customer accounts the batch is for. Only verified, active customer accounts get codes. */
async function audienceUsers(audience: Audience) {
  const customer = and(eq(users.role, "customer"), isNotNull(users.emailVerifiedAt), isNull(users.deletedAt), isNull(users.disabledAt));
  const pick = { id: users.id, name: users.name, email: users.email };
  if (audience.kind === "all") return db.select(pick).from(users).where(customer).limit(MAX_PEOPLE + 1);
  if (audience.kind === "people") {
    const emails = audience.values.map((value) => value.includes("@") ? normalizeEmail(value) : null).filter((value): value is string => Boolean(value));
    const phones = audience.values.map((value) => value.includes("@") ? null : normalizePhone(value)).filter((value): value is string => Boolean(value));
    if (!emails.length && !phones.length) throw new PublicError("Add at least one customer email or mobile number.", 400, { fields: { audience: "Add people." } });
    const conditions = [...(emails.length ? [inArray(users.email, emails)] : []), ...(phones.length ? [inArray(users.phone, phones)] : [])];
    return db.select(pick).from(users).where(and(customer, conditions.length === 1 ? conditions[0] : sql`(${conditions[0]} or ${conditions[1]})`)).limit(MAX_PEOPLE + 1);
  }
  if (audience.kind === "used") {
    // Categories expand to their services; "pan" also matches the PAN request flow.
    const services = [...new Set(audience.services.filter((item) => item !== "print").flatMap((item) => {
      const inCategory = servicesInCategory(item).map((service) => service.slug);
      return inCategory.length ? inCategory : [item];
    }))].filter((slug) => /^[a-z0-9-]+$/.test(slug)).slice(0, 80);
    const ids = new Set<string>();
    if (services.length) {
      const rows = await db.selectDistinct({ id: serviceRequests.userId }).from(serviceRequests)
        .where(or(...services.map((slug) => like(serviceRequests.serviceSlug, `${slug}%`))));
      rows.forEach((row) => ids.add(row.id));
    }
    if (audience.services.includes("print")) (await db.selectDistinct({ id: printJobs.userId }).from(printJobs)).forEach((row) => ids.add(row.id));
    if (!ids.size) return [];
    return db.select(pick).from(users).where(and(customer, inArray(users.id, [...ids].slice(0, MAX_PEOPLE + 1))));
  }
  const since = new Date(Date.now() - Math.max(7, Math.min(730, audience.days)) * 86_400_000);
  return db.select(pick).from(users).where(and(customer,
    sql`not exists (select 1 from ${serviceRequests} where ${serviceRequests.userId} = ${users.id} and ${serviceRequests.createdAt} > ${since})`,
    sql`not exists (select 1 from ${printJobs} where ${printJobs.userId} = ${users.id} and ${printJobs.createdAt} > ${since})`)).limit(MAX_PEOPLE + 1);
}

/** How many customers a batch would reach, before creating it. */
export async function previewAudience(audience: Audience) {
  const people = await audienceUsers(audience);
  return { count: Math.min(people.length, MAX_PEOPLE), capped: people.length > MAX_PEOPLE, sample: people.slice(0, 5).map((person) => person.name) };
}

/**
 * Creates one unique code per customer, bound to their account (useless to anyone else), each
 * usable `usesPerCode` times. Optionally emails every customer their code.
 */
export async function createBatch(input: BatchInput, actor: { id: string; name: string }) {
  const name = input.name.replace(/\s+/g, " ").trim().slice(0, 80);
  if (name.length < 3) throw new PublicError("Give the batch a name, e.g. “Diwali thank-you”.", 400, { fields: { name: "Add a name." } });
  const prefix = input.prefix.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  if (prefix.length < 2) throw new PublicError("Use 2–10 letters or numbers for the code prefix, e.g. DIWALI.", 400, { fields: { prefix: "Check the prefix." } });
  const max = input.discountType === "percent" ? 50 : 5000;
  if (!(input.discount > 0 && input.discount <= max)) throw new PublicError(input.discountType === "percent" ? "Use 1–50%." : "Use ₹1–₹5,000.", 400, { fields: { discount: "Check the amount." } });
  if (!(input.minimum >= 0 && input.minimum <= 100_000)) throw new PublicError("Check the minimum order.", 400, { fields: { minimum: "Check the amount." } });
  const usesPerCode = Math.max(1, Math.min(10, Math.round(input.usesPerCode)));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(input.endsOn) || input.endsOn < input.startsOn) throw new PublicError("Check the dates.", 400, { fields: { endsOn: "Check the dates." } });
  const people = await audienceUsers(input.audience);
  if (!people.length) throw new PublicError("No verified customer accounts match. Customers need a signed-in, verified account to use a personal code.", 400, { fields: { audience: "Nobody matches." } });
  if (people.length > MAX_PEOPLE) throw new PublicError(`That's more than ${MAX_PEOPLE.toLocaleString("en-IN")} customers. Narrow the group.`, 400);
  const appliesTo = cleanScope(input.appliesTo ?? null);
  const title = input.title?.replace(/\s+/g, " ").trim().slice(0, 80) || name;
  const startsAt = istDayStart(input.startsOn); const expiresAt = istDayEnd(input.endsOn);
  const [batch] = await db.insert(couponBatches).values({
    name, prefix, title: { en: title, hi: title, bn: title }, discountType: input.discountType, discountValue: input.discount.toFixed(2),
    minimumAmount: input.minimum.toFixed(2), maxDiscount: input.maxDiscount ? input.maxDiscount.toFixed(2) : null, usesPerCode, appliesTo,
    audience: input.audience, startsAt, expiresAt, createdBy: actor.id,
  }).returning();
  const issued: { userId: string; code: string; name: string; email: string }[] = [];
  for (let offset = 0; offset < people.length; offset += 300) {
    const rows = people.slice(offset, offset + 300).map((person) => ({
      code: personalCode(prefix, (limit) => randomInt(limit)), discountType: input.discountType, discountValue: input.discount.toFixed(2),
      minimumAmount: input.minimum.toFixed(2), maxDiscount: input.maxDiscount ? input.maxDiscount.toFixed(2) : null, appliesTo,
      active: true, kind: "personal", userId: person.id, batchId: batch.id, perUserLimit: usesPerCode, maxRedemptions: usesPerCode,
      startsAt, expiresAt, title: { en: title, hi: title, bn: title }, emoji: "🎟️", theme: "welcome", communities: [], source: "batch", locked: true, createdBy: actor.id,
    }));
    // A clash on a random code is astronomically unlikely; such rows are simply skipped.
    const inserted = await db.insert(coupons).values(rows).onConflictDoNothing().returning({ userId: coupons.userId, code: coupons.code });
    for (const row of inserted) { const person = people.find((item) => item.id === row.userId)!; issued.push({ userId: person.id, code: row.code, name: person.name, email: person.email }); }
  }
  await db.update(couponBatches).set({ issued: issued.length }).where(eq(couponBatches.id, batch.id));
  await logActivity({ kind: "promotion", permission: "promotions", category: "promotions", title: `${actor.name} created ${issued.length} personal codes: ${name}`, detail: `${input.discountType === "percent" ? `${input.discount}%` : `₹${input.discount}`} off · ${usesPerCode} use${usesPerCode === 1 ? "" : "s"} each · ${scopeLabel(appliesTo, scopeNames())}`, refType: "batch", refId: batch.id, actorId: actor.id });
  if (input.notify) {
    const value = input.discountType === "percent" ? `${input.discount}% off${input.maxDiscount ? ` (up to ₹${input.maxDiscount})` : ""}` : `₹${input.discount} off`;
    const ids: string[] = [];
    for (const person of issued.slice(0, 2000)) {
      try {
        ids.push(await queueNotification(person.userId, "customer_message", { email: person.email, subject: `Your personal code from ${site.name}: ${person.code}`, lines: [
          `Hello ${person.name.split(/\s+/)[0]},`, `Here is a code just for you: ${person.code}`, `${value} on ${scopeLabel(appliesTo, scopeNames())}${input.minimum ? `, on orders of ₹${input.minimum} or more` : ""}.`,
          `Valid until ${input.endsOn}. It works only when you're signed in to your own account${usesPerCode > 1 ? `, up to ${usesPerCode} times` : ", once"}.`,
        ] }));
      } catch (error) { console.error("[batches] could not queue email", error); }
    }
    void deliverNotifications(ids).catch(() => undefined);
  }
  return { id: batch.id, issued: issued.length };
}

export async function listBatches() {
  const batches = await db.select().from(couponBatches).orderBy(desc(couponBatches.createdAt)).limit(50);
  if (!batches.length) return [];
  const usage = await db.select({ batchId: coupons.batchId, used: count(couponRedemptions.id) }).from(coupons)
    .leftJoin(couponRedemptions, eq(couponRedemptions.couponId, coupons.id)).where(inArray(coupons.batchId, batches.map((batch) => batch.id))).groupBy(coupons.batchId);
  const used = new Map(usage.map((row) => [row.batchId, Number(row.used)]));
  const names = scopeNames();
  return batches.map((batch) => ({ ...batch, used: used.get(batch.id) ?? 0, validOn: scopeLabel(cleanScope(batch.appliesTo), names) }));
}

/** The codes of one batch with who has them and how often each was used (for sharing on WhatsApp). */
export async function batchCodes(batchId: string) {
  return db.select({ code: coupons.code, active: coupons.active, name: users.name, email: users.email, phone: users.phone, whatsapp: users.whatsapp,
    used: sql<number>`(select count(*)::int from ${couponRedemptions} where ${couponRedemptions.couponId} = ${coupons.id})` })
    .from(coupons).innerJoin(users, eq(users.id, coupons.userId)).where(eq(coupons.batchId, batchId)).orderBy(users.name).limit(MAX_PEOPLE);
}

/** Switch every code of a batch off (or on again). */
export async function setBatchActive(batchId: string, active: boolean, actor: { id: string; name: string }) {
  const [batch] = await db.update(couponBatches).set({ active }).where(eq(couponBatches.id, batchId)).returning();
  if (!batch) throw new PublicError("Batch not found.", 404);
  await db.update(coupons).set({ active, updatedAt: new Date() }).where(eq(coupons.batchId, batchId));
  await logActivity({ kind: "promotion", permission: "promotions", category: "promotions", title: `${actor.name} switched ${active ? "on" : "off"} the personal codes “${batch.name}”`, refType: "batch", refId: batchId, actorId: actor.id });
  return batch;
}
