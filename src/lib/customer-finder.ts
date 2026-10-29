import { hash } from "@node-rs/argon2";
import { and, eq, isNull, notInArray } from "drizzle-orm";
import { sessions, users } from "@/db/schema";
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
