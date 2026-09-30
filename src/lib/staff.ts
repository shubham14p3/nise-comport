import { randomBytes } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { sessions, users } from "@/db/schema";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { deliverNotifications, queueNotification } from "@/lib/notifications";
import { sanitizePermissions, type Permission } from "@/lib/permissions";
import { site } from "@/lib/site";
import { cleanName, looksLikeEmail, normalizeEmail } from "@/lib/validation";

export type StaffMember = { id: string; name: string; email: string; phone: string | null; role: string; permissions: Permission[]; verified: boolean; createdAt: string };

export async function listStaff(): Promise<StaffMember[]> {
  const rows = await db.select().from(users).where(and(inArray(users.role, ["admin", "staff"]), isNull(users.deletedAt))).orderBy(asc(users.role), asc(users.name));
  return rows.map((row) => ({
    id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role,
    permissions: row.role === "admin" ? [] : sanitizePermissions(row.permissions), verified: Boolean(row.emailVerifiedAt), createdAt: row.createdAt.toISOString(),
  }));
}

/**
 * Gives someone staff access. An existing customer account becomes staff; a new email gets an
 * account without a usable password: they sign in with "Sign in with an email code" and can set a
 * password from their profile. They get an email either way.
 */
export async function addStaff(input: { email: string; name: string; permissions: string[] }, actor: { id: string; name: string }) {
  const email = normalizeEmail(input.email);
  if (!looksLikeEmail(email)) throw new PublicError("Enter a valid email address.", 400, { fields: { email: "Enter a valid email address." } });
  const permissions = sanitizePermissions(input.permissions);
  if (!permissions.length) throw new PublicError("Tick at least one thing this person may do.", 400, { fields: { permissions: "Choose at least one." } });
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  let userId: string;
  let created = false;
  if (existing) {
    if (existing.deletedAt || existing.disabledAt) throw new PublicError("This account is closed or disabled. Use another email address.", 409);
    if (existing.role === "admin") throw new PublicError("This person is already an administrator.", 409);
    if (existing.role === "demo") throw new PublicError("The demo account can’t be staff.", 409);
    await db.update(users).set({ role: "staff", permissions, updatedAt: new Date() }).where(eq(users.id, existing.id));
    userId = existing.id;
  } else {
    const name = cleanName(input.name ?? "");
    if (name.length < 2) throw new PublicError("Enter the person’s name.", 400, { fields: { name: "Enter a name." } });
    // Unusable random password: they sign in with an email code the first time.
    const passwordHash = await hash(randomBytes(32).toString("base64url"));
    const [row] = await db.insert(users).values({ email, name, passwordHash, role: "staff", permissions }).returning({ id: users.id });
    userId = row.id;
    created = true;
  }
  try {
    const id = await queueNotification(userId, "staff_alert", {
      email,
      subject: "You’ve been added to the NISE COMPORT team",
      lines: [
        `${actor.name} has given you staff access to the NISE COMPORT website.`,
        created
          ? `To sign in, open ${site.url}/login, type this email address and choose “Sign in with an email code”. You can set a password afterwards from your profile.`
          : `Sign in at ${site.url}/login with your usual password or an email code, then open the staff dashboard.`,
        "If you weren’t expecting this, please tell the shop owner.",
      ],
    });
    await deliverNotifications([id]).catch(() => undefined);
  } catch (error) { console.error("[staff] invite email failed", error); }
  return { id: userId, created };
}

export async function updateStaff(id: string, patch: { permissions?: string[]; remove?: boolean }, actor: { id: string }) {
  if (id === actor.id) throw new PublicError("You can’t change your own access here.", 400);
  const [member] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!member || member.role !== "staff") throw new PublicError("Staff member not found.", 404, { code: "not_found" });
  if (patch.remove) {
    await db.update(users).set({ role: "customer", permissions: [], updatedAt: new Date() }).where(eq(users.id, id));
    // Sign them out everywhere so the removal takes effect immediately.
    await db.delete(sessions).where(eq(sessions.userId, id));
    return { removed: true };
  }
  const permissions = sanitizePermissions(patch.permissions);
  if (!permissions.length) throw new PublicError("Keep at least one permission, or remove the person from the team.", 400);
  await db.update(users).set({ permissions, updatedAt: new Date() }).where(eq(users.id, id));
  return { removed: false };
}
