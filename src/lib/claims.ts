import { randomInt } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { customerRecords, recordClaims, users } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import type { User } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { normalizePhone, nameProblem } from "@/lib/validation";
import { blindIndex, open } from "@/lib/vault";
import { customerFields } from "@/lib/record-services";
import { RECORD_SERVICES } from "@/lib/record-import";
import { RECORD_STATUSES } from "@/lib/record-status";

type Sealed = { mobile: string | null; pan: string | null; fields: Record<string, string> };
export const CLAIM_METHODS = ["reference", "pan", "whatsapp", "staff"] as const;
export type ClaimMethod = (typeof CLAIM_METHODS)[number];

/** Two names match when they share a word of 3+ letters ("Manju Devi" ~ "MANJU DEVI W."). */
export function namesMatch(a: string, b: string) {
  const words = (value: string) => new Set(value.toLowerCase().replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter((word) => word.length >= 3));
  const left = words(a);
  return [...words(b)].some((word) => left.has(word));
}

/**
 * A customer asks to be linked to their past records.
 * - reference / PAN: approved at once when the mobile, a name that matches, and that PAN or reference all match a record.
 * - WhatsApp code / staff: waits in the Inbox until staff check it (the WhatsApp message comes from their number).
 */
export async function submitClaim(user: User, input: { mobile: string; name: string; method: ClaimMethod; value?: string }) {
  await enforceRate(RATE_RULES.accountChangePerUserHour, identity("user", user.id), "Too many account changes.");
  const phone = normalizePhone(input.mobile);
  if (!phone) throw new PublicError("Enter a valid 10-digit mobile number.", 400, { fields: { mobile: "Enter a valid 10-digit mobile number." } });
  const problem = nameProblem(input.name, 2, "Name");
  if (problem) throw new PublicError(problem, 400, { fields: { name: problem } });
  const mobileHash = blindIndex("mobile", phone);
  const claimedName = input.name.trim().replace(/\s+/g, " ");

  if (input.method === "reference" || input.method === "pan") {
    const value = (input.value ?? "").trim().toUpperCase().replace(/\s+/g, "");
    if (!value) throw new PublicError(input.method === "pan" ? "Enter your PAN number." : "Enter the reference number from your receipt.", 400, { fields: { value: "Required." } });
    const candidates = await db.select({ name: customerRecords.name, payloadEnc: customerRecords.payloadEnc }).from(customerRecords).where(eq(customerRecords.mobileHash, mobileHash)).limit(300);
    const match = candidates.find((row) => {
      if (!namesMatch(row.name, claimedName)) return false;
      const data = open<Sealed>(row.payloadEnc);
      if (input.method === "pan") return data.pan === value;
      return Object.values(data.fields ?? {}).some((field) => field.toUpperCase().replace(/\s+/g, "") === value);
    });
    if (match) {
      await db.insert(recordClaims).values({ userId: user.id, mobileHash, matchedName: match.name, claimedName, method: input.method, status: "approved", decidedAt: new Date() });
      await logActivity({ kind: "status", permission: "records", category: "records", title: `${user.name} linked their records automatically`, detail: `Matched by ${input.method === "pan" ? "PAN" : "reference number"} · ${match.name}`, refType: "user", refId: user.id, actorId: user.id });
      return { status: "approved" as const, message: "Your past records are linked to your account." };
    }
  }

  const code = input.method === "whatsapp" ? String(randomInt(0, 1_000_000)).padStart(6, "0") : null;
  await db.insert(recordClaims).values({ userId: user.id, mobileHash, claimedName, method: input.method, whatsappCode: code, status: "pending" });
  await logActivity({ kind: "status", permission: "records", category: "records", title: `${user.name} asked to link past records`, detail: `Waiting for a check · method ${input.method} · ${claimedName}`, refType: "user", refId: user.id, actorId: user.id });
  return { status: "pending" as const, code, message: code ? "Send this code to us on WhatsApp from the same number." : "Sent to our team. We check claims within 24 hours." };
}

/** Pending claims for staff, with the names that exist on that number so they can pick the right one. */
export async function listClaims() {
  const rows = await db.select({
    id: recordClaims.id, claimedName: recordClaims.claimedName, method: recordClaims.method, whatsappCode: recordClaims.whatsappCode,
    createdAt: recordClaims.createdAt, mobileHash: recordClaims.mobileHash, userName: users.name, userEmail: users.email, userPhone: users.phone,
  }).from(recordClaims).innerJoin(users, eq(recordClaims.userId, users.id))
    .where(eq(recordClaims.status, "pending")).orderBy(recordClaims.createdAt).limit(200);
  const out = [];
  for (const row of rows) {
    const names = await db.selectDistinct({ name: customerRecords.name }).from(customerRecords).where(eq(customerRecords.mobileHash, row.mobileHash)).limit(50);
    out.push({ ...row, createdAt: row.createdAt.toISOString(), candidateNames: names.map((item) => item.name), overdue: Date.now() - row.createdAt.getTime() > 24 * 60 * 60_000 });
  }
  return { claims: out };
}

/** Staff approve (linking to one exact name on that number) or reject. */
export async function decideClaim(id: string, decision: "approve" | "reject", matchedName: string | undefined, actor: User) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new PublicError("Unknown claim.", 404);
  const [claim] = await db.select().from(recordClaims).where(and(eq(recordClaims.id, id), eq(recordClaims.status, "pending"))).limit(1);
  if (!claim) throw new PublicError("This claim is already decided.", 409);
  if (decision === "approve") {
    if (!matchedName) throw new PublicError("Choose the name on the records that this person is.", 400);
    const names = await db.selectDistinct({ name: customerRecords.name }).from(customerRecords).where(eq(customerRecords.mobileHash, claim.mobileHash)).limit(50);
    if (!names.some((item) => item.name === matchedName)) throw new PublicError("That name is not on the records for this number.", 400);
  }
  await db.update(recordClaims).set({ status: decision === "approve" ? "approved" : "rejected", matchedName: decision === "approve" ? matchedName ?? null : null, decidedBy: actor.id, decidedAt: new Date() }).where(eq(recordClaims.id, id));
  await logActivity({ kind: "status", permission: "records", category: "records", title: `${actor.name} ${decision === "approve" ? "linked" : "rejected"} a records claim`, detail: decision === "approve" ? `Linked to ${matchedName}` : `Claimed name ${claim.claimedName}`, refType: "claim", refId: id, actorId: actor.id });
  return { id, status: decision === "approve" ? "approved" : "rejected" };
}

/** The records this account is linked to (only the exact names that were approved). */
export async function linkedRecords(userId: string) {
  const claims = await db.select({ mobileHash: recordClaims.mobileHash, matchedName: recordClaims.matchedName }).from(recordClaims)
    .where(and(eq(recordClaims.userId, userId), eq(recordClaims.status, "approved")));
  const linked = claims.filter((claim) => claim.matchedName);
  if (!linked.length) return [];
  type Sealed = { mobile: string | null; whatsapp?: string | null; email?: string | null; address?: string | null; pan: string | null; fields?: Record<string, string> };
  const rows = [];
  for (const claim of linked) {
    const found = await db.select({ id: customerRecords.id, service: customerRecords.service, name: customerRecords.name, recordDate: customerRecords.recordDate,
      status: customerRecords.status, statusNote: customerRecords.statusNote, payloadEnc: customerRecords.payloadEnc })
      .from(customerRecords).where(and(eq(customerRecords.mobileHash, claim.mobileHash), eq(customerRecords.name, claim.matchedName!)))
      .orderBy(desc(customerRecords.recordDate)).limit(300);
    for (const row of found) {
      const data = open<Sealed>(row.payloadEnc);
      rows.push({
        id: row.id, service: row.service, serviceLabel: RECORD_SERVICES[row.service] ?? row.service, recordDate: row.recordDate,
        status: row.status, statusLabel: RECORD_STATUSES[row.status] ?? row.status, statusNote: row.statusNote ?? null,
        fields: customerFields(row.service, { name: row.name, mobile: data.mobile ?? null, whatsapp: data.whatsapp ?? null, email: data.email ?? null,
          address: data.address ?? null, pan: data.pan ?? null, statusLabel: RECORD_STATUSES[row.status] ?? row.status, statusNote: row.statusNote ?? null, fields: data.fields ?? {} }),
      });
    }
  }
  return rows;
}

