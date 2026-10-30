import { hash } from "@node-rs/argon2";
import { and, desc, eq, isNull, ne, notInArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { contactChangeRequests, sessions, users } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requestEmailOtp } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { isPlaceholderEmail } from "@/lib/mobile-login-core";
import { deliverNotifications, queueNotification } from "@/lib/notifications";
import { site } from "@/lib/site";
import { makeTempPassword } from "@/lib/staff";
import { normalizeEmail, normalizePhone, passwordProblem } from "@/lib/validation";

/**
 * Find a customer by email or mobile, see whether their email and mobile are verified, and help
 * them sign in: set a temporary password or resend the email sign-in code. Staff and admin accounts
 * are managed in Team, so they never appear here. Every change is written to the activity log.
 */

const NOT_CUSTOMER = ["admin", "staff"] as const;

export type CustomerRow = {
  id: string; name: string; email: string | null; phone: string | null;
  emailVerified: boolean; phoneVerified: boolean; mustChangePassword: boolean; createdAt: string;
};

/** Email and mobile for a change. An empty value means "none on the account". */
type ContactInput = { email: string | null; phone: string | null };

function toRow(row: typeof users.$inferSelect): CustomerRow {
  return {
    id: row.id,
    name: row.name,
    email: isPlaceholderEmail(row.email) ? null : row.email,
    phone: row.phone,
    emailVerified: Boolean(row.emailVerifiedAt),
    phoneVerified: Boolean(row.phoneVerifiedAt),
    mustChangePassword: Boolean(row.mustChangePassword),
    createdAt: row.createdAt.toISOString(),
  };
}

/** Search by exact email (contains "@") or by mobile number. Returns up to 20 customers. */
export async function searchCustomers(query: string): Promise<CustomerRow[]> {
  const text = query.trim();
  let match;
  if (text.includes("@")) {
    const email = normalizeEmail(text);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new PublicError("Enter a valid email address.", 400, { fields: { query: "Check the email." } });
    match = eq(users.email, email);
  } else {
    const phone = normalizePhone(text);
    if (!phone) throw new PublicError("Enter a valid email address or 10-digit mobile number.", 400, { fields: { query: "Check the email or mobile number." } });
    match = eq(users.phone, phone);
  }
  const rows = await db.select().from(users)
    .where(and(match, isNull(users.deletedAt), notInArray(users.role, [...NOT_CUSTOMER])))
    .limit(20);
  return rows.map(toRow);
}

async function customerOrThrow(id: string) {
  const [row] = await db.select().from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt), notInArray(users.role, [...NOT_CUSTOMER])))
    .limit(1);
  if (!row) throw new PublicError("Customer not found.", 404, { code: "not_found" });
  return row;
}

/** Sets a temporary password: the customer must change it at their next sign-in, and all their sessions end. */
export async function setCustomerTempPassword(id: string, custom: string | undefined, actor: { id: string; name?: string }) {
  const member = await customerOrThrow(id);
  const typed = (custom ?? "").trim();
  const tempPassword = typed || makeTempPassword();
  if (typed) {
    const problem = passwordProblem(typed, { email: member.email, name: member.name });
    if (problem) throw new PublicError(problem, 400, { fields: { password: problem } });
  }
  await db.update(users).set({ passwordHash: await hash(tempPassword), passwordChangedAt: new Date(), mustChangePassword: true, updatedAt: new Date() }).where(eq(users.id, id));
  await db.delete(sessions).where(eq(sessions.userId, id));
  const emailed = Boolean(member.email && !isPlaceholderEmail(member.email));
  if (emailed) {
    try {
      const notice = await queueNotification(id, "staff_alert", {
        email: member.email, subject: "Your NISE COMPORT temporary password",
        lines: [
          `${actor.name ?? "Our team"} has set a temporary password for your account.`,
          `Sign in at ${site.url}/login with your email address and this temporary password: ${tempPassword}`,
          "You will be asked to change it when you sign in.",
        ],
      });
      await deliverNotifications([notice]).catch(() => undefined);
    } catch (error) { console.error("[customers] temp password email failed", error); }
  }
  await logActivity({ kind: "staff", permission: "records", title: `${actor.name ?? "Staff"} set a temporary password for ${member.name}`, refType: "user", refId: id, actorId: actor.id });
  return { tempPassword, emailed };
}

/** Sends a new email sign-in code. Needs a real email address on the account. */
export async function resendCustomerEmailCode(id: string, actor: { id: string; name?: string }) {
  const member = await customerOrThrow(id);
  if (!member.email || isPlaceholderEmail(member.email)) throw new PublicError("This customer has no email address on their account yet.", 400, { code: "no_email" });
  await requestEmailOtp(member.email, "signin");
  await logActivity({ kind: "staff", permission: "records", title: `${actor.name ?? "Staff"} resent the email code to ${member.name}`, refType: "user", refId: id, actorId: actor.id });
  return { ok: true };
}

/**
 * Manually marks a customer's email or mobile as verified (or clears it). Staff can't change the
 * address or number itself here; they can only confirm it was checked, e.g. by phone at the counter.
 */
export async function setCustomerVerified(id: string, channel: "email" | "phone", verified: boolean, actor: { id: string; name?: string }) {
  const member = await customerOrThrow(id);
  if (channel === "email" && (!member.email || isPlaceholderEmail(member.email))) throw new PublicError("This customer has no email address on their account.", 400, { code: "no_email" });
  if (channel === "phone" && !member.phone) throw new PublicError("This customer has no mobile number on their account.", 400, { code: "no_phone" });
  const now = verified ? new Date() : null;
  if (channel === "email") await db.update(users).set({ emailVerifiedAt: now, updatedAt: new Date() }).where(eq(users.id, id));
  else await db.update(users).set({ phoneVerifiedAt: now, updatedAt: new Date() }).where(eq(users.id, id));
  const label = channel === "email" ? "email" : "mobile";
  await logActivity({ kind: "staff", permission: "records", title: `${actor.name ?? "Staff"} ${verified ? "marked" : "unmarked"} ${member.name}'s ${label} as verified manually`, refType: "user", refId: id, actorId: actor.id });
  return { ok: true, verified };
}

/**
 * Admin changes a customer's email and/or mobile number. Admin changes apply straight away; staff
 * changes wait for another admin. Either field may be left empty, but not both.
 */
export async function updateCustomerContact(id: string, input: { email: string; phone: string }, actor: { id: string; name?: string; role?: string | null }) {
  const member = await customerOrThrow(id);
  const next = await checkContactInput(id, input);
  if (actor.role !== "admin") return requestContactChange(member, next, actor);
  return applyContactChange(member, next, actor);
}

/** A customer with no email keeps a placeholder address. It ends in ".invalid" and is unique to the account. */
function storedEmailFor(id: string, email: string | null, current: string | null) {
  if (email) return email;
  if (isPlaceholderEmail(current)) return current as string;
  return `${id}@mobile.nisecomport.invalid`;
}

/** Validates the email and/or mobile number (at least one) and makes sure no other account already uses them. */
async function checkContactInput(id: string, input: { email: string | null; phone: string | null }): Promise<ContactInput> {
  const rawEmail = normalizeEmail(input.email ?? "");
  const rawPhone = (input.phone ?? "").trim();
  if (!rawEmail && !rawPhone) throw new PublicError("Enter an email address or a mobile number. Both can’t be empty.", 400, { code: "empty_contact" });

  let email: string | null = null;
  if (rawEmail) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(rawEmail)) throw new PublicError("Enter a valid email address.", 400, { fields: { email: "Check the email." } });
    email = rawEmail;
  }
  let phone: string | null = null;
  if (rawPhone) {
    phone = normalizePhone(rawPhone);
    if (!phone) throw new PublicError("Enter a valid 10-digit mobile number.", 400, { fields: { phone: "Check the number." } });
  }

  if (email) {
    const [clash] = await db.select({ id: users.id }).from(users)
      .where(and(ne(users.id, id), isNull(users.deletedAt), eq(users.email, email))).limit(1);
    if (clash) throw new PublicError("Another account already uses this email address.", 409, { code: "email_taken", fields: { email: "Already used." } });
  }
  if (phone) {
    const [clash] = await db.select({ id: users.id }).from(users)
      .where(and(ne(users.id, id), isNull(users.deletedAt), eq(users.phone, phone))).limit(1);
    if (clash) throw new PublicError("Another account already uses this mobile number.", 409, { code: "phone_taken", fields: { phone: "Already used." } });
  }
  return { email, phone };
}

/** Staff request: stored for an admin to approve. Nothing changes on the account yet. */
async function requestContactChange(member: typeof users.$inferSelect, next: ContactInput, actor: { id: string; name?: string }) {
  const storedEmail = storedEmailFor(member.id, next.email, member.email);
  if (storedEmail === member.email && next.phone === member.phone) return { ok: true, changed: false, pending: false };
  const [open] = await db.select({ id: contactChangeRequests.id }).from(contactChangeRequests)
    .where(and(eq(contactChangeRequests.userId, member.id), eq(contactChangeRequests.kind, "change"), eq(contactChangeRequests.status, "pending"))).limit(1);
  if (open) throw new PublicError("A change for this customer is already waiting for admin approval.", 409, { code: "already_pending" });
  await db.insert(contactChangeRequests).values({ userId: member.id, newEmail: storedEmail, newPhone: next.phone, requestedById: actor.id });
  await logActivity({ kind: "staff", permission: "records", title: `${actor.name ?? "Staff"} asked an admin to approve an email or mobile change for ${member.name}`, refType: "user", refId: member.id, actorId: actor.id });
  return { ok: true, changed: false, pending: true };
}

/** Applies an email and/or mobile change to the account. Used for admin edits and approved requests. */
async function applyContactChange(member: typeof users.$inferSelect, next: ContactInput, actor: { id: string; name?: string }) {
  const id = member.id;
  const email = storedEmailFor(id, next.email, member.email);
  const phone = next.phone;
  const oldEmail = member.email && !isPlaceholderEmail(member.email) ? member.email : null;
  const emailChanged = email !== member.email;
  const phoneChanged = phone !== member.phone;
  if (!emailChanged && !phoneChanged) return { ok: true, changed: false };

  await db.update(users).set({
    email,
    phone,
    emailVerifiedAt: emailChanged ? null : member.emailVerifiedAt,
    phoneVerifiedAt: phoneChanged ? null : member.phoneVerifiedAt,
    updatedAt: new Date(),
  }).where(eq(users.id, id));

  if (emailChanged && oldEmail) {
    try {
      const notice = await queueNotification(id, "staff_alert", {
        email: oldEmail, subject: "Your NISE COMPORT email address was changed",
        lines: [
          `${actor.name ?? "Our team"} changed the email address on your NISE COMPORT account.`,
          "If this was not expected, please contact the shop straight away.",
        ],
      });
      await deliverNotifications([notice]).catch(() => undefined);
    } catch (error) { console.error("[customers] email change notice failed", error); }
  }

  const changed = [emailChanged ? "email" : null, phoneChanged ? "mobile number" : null].filter(Boolean).join(" and ");
  await logActivity({ kind: "staff", permission: "records", title: `${actor.name ?? "Staff"} changed the ${changed} of ${member.name}`, refType: "user", refId: id, actorId: actor.id });
  return { ok: true, changed: true };
}

export type ContactChange = {
  id: string; kind: string; status: string; newEmail: string | null; newPhone: string | null; requestedAt: string; requestedById: string; requestedBy: string;
  customerName: string; customerEmail: string | null; customerPhone: string | null; decisionNote: string | null; decidedAt: string | null; decidedBy: string | null;
};

/** Staff email/mobile changes: pending first, then the latest decisions. Any staff with records access can see them. */
export async function listContactChanges(actor: { id: string; role?: string | null }) {
  try {
    return await loadContactChanges(actor);
  } catch (error) {
    // Until migration 0039 (contact_change_requests) is applied, search must still work: show an empty list.
    if ((error as { cause?: { code?: string } })?.cause?.code === "42P01") return { requests: [] as ContactChange[], me: actor.id, isAdmin: actor.role === "admin" };
    throw error;
  }
}

async function loadContactChanges(actor: { id: string; role?: string | null }) {
  const requester = alias(users, "contact_requester");
  const decider = alias(users, "contact_decider");
  const rows = await db.select({
    id: contactChangeRequests.id, kind: contactChangeRequests.kind, status: contactChangeRequests.status, newEmail: contactChangeRequests.newEmail,
    newPhone: contactChangeRequests.newPhone, requestedAt: contactChangeRequests.requestedAt, requestedById: contactChangeRequests.requestedById,
    requestedBy: requester.name, decidedBy: decider.name, customerName: users.name, customerEmail: users.email, customerPhone: users.phone,
    decisionNote: contactChangeRequests.decisionNote, decidedAt: contactChangeRequests.decidedAt,
  }).from(contactChangeRequests)
    .innerJoin(users, eq(users.id, contactChangeRequests.userId))
    .leftJoin(requester, eq(requester.id, contactChangeRequests.requestedById))
    .leftJoin(decider, eq(decider.id, contactChangeRequests.decidedById))
    .orderBy(desc(contactChangeRequests.requestedAt))
    .limit(40);
  const requests: ContactChange[] = rows.map((row) => ({
    ...row,
    newEmail: row.newEmail && !isPlaceholderEmail(row.newEmail) ? row.newEmail : null,
    customerEmail: row.customerEmail && !isPlaceholderEmail(row.customerEmail) ? row.customerEmail : null,
    requestedBy: row.requestedBy ?? "Staff",
    decidedBy: row.decidedBy ?? null,
    requestedAt: row.requestedAt.toISOString(),
    decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
  }));
  return { requests, me: actor.id, isAdmin: actor.role === "admin" };
}

/** Admin approves or rejects a staff request. An admin can't approve a request they made. */
export async function decideContactChange(requestId: string, decision: "approve" | "reject", note: string, actor: { id: string; name?: string; role?: string | null }) {
  if (actor.role !== "admin") throw new PublicError("Only an admin can approve or reject this change.", 403, { code: "forbidden" });
  const [request] = await db.select().from(contactChangeRequests).where(eq(contactChangeRequests.id, requestId)).limit(1);
  if (!request) throw new PublicError("This change request was not found.", 404, { code: "not_found" });
  if (request.status !== "pending") throw new PublicError("This change has already been decided.", 409, { code: "already_decided" });
  if (request.requestedById === actor.id) throw new PublicError("You can’t approve a change you asked for. Another admin must approve it.", 403, { code: "own_request" });

  const decisionNote = note.trim() || null;
  if (decision === "reject") {
    await db.update(contactChangeRequests).set({ status: "rejected", decidedById: actor.id, decidedAt: new Date(), decisionNote })
      .where(and(eq(contactChangeRequests.id, requestId), eq(contactChangeRequests.status, "pending")));
    await logActivity({ kind: "staff", permission: "records", title: `${actor.name ?? "Admin"} rejected an email or mobile change request`, refType: "user", refId: request.userId, actorId: actor.id });
    return { ok: true, status: "rejected" };
  }

  if (request.kind !== "change") {
    // Verification request: confirm the existing email or mobile, without changing the value.
    const verifyChannel = request.kind === "verify-email" ? "email" : "phone";
    await db.update(users)
      .set(verifyChannel === "email" ? { emailVerifiedAt: new Date(), updatedAt: new Date() } : { phoneVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, request.userId));
    await db.update(contactChangeRequests).set({ status: "approved", decidedById: actor.id, decidedAt: new Date(), decisionNote })
      .where(and(eq(contactChangeRequests.id, requestId), eq(contactChangeRequests.status, "pending")));
    await logActivity({ kind: "staff", permission: "records", title: `${actor.name ?? "Admin"} approved a ${verifyChannel} verification request`, refType: "user", refId: request.userId, actorId: actor.id });
    return { ok: true, status: "approved" };
  }

  const member = await customerOrThrow(request.userId);
  const next = await checkContactInput(request.userId, { email: request.newEmail, phone: request.newPhone });
  await applyContactChange(member, next, actor);
  await db.update(contactChangeRequests).set({ status: "approved", decidedById: actor.id, decidedAt: new Date(), decisionNote })
    .where(and(eq(contactChangeRequests.id, requestId), eq(contactChangeRequests.status, "pending")));
  return { ok: true, status: "approved" };
}
