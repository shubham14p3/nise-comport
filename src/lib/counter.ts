import { randomBytes } from "node:crypto";
import { and, count, desc, eq, isNull, like, not, notInArray, or, sql } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { contacts, counterVisits, users, walletEntries } from "@/db/schema";
import { db } from "@/lib/db";
import { isPlaceholderEmail } from "@/lib/mobile-login-core";
import { PublicError } from "@/lib/errors";
import { COUNTER_DISCOUNT_PERCENT } from "@/lib/counter-rules";
import { cleanName, looksLikeEmail, normalizeEmail, normalizePhone } from "@/lib/validation";

/** Recent visits shown per page on the counter. */
export const VISITS_PAGE_SIZE = 5;
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

/**
 * Accounts that count as this customer's number. Staff and admin accounts are not customers, and
 * placeholder profiles from imported lists (".invalid" emails) are ignored. Profiles the counter
 * creates (prefix "counter-") and mobile sign-ups (@mobile.nisecomport.invalid) are real customers and still count.
 */
function customerAccountsFor(phone: string) {
  return and(
    eq(users.phone, phone),
    isNull(users.deletedAt),
    notInArray(users.role, ["admin", "staff"]),
    or(not(like(users.email, "%.invalid")), like(users.email, "counter-%"), like(users.email, "%@mobile.nisecomport.invalid")),
  );
}

/** Looks up the customer for this number. Returns no profile for a new number. */
export async function lookupCustomer(phoneInput: string, pageInput = 0) {
  const page = Math.max(0, Math.floor(pageInput));
  const phone = normalizePhone(phoneInput);
  if (!phone) throw new PublicError("Enter a valid 10-digit mobile number.", 400, { fields: { phone: "Check the number." } });
  const rows = await db.select({ id: users.id, name: users.name }).from(users)
    .where(customerAccountsFor(phone)).limit(2);
  if (rows.length > 1) throw duplicateNumberError();
  const customer = rows[0];
  if (!customer) {
    // No account yet: a name from the contact list (imported records, forms) still helps the counter.
    const [known] = await db.select({ name: contacts.name }).from(contacts).where(eq(contacts.phone, phone)).limit(1);
    return { phone, customer: null, knownName: known?.name ?? null, contact: null, balancePaise: 0, visits: [], visitsTotal: 0, page: 0, pageSize: VISITS_PAGE_SIZE };
  }
  const balancePaise = await db.transaction((tx) => walletPaise(tx, customer.id));
  const visits = await db.select({
    id: counterVisits.id, serviceName: counterVisits.serviceName, billPaise: counterVisits.billPaise,
    discountPaise: counterVisits.discountPaise, walletPaise: counterVisits.walletPaise, collectPaise: counterVisits.collectPaise,
    createdAt: counterVisits.createdAt,
  }).from(counterVisits).where(eq(counterVisits.userId, customer.id)).orderBy(desc(counterVisits.createdAt)).limit(VISITS_PAGE_SIZE).offset(page * VISITS_PAGE_SIZE);
  const [totals] = await db.select({ total: count() }).from(counterVisits).where(eq(counterVisits.userId, customer.id));
  return { phone, customer: { id: customer.id, name: customer.name }, knownName: null, contact: await customerContact(customer.id), balancePaise, visits, visitsTotal: totals?.total ?? 0, page, pageSize: VISITS_PAGE_SIZE };
}

/**
 * The customer for this number, creating a profile for a new number. A new profile needs a name.
 * The email is a placeholder (signupMethod "mobile"), as for other mobile-only profiles.
 */
export async function customerForCounter(tx: Tx, phone: string, name: string | undefined, emailInput?: string) {
  const rows = await tx.select({ id: users.id }).from(users).where(customerAccountsFor(phone)).limit(2);
  if (rows.length > 1) throw duplicateNumberError();
  if (rows[0]) return rows[0].id;
  const cleaned = cleanName(name ?? "");
  if (cleaned.length < 2) throw new PublicError("This is a new number. Enter the customer’s name.", 400, { fields: { name: "Enter the name." } });
  // Email is optional. When given it is saved unverified; the customer verifies it later.
  const email = emailInput?.trim() ? normalizeEmail(emailInput) : "";
  if (email && !looksLikeEmail(email)) throw new PublicError("Enter a valid email address, or leave it empty.", 400, { fields: { email: "Check the email." } });
  if (email) {
    const [taken] = await tx.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (taken) throw new PublicError("This email already belongs to another account.", 409, { fields: { email: "Already in use." } });
  }
  const passwordHash = await hash(randomBytes(32).toString("base64url"));
  const [created] = await tx.insert(users).values({
    name: cleaned, email: email || `counter-${phone}@counter.invalid`, phone, passwordHash, signupMethod: "mobile", preferredContact: "whatsapp",
  }).returning({ id: users.id });
  if (!created) throw new PublicError("Could not create the profile. Please try again.", 500);
  return created.id;
}

/**
 * Records one counter visit. The 10% discount comes out of the wallet, up to the balance.
 * The customer pays the rest (collectPaise). The customer row is locked so two quick
 * entries can't spend the same balance twice.
 */
export async function recordVisit(input: { staffId: string; phone: string; name?: string; email?: string; serviceSlug: string; serviceName: string; billRupees: number }) {
  const billPaise = toPaise(input.billRupees);
  return db.transaction(async (tx) => {
    const userId = await customerForCounter(tx, input.phone, input.name, input.email);
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
export async function requestTopUp(input: { staffId: string; phone: string; name?: string; email?: string; rupees: number; reason: string }) {
  const paise = toPaise(input.rupees);
  const reason = cleanReason(input.reason);
  return db.transaction(async (tx) => {
    const userId = await customerForCounter(tx, input.phone, input.name, input.email);
    return createCreditRequest(tx, { userId, requestedById: input.staffId, paise, reason });
  });
}

/** Contact details for the counter, with whether each one is verified. */
export async function customerContact(userId: string) {
  const [row] = await db.select({ email: users.email, phone: users.phone, emailVerifiedAt: users.emailVerifiedAt, phoneVerifiedAt: users.phoneVerifiedAt })
    .from(users).where(eq(users.id, userId)).limit(1);
  return {
    email: row && !isPlaceholderEmail(row.email) ? row.email : null,
    emailVerified: Boolean(row?.emailVerifiedAt),
    phone: row?.phone ?? null,
    phoneVerified: Boolean(row?.phoneVerifiedAt),
  };
}

/** Looks up a customer by email for the counter. Returns the same shape as lookupCustomer. */
export async function lookupCustomerByEmail(emailInput: string, pageInput = 0) {
  const email = normalizeEmail(emailInput);
  if (!looksLikeEmail(email)) throw new PublicError("Enter a valid email address.", 400, { fields: { email: "Check the email." } });
  const page = Math.max(0, Math.floor(pageInput));
  const [customer] = await db.select({ id: users.id, name: users.name }).from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt), notInArray(users.role, ["admin", "staff"]))).limit(1);
  if (!customer) return { phone: "", customer: null, knownName: null, contact: null, balancePaise: 0, visits: [], visitsTotal: 0, page: 0, pageSize: VISITS_PAGE_SIZE };
  const contact = await customerContact(customer.id);
  const balancePaise = await db.transaction((tx) => walletPaise(tx, customer.id));
  const visits = await db.select({
    id: counterVisits.id, serviceName: counterVisits.serviceName, billPaise: counterVisits.billPaise,
    discountPaise: counterVisits.discountPaise, walletPaise: counterVisits.walletPaise, collectPaise: counterVisits.collectPaise,
    createdAt: counterVisits.createdAt,
  }).from(counterVisits).where(eq(counterVisits.userId, customer.id)).orderBy(desc(counterVisits.createdAt)).limit(VISITS_PAGE_SIZE).offset(page * VISITS_PAGE_SIZE);
  const [totals] = await db.select({ total: count() }).from(counterVisits).where(eq(counterVisits.userId, customer.id));
  return { phone: contact.phone ?? "", customer: { id: customer.id, name: customer.name }, knownName: null, contact, balancePaise, visits, visitsTotal: totals?.total ?? 0, page, pageSize: VISITS_PAGE_SIZE };
}
