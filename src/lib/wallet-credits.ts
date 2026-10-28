import { desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { users, walletCreditRequests, walletEntries } from "@/db/schema";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";

/**
 * Wallet credits are two steps: one admin requests with a reason, a different admin approves.
 * Only the approval writes to the wallet, in the same transaction, so nothing posts unchecked.
 */

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Rupees typed by staff → whole paise. Rejects zero, negatives, more than two decimals and oversized amounts. */
export function toPaise(rupees: number) {
  if (!Number.isFinite(rupees) || rupees <= 0 || rupees > 1_000_000) throw new PublicError("Enter an amount between ₹1 and ₹10,00,000.", 400, { fields: { amount: "Check the amount." } });
  const paise = Math.round(rupees * 100);
  if (Math.abs(paise - rupees * 100) > 0.001) throw new PublicError("Use at most two decimal places.", 400, { fields: { amount: "Check the amount." } });
  return paise;
}

/** The comment that says why the credit is being made. Required on every request. */
export function cleanReason(value: string) {
  const reason = value.trim();
  if (reason.length < 10) throw new PublicError("Write why this credit is being made (at least 10 characters).", 400, { fields: { reason: "Explain why." } });
  return reason.slice(0, 180);
}

/** Opens a credit request. Posts nothing to the wallet. */
export async function createCreditRequest(tx: Tx, input: { userId: string; requestedById: string; paise: number; reason: string }) {
  const [request] = await tx.insert(walletCreditRequests).values({
    userId: input.userId, requestedById: input.requestedById, amount: (input.paise / 100).toFixed(2), reason: input.reason,
  }).returning({ id: walletCreditRequests.id, status: walletCreditRequests.status });
  if (!request) throw new PublicError("Could not record the request. Please try again.", 500);
  return request;
}

/** Approves or rejects a pending request. Approval needs a different admin than the one who asked. */
export async function decideCreditRequest(input: { actorId: string; id: string; decision: "approve" | "reject"; note: string }) {
  const note = input.note.trim();
  if (note.length < 5) throw new PublicError("Add a short note for this decision.", 400, { fields: { note: "Add a note." } });
  return db.transaction(async (tx) => {
    const [request] = await tx.select().from(walletCreditRequests).where(eq(walletCreditRequests.id, input.id)).limit(1).for("update");
    if (!request) throw new PublicError("This request no longer exists.", 404);
    if (request.status !== "pending") throw new PublicError("This request has already been decided.", 409, { code: "already_decided" });
    if (request.requestedById === input.actorId) throw new PublicError("A second admin must decide this. You can’t approve your own request.", 403, { code: "same_admin" });
    const [requester] = await tx.select({ name: users.name }).from(users).where(eq(users.id, request.requestedById)).limit(1);
    const [approver] = await tx.select({ name: users.name }).from(users).where(eq(users.id, input.actorId)).limit(1);
    let walletEntryId: string | null = null;
    if (input.decision === "approve") {
      const [entry] = await tx.insert(walletEntries).values({
        userId: request.userId, amount: request.amount, kind: "credit",
        description: `Credit: ${request.reason} · requested by ${requester?.name ?? "admin"} · approved by ${approver?.name ?? "admin"}`.slice(0, 500),
        reference: `credit-request:${request.id}`,
      }).returning({ id: walletEntries.id });
      walletEntryId = entry?.id ?? null;
    }
    const [updated] = await tx.update(walletCreditRequests).set({
      status: input.decision === "approve" ? "approved" : "rejected",
      decidedById: input.actorId, decidedAt: new Date(), decisionNote: note, walletEntryId,
    }).where(eq(walletCreditRequests.id, request.id)).returning({ id: walletCreditRequests.id, status: walletCreditRequests.status });
    return updated;
  });
}

/** Pending requests first, then the latest decisions. Shows who asked and who decided. */
export async function listCreditRequests() {
  const requester = alias(users, "requester");
  const decider = alias(users, "decider");
  return db.select({
    id: walletCreditRequests.id, amount: walletCreditRequests.amount, reason: walletCreditRequests.reason,
    status: walletCreditRequests.status, requestedAt: walletCreditRequests.requestedAt, requestedById: walletCreditRequests.requestedById,
    decidedAt: walletCreditRequests.decidedAt, decisionNote: walletCreditRequests.decisionNote,
    customerName: users.name, customerPhone: users.phone,
    requestedBy: requester.name, decidedBy: decider.name,
  }).from(walletCreditRequests)
    .innerJoin(users, eq(users.id, walletCreditRequests.userId))
    .innerJoin(requester, eq(requester.id, walletCreditRequests.requestedById))
    .leftJoin(decider, eq(decider.id, walletCreditRequests.decidedById))
    .orderBy(sql`case when ${walletCreditRequests.status} = 'pending' then 0 else 1 end`, desc(walletCreditRequests.requestedAt))
    .limit(40);
}
