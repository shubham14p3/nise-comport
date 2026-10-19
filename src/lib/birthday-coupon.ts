import { randomInt } from "node:crypto";
import { and, eq, or, sql } from "drizzle-orm";
import { contacts, coupons, users } from "@/db/schema";
import { categoryMeta } from "@/lib/categories";
import { db } from "@/lib/db";
import { istDayEnd, istDayStart } from "@/lib/festivals";
import { addDays, istToday, lastBirthday, type BirthdayCouponInfo, type BirthdayCouponSettings } from "@/lib/outreach-core";
import { normalizePhone } from "@/lib/validation";

type Contact = typeof contacts.$inferSelect;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** "BDAY-7K3P9Q": easy to read out at the counter (no 0/O/1/I). */
export function birthdayCode() {
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += ALPHABET[randomInt(ALPHABET.length)];
  return `BDAY-${suffix}`;
}

/** Every category except insurance (a premium can't be discounted), plus printing and PAN. The discount is taken off our service charge only. */
export function birthdayScope() {
  return { categories: categoryMeta.map((item) => item.slug).filter((slug) => slug !== "insurance"), services: ["print", "pan"] };
}

/** The coupon is made once per person per birthday year; asking again returns the same one. */
export async function ensureBirthdayCoupon(contact: Pick<Contact, "id" | "name" | "email" | "phone">, settings: BirthdayCouponSettings, birthdayIso: string, options: { bindUserId?: string | null } = {}) {
  const eventKey = `birthday-${birthdayIso.slice(0, 4)}-${contact.id}`;
  const userId = options.bindUserId ?? (await accountFor(contact))?.id ?? null;
  const today = istToday();
  for (let attempt = 0; attempt < 3; attempt++) {
    const [existing] = await db.select().from(coupons).where(eq(coupons.eventKey, eventKey)).limit(1);
    if (existing) {
      if (!existing.userId && userId) await db.update(coupons).set({ userId, updatedAt: new Date() }).where(and(eq(coupons.id, existing.id), sql`${coupons.userId} is null`));
      return toInfo(existing);
    }
    const [created] = await db.insert(coupons).values({
      code: birthdayCode(), discountType: "percent", discountValue: settings.percent.toFixed(2), minimumAmount: "0",
      active: true, kind: "birthday", userId, perUserLimit: 1, maxRedemptions: 1, source: "birthday", eventKey,
      title: { en: "Birthday gift", hi: "जन्मदिन का तोहफ़ा", bn: "জন্মদিনের উপহার" },
      description: { en: `${settings.percent}% off our service charge. Not for government fees or insurance premium.`, hi: `हमारे सेवा शुल्क पर ${settings.percent}% छूट। सरकारी शुल्क या बीमा प्रीमियम पर नहीं।`, bn: `আমাদের সার্ভিস চার্জে ${settings.percent}% ছাড়। সরকারি ফি বা বিমার প্রিমিয়ামে নয়।` },
      emoji: "🎂", theme: "welcome", appliesTo: birthdayScope(),
      startsAt: istDayStart(today), expiresAt: istDayEnd(addDays(today, settings.validDays - 1)),
    }).onConflictDoNothing().returning();
    if (created) return toInfo(created);
  }
  throw new Error("Could not create the birthday coupon.");
}

function toInfo(row: typeof coupons.$inferSelect): BirthdayCouponInfo & { used: boolean } {
  const until = row.expiresAt ? new Date(row.expiresAt.getTime() + 5.5 * 3_600_000 - 1).toISOString().slice(0, 10) : "2099-12-31";
  return { code: row.code, percent: Number(row.discountValue), until, used: false };
}

/** The customer account that belongs to this contact (same email or mobile number), if any. */
export async function accountFor(contact: Pick<Contact, "email" | "phone">) {
  const phone = normalizePhone(contact.phone);
  const email = contact.email?.trim().toLowerCase();
  const tests = [
    ...(email ? [sql`lower(${users.email}) = ${email}`] : []),
    ...(phone ? [eq(users.phone, phone), eq(users.whatsapp, phone)] : []),
  ];
  if (!tests.length) return null;
  const [user] = await db.select({ id: users.id }).from(users).where(and(eq(users.role, "customer"), or(...tests))).limit(1);
  return user ?? null;
}

/** The contact record (with a birthday) that belongs to a signed-in customer. */
export async function contactFor(user: { email: string; phone: string | null; whatsapp: string | null }) {
  const phones = [user.phone, user.whatsapp].map((value) => (value ? normalizePhone(value) : null)).filter((value): value is string => Boolean(value));
  const email = user.email.trim().toLowerCase();
  const [contact] = await db.select().from(contacts).where(and(
    sql`${contacts.birthMonth} is not null and ${contacts.birthDay} is not null`,
    or(sql`lower(${contacts.email}) = ${email}`, ...phones.map((phone) => eq(contacts.phone, phone))),
  )).limit(1);
  return contact ?? null;
}

/** For the login pop-up: is it (or was it within the last 6 days) this customer's birthday, and what is their gift? */
export async function birthdayGreeting(user: { id: string; name: string; email: string; phone: string | null; whatsapp: string | null; role: string }, settings: BirthdayCouponSettings, now = new Date()) {
  if (user.role !== "customer") return null;
  const contact = await contactFor(user);
  if (!contact) return null;
  const today = istToday(now);
  const birthday = lastBirthday({ month: contact.birthMonth!, day: contact.birthDay! }, today);
  const since = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${birthday}T00:00:00Z`)) / 86_400_000);
  if (since < 0 || since > 6) return null;
  const first = user.name.trim().split(/\s+/)[0] ?? "";
  if (!settings.enabled) return { name: first, coupon: null, birthday };
  const coupon = await ensureBirthdayCoupon(contact, settings, birthday, { bindUserId: user.id });
  const [row] = await db.select({ id: coupons.id, userId: coupons.userId }).from(coupons).where(eq(coupons.code, coupon.code)).limit(1);
  // Someone else's account already holds this coupon (two accounts, one person): greet without the code.
  if (row?.userId && row.userId !== user.id) return { name: first, coupon: null, birthday };
  return { name: first, coupon: { code: coupon.code, percent: coupon.percent, until: coupon.until }, birthday };
}
