import { and, eq, isNull, notInArray } from "drizzle-orm";
import { contactChangeRequests, users } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { checkContactVerifyCode, sendContactVerifyCode } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { isPlaceholderEmail } from "@/lib/mobile-login-core";

/**
 * Counter desk: confirm a customer's email or mobile on the spot (after they confirm it in front of
 * staff), send a 6-digit code to their email that they read out, or ask an admin to approve the
 * verification. Every step is recorded in the activity log with the staff member's name.
 */
type Actor = { id: string; name?: string | null };
type Channel = "email" | "phone";
const LABEL: Record<Channel, string> = { email: "email", phone: "mobile number" };

async function customerRow(userId: string) {
  const [row] = await db.select().from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt), notInArray(users.role, ["admin", "staff"]))).limit(1);
  if (!row) throw new PublicError("Customer not found.", 404, { code: "not_found" });
  return row;
}

function realEmail(email: string) { return isPlaceholderEmail(email) ? null : email; }

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 1)}${"*".repeat(Math.max(2, name.length - 1))}@${domain}`;
}

function needValue(row: typeof users.$inferSelect, channel: Channel) {
  if (channel === "email" && !realEmail(row.email)) throw new PublicError("This customer has no email address. Add one in Find customer first.", 400, { code: "no_email" });
  if (channel === "phone" && !row.phone) throw new PublicError("This customer has no mobile number. Add one in Find customer first.", 400, { code: "no_phone" });
}

function alreadyVerified(row: typeof users.$inferSelect, channel: Channel) {
  return channel === "email" ? Boolean(row.emailVerifiedAt) : Boolean(row.phoneVerifiedAt);
}

/** Staff ticked "the customer confirmed this in front of me". */
export async function confirmAtCounter(userId: string, channel: Channel, actor: Actor) {
  const row = await customerRow(userId);
  needValue(row, channel);
  if (alreadyVerified(row, channel)) return { ok: true, alreadyVerified: true };
  await db.update(users)
    .set(channel === "email" ? { emailVerifiedAt: new Date(), updatedAt: new Date() } : { phoneVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
  await logActivity({ kind: "staff", permission: "records", title: `${actor.name ?? "Staff"} verified ${row.name}'s ${LABEL[channel]} at the counter (customer confirmed)`, refType: "user", refId: userId, actorId: actor.id });
  return { ok: true, alreadyVerified: false };
}

/** Sends the 6-digit code to the customer's email. The customer reads it out; staff type it in. */
export async function sendCounterCode(userId: string, actor: Actor) {
  const row = await customerRow(userId);
  needValue(row, "email");
  if (alreadyVerified(row, "email")) return { ok: true, sentTo: null, alreadyVerified: true };
  await sendContactVerifyCode(row.email, actor.id);
  await logActivity({ kind: "staff", permission: "records", title: `${actor.name ?? "Staff"} sent a confirmation code to ${row.name}'s email`, refType: "user", refId: userId, actorId: actor.id });
  return { ok: true, sentTo: maskEmail(row.email), alreadyVerified: false };
}

/** Checks the code the customer read out. A correct code verifies the email. */
export async function checkCounterCode(userId: string, code: string, actor: Actor) {
  const row = await customerRow(userId);
  needValue(row, "email");
  await checkContactVerifyCode(row.email, code, actor.id);
  await db.update(users).set({ emailVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, userId));
  await logActivity({ kind: "staff", permission: "records", title: `${actor.name ?? "Staff"} verified ${row.name}'s email with the customer's code`, refType: "user", refId: userId, actorId: actor.id });
  return { ok: true };
}

/** Puts a verification request in the approvals list for an admin. */
export async function requestCounterVerification(userId: string, channel: Channel, actor: Actor) {
  const row = await customerRow(userId);
  needValue(row, channel);
  if (alreadyVerified(row, channel)) throw new PublicError(`This ${LABEL[channel]} is already verified.`, 409, { code: "already_verified" });
  const kind = channel === "email" ? "verify-email" : "verify-phone";
  const [open] = await db.select({ id: contactChangeRequests.id }).from(contactChangeRequests)
    .where(and(eq(contactChangeRequests.userId, userId), eq(contactChangeRequests.kind, kind), eq(contactChangeRequests.status, "pending"))).limit(1);
  if (open) throw new PublicError(`A ${LABEL[channel]} verification is already waiting for admin approval.`, 409, { code: "already_pending" });
  await db.insert(contactChangeRequests).values({ userId, kind, newEmail: row.email, newPhone: row.phone, requestedById: actor.id });
  await logActivity({ kind: "staff", permission: "records", title: `${actor.name ?? "Staff"} asked an admin to verify ${row.name}'s ${LABEL[channel]}`, refType: "user", refId: userId, actorId: actor.id });
  return { ok: true, pending: true };
}
