import { randomBytes } from "node:crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { counterVisits, users, walletEntries } from "@/db/schema";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { COUNTER_DISCOUNT_PERCENT } from "@/lib/counter-rules";
import { cleanName, normalizePhone } from "@/lib/validation";
import { cleanReason, createCreditRequest, toPaise, type Tx } from "@/lib/wallet-credits";

export { COUNTER_DISCOUNT_PERCENT } from "@/lib/counter-rules";

/** Wallet balance in paise: credits minus debits. */
export async function walletPaise(executor: Tx, userId: string) {
  const [row] = await executor.select({
    balance: sql<string>`coalesce(sum(case when ${walletEntries.kind} = 'debit' then -${walletEntries.amount} else ${walletEntries.amount} end), 0)`,
  }).from(walletEntries).where(eq(walletEntries.userId, userId));
  return Math.round(Number(row?.balance ?? 0) * 100);
}

function duplicateNumberError() {
  return new PublicError("More than one account uses this mobile number. Check with the owner before recording anything.", 409, { code: "duplicate_phone" });
}

/** Looks up the customer for this number. Returns no profile for a new number. */
export async function lookupCustomer(phoneInput: string) {
  const phone = normalizePhone(phoneInput);
  if (!phone) throw new PublicError("Enter a valid 10-digit mobile number.", 400, { fields: { phone: "Check the number." } });
  const rows = await db.select({ id: users.id, name: users.name }).from(users)
    .where(and(eq(users.phone, phone), isNull(users.deletedAt))).limit(2);
  if (rows.length > 1) throw duplicateNumberError();
  const customer = rows[0];
  if (!customer) return { phone, customer: null, balancePaise: 0, visits: [] };
  const balancePaise = await db.transaction((tx) => walletPaise(tx, customer.id));
  const visits = await db.select({
    id: counterVisits.id, serviceName: counterVisits.serviceName, billPaise: counterVisits.billPaise,
    discountPaise: counterVisits.discountPaise, walletPaise: counterVisits.walletPaise, collectPaise: counterVisits.collectPaise,
    createdAt: counterVisits.createdAt,
  }).from(counterVisits).where(eq(counterVisits.userId, customer.id)).orderBy(desc(counterVisits.createdAt)).limit(8);
  return { phone, customer: { id: customer.id, name: customer.name }, balancePaise, visits };
}

/**
 * The customer for this number, creating a profile for a new number. A new profile needs a name.
 * The email is a placeholder (signupMethod "mobile"), as for other mobile-only profiles.
 */
export async function customerForCounter(tx: Tx, phone: string, name: string | undefined) {
  const rows = await tx.select({ id: users.id }).from(users).where(and(eq(users.phone, phone), isNull(users.deletedAt))).limit(2);
  if (rows.length > 1) throw duplicateNumberError();
  if (rows[0]) return rows[0].id;
  const cleaned = cleanName(name ?? "");
  if (cleaned.length < 2) throw new PublicError("This is a new number. Enter the customer’s name.", 400, { fields: { name: "Enter the name." } });
  const passwordHash = await hash(randomBytes(32).toString("base64url"));
  const [created] = await tx.insert(users).values({
    name: cleaned, email: `counter-${phone}@counter.invalid`, phone, passwordHash, signupMethod: "mobile", preferredContact: "whatsapp",
  }).returning({ id: users.id });
  if (!created) throw new PublicError("Could not create the profile. Please try again.", 500);
  return created.id;
}

/**
 * Records one counter visit. The 10% discount comes out of the wallet, up to the balance.
 * The customer pays the rest (collectPaise). The customer row is locked so two quick
 * entries can't spend the same balance twice.
 */
export async function recordVisit(input: { staffId: string; phone: string; name?: string; serviceSlug: string; serviceName: string; billRupees: number }) {
  const billPaise = toPaise(input.billRupees);
  return db.transaction(async (tx) => {
    const userId = await customerForCounter(tx, input.phone, input.name);
    await tx.execute(sql`select id from users where id = ${userId} for update`);
    const balance = await walletPaise(tx, userId);
    const discountPaise = Math.min(Math.floor((billPaise * COUNTER_DISCOUNT_PERCENT) / 100), balance);
    const collectPaise = billPaise - discountPaise;
    const [visit] = await tx.insert(counterVisits).values({
      userId, staffId: input.staffId, serviceSlug: input.serviceSlug, serviceName: input.serviceName,
      billPaise, discountPaise, walletPaise: discountPaise, collectPaise,
    }).returning({ id: counterVisits.id, createdAt: counterVisits.createdAt });
    if (!visit) throw new PublicError("Could not record the visit. Please try again.", 500);
    if (discountPaise > 0) {
      await tx.insert(walletEntries).values({
        userId, amount: (discountPaise / 100).toFixed(2), kind: "debit",
        description: `Counter: ${input.serviceName} (${COUNTER_DISCOUNT_PERCENT}% discount)`, reference: `CV-${visit.id}`,
      });
    }
    return { visitId: visit.id, createdAt: visit.createdAt, billPaise, discountPaise, collectPaise, balanceAfterPaise: balance - discountPaise };
  });
}

/**
 * A top-up at the counter is a wallet credit, so it waits for a second admin's approval.
 * Nothing is added to the wallet here.
 */
export async function requestTopUp(input: { staffId: string; phone: string; name?: string; rupees: number; reason: string }) {
  const paise = toPaise(input.rupees);
  const reason = cleanReason(input.reason);
  return db.transaction(async (tx) => {
    const userId = await customerForCounter(tx, input.phone, input.name);
    return createCreditRequest(tx, { userId, requestedById: input.staffId, paise, reason });
  });
}
