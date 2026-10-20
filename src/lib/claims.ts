import { randomInt } from "node:crypto";
import { and, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { customerRecords, recordClaims, recordFlags, sessions, users } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { sendStaffAlertEmail, smtpConfigured } from "@/lib/email";
import { PublicError } from "@/lib/errors";
import { claimExpiry, claimMessage, claimReminderDue, generateCode, isPlaceholderEmail, MAX_CODE_ATTEMPTS, ownRecordView, WHATSAPP_CODE_HOURS } from "@/lib/mobile-login-core";
import { staffAlertEmail } from "@/lib/notifications";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { site } from "@/lib/site";
import { blindIndex, open, seal, vaultReady } from "@/lib/vault";
import { grantVerifyReward } from "@/lib/verify-rewards";

type Claim = typeof recordClaims.$inferSelect;
const digitsOf = (e164: string) => e164.replace(/^\+91/, "");
const hashOf = (e164: string) => blindIndex("mobile", digitsOf(e164));
function matchFilter(hashes: string[]) {
  const list = sql.join(hashes.map((hash) => sql`${hash}`), sql`, `);
  return sql`(${customerRecords.phoneHashes} && ARRAY[${list}]::text[] or ${customerRecords.mobileHash} in (${list}))`;
}

export async function matchedRecordCount(e164: string) {
  if (!vaultReady()) return 0;
  const [row] = await db.select({ total: sql<number>`count(*)::int` }).from(customerRecords).where(matchFilter([hashOf(e164)]));
  return row?.total ?? 0;
}

async function alertStaff(subject: string, lines: string[]) {
  if (!smtpConfigured()) return;
  try { await sendStaffAlertEmail(staffAlertEmail(), subject, lines, `${site.url}/admin#inbox`); } catch (error) { console.error("[claims] staff email failed", error); }
}

/**
 * Looks for records under this person's mobile number (main, WhatsApp or alternate) and, if there are some, opens a pending
 * claim for staff. Nothing is shown to the customer until it is approved. Returns the current claim, or null when no record matches.
 */
export async function ensureClaim(user: { id: string; name: string; email: string; phone: string | null; phoneVerifiedAt: Date | null }, pin?: string): Promise<Claim | null> {
  if (!user.phone || !vaultReady()) return null;
  const phone = user.phone;
  const now = new Date();
  await db.update(recordClaims).set({ status: "expired", pinEnc: null }).where(and(eq(recordClaims.userId, user.id), eq(recordClaims.status, "pending"), lt(recordClaims.expiresAt, now)));
  const [existing] = await db.select().from(recordClaims).where(and(eq(recordClaims.userId, user.id), eq(recordClaims.phone, phone))).orderBy(desc(recordClaims.createdAt)).limit(1);
  if (existing && (existing.status === "approved" || existing.status === "rejected" || existing.status === "pending")) {
    if (existing.status === "pending" && pin) { const [updated] = await db.update(recordClaims).set({ pinEnc: seal(pin) }).where(eq(recordClaims.id, existing.id)).returning(); return updated; }
    return existing;
  }
  const matched = await matchedRecordCount(phone);
  if (!matched) return null;
  const proven = Boolean(user.phoneVerifiedAt);
  let created: Claim | undefined;
  try {
    [created] = await db.insert(recordClaims).values({
      userId: user.id, phone, matchedCount: matched, pinEnc: pin && !proven ? seal(pin) : null, expiresAt: claimExpiry(now),
      ...(proven ? { status: "approved", method: "sms", decidedAt: now } : {}),
    }).returning();
  } catch { /* a parallel request opened it first */ }
  if (!created) return (await db.select().from(recordClaims).where(and(eq(recordClaims.userId, user.id), eq(recordClaims.phone, phone))).orderBy(desc(recordClaims.createdAt)).limit(1))[0] ?? null;
  if (!proven) {
    await logActivity({ kind: "claim", permission: "records", category: "records", title: `${user.name} wants to see their records`, detail: `${matched} record${matched === 1 ? "" : "s"} match ${phone}. Approve, or send a WhatsApp code.`, refType: "claim", refId: created.id, actorId: user.id });
    await alertStaff(`Records claim: ${user.name}`, [`${user.name} signed in with ${phone} and ${matched} record${matched === 1 ? "" : "s"} match this number.`, "Open the admin inbox to approve, reject or send them a WhatsApp code. They see nothing until you do.", `Valid for 7 days.`]);
  }
  return created;
}

export type StaffClaim = { id: string; name: string; email: string | null; mobile: string; pin: string | null; matched: number; createdAt: string; expiresAt: string; codeSent: boolean; waiting: string };
export type StaffFlag = { id: string; name: string; mobile: string | null; note: string | null; service: string | null; createdAt: string };

/** Pending claims and "this isn't me" flags for the admin inbox. */
export async function staffClaims() {
  const now = new Date();
  await db.update(recordClaims).set({ status: "expired", pinEnc: null }).where(and(eq(recordClaims.status, "pending"), lt(recordClaims.expiresAt, now)));
  const rows = await db.select({ claim: recordClaims, name: users.name, email: users.email }).from(recordClaims).innerJoin(users, eq(users.id, recordClaims.userId)).where(eq(recordClaims.status, "pending")).orderBy(desc(recordClaims.createdAt)).limit(100);
  const claims: StaffClaim[] = rows.map(({ claim, name, email }) => {
    let pin: string | null = null;
    try { pin = claim.pinEnc ? open<string>(claim.pinEnc) : null; } catch { pin = null; }
    return { id: claim.id, name, email: isPlaceholderEmail(email) ? null : email, mobile: claim.phone, pin, matched: claim.matchedCount, createdAt: claim.createdAt.toISOString(), expiresAt: claim.expiresAt.toISOString(), codeSent: Boolean(claim.codeHash && claim.codeExpiresAt && claim.codeExpiresAt > now), waiting: claimReminderDue(claim, now) ? "overdue" : "" };
  });
  const flagRows = await db.select({ flag: recordFlags, name: users.name, phone: users.phone, service: customerRecords.service }).from(recordFlags).innerJoin(users, eq(users.id, recordFlags.userId)).leftJoin(customerRecords, eq(customerRecords.id, recordFlags.recordId)).where(isNull(recordFlags.resolvedAt)).orderBy(desc(recordFlags.createdAt)).limit(50);
  const flags: StaffFlag[] = flagRows.map(({ flag, name, phone, service }) => ({ id: flag.id, name, mobile: phone, note: flag.note, service, createdAt: flag.createdAt.toISOString() }));
  return { claims, flags };
}

export async function pendingClaimCount() {
  const [row] = await db.select({ total: sql<number>`count(*)::int` }).from(recordClaims).where(and(eq(recordClaims.status, "pending"), sql`${recordClaims.expiresAt} > now()`));
  const [flags] = await db.select({ total: sql<number>`count(*)::int` }).from(recordFlags).where(isNull(recordFlags.resolvedAt));
  return (row?.total ?? 0) + (flags?.total ?? 0);
}

async function finish(claim: Claim, status: "approved" | "rejected", by: { id: string; name: string } | null, method: string) {
  const [done] = await db.update(recordClaims).set({ status, method, pinEnc: null, codeHash: null, decidedBy: by?.id ?? null, decidedAt: new Date() }).where(and(eq(recordClaims.id, claim.id), eq(recordClaims.status, "pending"))).returning();
  if (!done) throw new PublicError("This request was already decided.", 409);
  await logActivity({ kind: "claim", permission: "records", category: "records", title: `Records ${status === "approved" ? "approved" : "declined"}${by ? ` by ${by.name}` : ` (${method} code)`}`, detail: claim.phone, refType: "claim", refId: claim.id, actorId: by?.id ?? null });
  return done;
}

/** Staff approve or reject. Approval alone does not count as proof of the number (no reward). */
export async function decideClaim(staff: { id: string; name: string }, id: string, approve: boolean) {
  const [claim] = await db.select().from(recordClaims).where(eq(recordClaims.id, id)).limit(1);
  if (!claim) throw new PublicError("Request not found.", 404);
  await finish(claim, approve ? "approved" : "rejected", staff, "staff");
}

/** Staff generate a code to send on WhatsApp (copy-ready message). The customer types it in Profile → My records. */
export async function sendClaimCode(staff: { id: string; name: string }, id: string) {
  const [row] = await db.select({ claim: recordClaims, name: users.name }).from(recordClaims).innerJoin(users, eq(users.id, recordClaims.userId)).where(eq(recordClaims.id, id)).limit(1);
  if (!row || row.claim.status !== "pending") throw new PublicError("This request is not waiting any more.", 409);
  const code = generateCode((below) => randomInt(0, below));
  const expires = new Date(Date.now() + WHATSAPP_CODE_HOURS * 3600_000);
  await db.update(recordClaims).set({ codeHash: blindIndex("claim-code", `${id}:${code}`), codeExpiresAt: expires, codeAttempts: 0, method: "whatsapp" }).where(eq(recordClaims.id, id));
  const message = claimMessage(row.name, code);
  const digits = digitsOf(row.claim.phone);
  await logActivity({ kind: "claim", permission: "records", category: "records", title: `${staff.name} made a WhatsApp code for ${row.name}`, detail: row.claim.phone, refType: "claim", refId: id, actorId: staff.id });
  return { code, message, whatsappUrl: `https://wa.me/91${digits}?text=${encodeURIComponent(message)}`, expiresAt: expires.toISOString() };
}

/** The customer types the code staff sent. Proves the number, so it also counts as a verified mobile. */
export async function submitClaimCode(user: { id: string }, input: string) {
  await enforceRate(RATE_RULES.claimCodeAttemptsPerUserHour, identity("user", user.id), "Too many tries.");
  const code = String(input ?? "").replace(/\D/g, "");
  if (!/^\d{6}$/.test(code)) throw new PublicError("Enter the 6-digit code.", 400, { fields: { code: "Enter the 6-digit code." } });
  const now = new Date();
  const [claim] = await db.select().from(recordClaims).where(and(eq(recordClaims.userId, user.id), eq(recordClaims.status, "pending"))).orderBy(desc(recordClaims.createdAt)).limit(1);
  if (!claim || !claim.codeHash || !claim.codeExpiresAt || claim.codeExpiresAt < now || claim.expiresAt < now) throw new PublicError("There is no active code. Ask us to send you a new one.", 400, { code: "no_code" });
  if (claim.codeAttempts >= MAX_CODE_ATTEMPTS) throw new PublicError("Too many wrong codes. Ask us to send a new one.", 400, { code: "code_locked" });
  if (blindIndex("claim-code", `${claim.id}:${code}`) !== claim.codeHash) {
    await db.update(recordClaims).set({ codeAttempts: sql`${recordClaims.codeAttempts} + 1` }).where(eq(recordClaims.id, claim.id));
    throw new PublicError("That code doesn’t match.", 400, { fields: { code: "That code doesn’t match." } });
  }
  await finish(claim, "approved", null, "whatsapp");
  await db.update(users).set({ phoneVerifiedAt: now, updatedAt: now }).where(and(eq(users.id, user.id), eq(users.phone, claim.phone)));
  await grantVerifyReward(user.id, "phone");
}

/** A mobile number proven by an SMS code approves a waiting claim for that number. */
export async function approveClaimsForVerifiedPhone(userId: string, phone: string) {
  const [claim] = await db.select().from(recordClaims).where(and(eq(recordClaims.userId, userId), eq(recordClaims.phone, phone), eq(recordClaims.status, "pending"))).limit(1);
  if (claim) await finish(claim, "approved", null, "sms").catch(() => undefined);
  else await ensureClaim({ id: userId, name: "", email: "", phone, phoneVerifiedAt: new Date() });
}

/** Everything the customer may see about their own records: service, first name and dates. Logged every time. */
export async function myRecords(user: { id: string; name: string; phone: string | null; email: string; phoneVerifiedAt: Date | null }) {
  const claim = await ensureClaim(user);
  if (!claim) return { status: "none" as const, records: [] };
  const now = new Date();
  const status = claim.status === "pending" && claim.expiresAt < now ? "expired" : claim.status as "pending" | "approved" | "rejected" | "expired";
  if (status !== "approved") return { status, expiresAt: claim.expiresAt.toISOString(), codeSent: Boolean(claim.codeHash && claim.codeExpiresAt && claim.codeExpiresAt > now), records: [] };
  await enforceRate(RATE_RULES.ownRecordViewsPerUserHour, identity("user", user.id), "You have opened your records many times this hour.");
  const rows = await db.select().from(customerRecords).where(matchFilter([hashOf(claim.phone)])).orderBy(desc(customerRecords.recordDate)).limit(60);
  await logActivity({ kind: "record_view", permission: "records", category: "records", title: `${user.name} viewed their own records`, detail: `${rows.length} record${rows.length === 1 ? "" : "s"}`, refType: "user", refId: user.id, actorId: user.id });
  return { status: "approved" as const, records: rows.map((row) => ownRecordView({ id: row.id, service: row.service, name: row.name, recordDate: row.recordDate, renewalOn: row.renewalOn, vehicle: row.vehicle })) };
}

/** "This isn't me" on one record (or on all of them): staff are told. */
export async function flagRecord(user: { id: string; name: string; phone: string | null }, recordId: string | null, note: string) {
  await enforceRate(RATE_RULES.recordFlagsPerUserDay, identity("user", user.id), "Too many reports today.");
  const [claim] = await db.select().from(recordClaims).where(and(eq(recordClaims.userId, user.id), eq(recordClaims.status, "approved"))).limit(1);
  if (!claim) throw new PublicError("There are no records to report.", 400);
  let service: string | null = null;
  if (recordId) {
    const [row] = await db.select({ id: customerRecords.id, service: customerRecords.service }).from(customerRecords).where(and(eq(customerRecords.id, recordId), matchFilter([hashOf(claim.phone)]))).limit(1);
    if (!row) throw new PublicError("Record not found.", 404);
    service = row.service;
  }
  const text = String(note ?? "").trim().slice(0, 300) || null;
  await db.insert(recordFlags).values({ userId: user.id, claimId: claim.id, recordId, note: text });
  await logActivity({ kind: "flag", permission: "records", category: "records", title: `${user.name} says a record is not theirs`, detail: `${service ?? "all records"} · ${claim.phone}${text ? ` · ${text}` : ""}`, refType: "user", refId: user.id, actorId: user.id });
  await alertStaff(`"This isn't me": ${user.name}`, [`${user.name} (${claim.phone}) reported ${service ? `a ${service} record` : "their records"} as not theirs.`, ...(text ? [`Note: ${text}`] : []), "Check it in the admin inbox."]);
}

export async function resolveFlag(staff: { id: string }, id: string) {
  await db.update(recordFlags).set({ resolvedAt: new Date() }).where(and(eq(recordFlags.id, id), isNull(recordFlags.resolvedAt)));
}

/** Run by the 10–15 minute cron: expires old claims and emails one reminder for claims waiting two days. */
export async function remindPendingClaims() {
  const now = new Date();
  await db.update(recordClaims).set({ status: "expired", pinEnc: null }).where(and(eq(recordClaims.status, "pending"), lt(recordClaims.expiresAt, now)));
  const waiting = await db.select({ claim: recordClaims, name: users.name }).from(recordClaims).innerJoin(users, eq(users.id, recordClaims.userId)).where(and(eq(recordClaims.status, "pending"), isNull(recordClaims.remindedAt))).limit(200);
  const due = waiting.filter(({ claim }) => claimReminderDue(claim, now));
  if (!due.length) return 0;
  await alertStaff(`${due.length} record request${due.length === 1 ? " is" : "s are"} still waiting`, [...due.slice(0, 15).map(({ claim, name }) => `${name} · ${claim.phone}`), "They have waited two days. Each request expires after 7 days."]);
  await db.update(recordClaims).set({ remindedAt: now }).where(inArray(recordClaims.id, due.map(({ claim }) => claim.id)));
  return due.length;
}

/** Staff-only: a customer's sessions end when their PIN is reset. */
export async function endSessions(userId: string) { await db.delete(sessions).where(eq(sessions.userId, userId)); }
