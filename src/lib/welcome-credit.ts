import { and, count, eq, inArray, isNotNull, ne, or, sql } from "drizzle-orm";
import { counterVisits, serviceRequests, users, walletEntries, welcomeCredits } from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Welcome credit: ₹100 wallet credit for a first-time customer, granted once the customer has
 * verified their mobile OR email, never at sign-up. The wallet only pays the 10% counter discount,
 * so ₹100 covers ₹100 of discounts (₹1,000 of bills). The older insurance welcome coupon is separate.
 */
export const WELCOME_CREDIT_RUPEES = 100;
/** Accounts created before this are existing customers and never get the welcome credit. */
export const WELCOME_CREDIT_FROM = new Date("2026-10-28T00:00:00+05:30");
/** The full popup is shown on the first few sign-ins; after that only a small note is shown. */
export const NUDGE_POPUP_LIMIT = 3;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const PAID_STATUSES = ["payment_received", "completed", "ready_for_pickup", "out_for_delivery"] as const;

/** First-time: an account from the launch date on, with no counter visit and no paid request. */
async function isFirstTimeAccount(tx: Tx, user: { id: string; createdAt: Date }) {
  if (user.createdAt < WELCOME_CREDIT_FROM) return false;
  const [visits] = await tx.select({ n: count() }).from(counterVisits).where(eq(counterVisits.userId, user.id));
  if (Number(visits?.n ?? 0) > 0) return false;
  const [paid] = await tx.select({ n: count() }).from(serviceRequests)
    .where(and(eq(serviceRequests.userId, user.id), inArray(serviceRequests.status, [...PAID_STATUSES])));
  return Number(paid?.n ?? 0) === 0;
}

/**
 * Grants the welcome credit if this account qualifies. Safe to call after every verification:
 * it never grants twice, and never when the same verified phone or email already has one.
 */
export async function grantWelcomeCredit(userId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    // One grant at a time, so two verifications at once can't both pass the duplicate check.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('welcome-credit'))`);
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || user.disabledAt || user.deletedAt) return false;
    const [existing] = await tx.select().from(welcomeCredits).where(eq(welcomeCredits.userId, userId)).limit(1);
    if (existing?.grantedAt) return false;
    const verifiedPhone = user.phoneVerifiedAt && user.phone ? user.phone : null;
    const verifiedEmail = user.emailVerifiedAt ? user.email : null;
    if (!verifiedPhone && !verifiedEmail) return false;
    if (!(await isFirstTimeAccount(tx, user))) return false;
    const [conflict] = await tx.select({ id: welcomeCredits.userId }).from(welcomeCredits).where(and(
      isNotNull(welcomeCredits.grantedAt), ne(welcomeCredits.userId, userId),
      or(verifiedPhone ? eq(welcomeCredits.phone, verifiedPhone) : undefined, verifiedEmail ? eq(welcomeCredits.email, verifiedEmail) : undefined),
    )).limit(1);
    if (conflict) return false;
    const now = new Date();
    await tx.insert(welcomeCredits).values({ userId, phone: verifiedPhone, email: verifiedEmail, grantedAt: now, nudgeCount: existing?.nudgeCount ?? 0 })
      .onConflictDoUpdate({ target: welcomeCredits.userId, set: { phone: verifiedPhone, email: verifiedEmail, grantedAt: now } });
    await tx.insert(walletEntries).values({
      userId, amount: WELCOME_CREDIT_RUPEES.toFixed(2), kind: "credit",
      description: "Welcome credit: 10% off every bill, for your first visit", reference: `welcome:${userId}`,
    });
    return true;
  });
}

/** What the profile needs: first-time account, verified, granted, celebration pending, nudge state. */
export async function welcomeStatus(userId: string) {
  return db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return null;
    const [row] = await tx.select().from(welcomeCredits).where(eq(welcomeCredits.userId, userId)).limit(1);
    const verified = Boolean(user.emailVerifiedAt || user.phoneVerifiedAt);
    const firstTime = await isFirstTimeAccount(tx, user);
    const granted = Boolean(row?.grantedAt);
    return {
      firstTime, verified, granted,
      amountRupees: WELCOME_CREDIT_RUPEES,
      celebrate: granted && !row?.celebratedAt,
      nudgeCount: row?.nudgeCount ?? 0,
      /** Only first-time accounts that aren't verified yet get the "verify to unlock" note. */
      nudgeable: firstTime && !verified && !granted,
    };
  });
}

/** Records one sign-in nudge. Returns whether the full popup should show this time. */
export async function recordNudge(userId: string) {
  const status = await welcomeStatus(userId);
  if (!status?.nudgeable) return { show: false, popup: false, nudgeCount: status?.nudgeCount ?? 0 };
  const [row] = await db.insert(welcomeCredits).values({ userId, nudgeCount: 1 })
    .onConflictDoUpdate({ target: welcomeCredits.userId, set: { nudgeCount: sql`${welcomeCredits.nudgeCount} + 1` } })
    .returning({ nudgeCount: welcomeCredits.nudgeCount });
  const nudgeCount = row?.nudgeCount ?? status.nudgeCount + 1;
  return { show: true, popup: nudgeCount <= NUDGE_POPUP_LIMIT, nudgeCount };
}

/** Marks the celebration as seen so the popup shows once. */
export async function markCelebrated(userId: string) {
  await db.update(welcomeCredits).set({ celebratedAt: new Date() })
    .where(and(eq(welcomeCredits.userId, userId), isNotNull(welcomeCredits.grantedAt), sql`${welcomeCredits.celebratedAt} is null`));
}
