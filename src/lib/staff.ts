import { randomBytes } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { sessions, users } from "@/db/schema";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { PublicError } from "@/lib/errors";
import { deliverNotifications, queueNotification } from "@/lib/notifications";
import { sanitizePermissions, type Permission } from "@/lib/permissions";
import { sanitizeServices } from "@/lib/record-access";
import { site } from "@/lib/site";
import { cleanName, looksLikeEmail, normalizeEmail } from "@/lib/validation";

export type StaffMember = { id: string; name: string; email: string; phone: string | null; role: string; permissions: Permission[]; recordServices: string[] | null; verified: boolean; createdAt: string };

export async function listStaff(): Promise<StaffMember[]> {
  const rows = await db.select().from(users).where(and(inArray(users.role, ["admin", "staff"]), isNull(users.deletedAt))).orderBy(asc(users.role), asc(users.name));
  return rows.map((row) => ({
    id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role,
    permissions: row.role === "admin" ? [] : sanitizePermissions(row.permissions), recordServices: row.role === "admin" ? null : sanitizeServices(row.recordServices), verified: Boolean(row.emailVerifiedAt), createdAt: row.createdAt.toISOString(),
  }));
}

/**
 * Gives someone staff access. An existing customer account becomes staff; a new email gets an
 * account without a usable password: they sign in with "Sign in with an email code" and can set a
 * password from their profile. They get an email either way.
 */
export async function addStaff(input: { email: string; name: string; permissions: string[]; recordServices?: string[] | null }, actor: { id: string; name: string }) {
  const email = normalizeEmail(input.email);
  if (!looksLikeEmail(email)) throw new PublicError("Enter a valid email address.", 400, { fields: { email: "Enter a valid email address." } });
  const permissions = sanitizePermissions(input.permissions);
  const recordServices = serviceChoice(input.recordServices);
  if (!permissions.length) throw new PublicError("Tick at least one thing this person may do.", 400, { fields: { permissions: "Choose at least one." } });
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  let userId: string;
  let created = false;
  if (existing) {
    if (existing.deletedAt || existing.disabledAt) throw new PublicError("This account is closed or disabled. Use another email address.", 409);
    if (existing.role === "admin") throw new PublicError("This person is already an administrator.", 409);
    if (existing.role === "demo") throw new PublicError("The demo account can’t be staff.", 409);
    await db.update(users).set({ role: "staff", permissions, recordServices, updatedAt: new Date() }).where(eq(users.id, existing.id));
    userId = existing.id;
  } else {
    const name = cleanName(input.name ?? "");
    if (name.length < 2) throw new PublicError("Enter the person’s name.", 400, { fields: { name: "Enter a name." } });
    // Unusable random password: they sign in with an email code the first time.
    const passwordHash = await hash(randomBytes(32).toString("base64url"));
    const [row] = await db.insert(users).values({ email, name, passwordHash, role: "staff", permissions, recordServices }).returning({ id: users.id });
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
  await logActivity({ kind: "staff", permission: "team", title: `${actor.name} added ${existing?.name ?? input.name ?? email} to the team`, detail: permissions.join(", "), refType: "user", refId: userId, actorId: actor.id });
  return { id: userId, created };
}

/** null/undefined = every service (the default); a list = only those; an empty list is refused. */
function serviceChoice(value: string[] | null | undefined): string[] | null {
  if (value === null || value === undefined) return null;
  const list = sanitizeServices(value) ?? [];
  if (!list.length) throw new PublicError("Choose at least one service, or allow all services.", 400, { fields: { recordServices: "Choose at least one service." } });
  return list;
}

export async function updateStaff(id: string, patch: { permissions?: string[]; recordServices?: string[] | null; remove?: boolean }, actor: { id: string; name?: string }) {
  if (id === actor.id) throw new PublicError("You can’t change your own access here.", 400);
  const [member] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!member || member.role !== "staff") throw new PublicError("Staff member not found.", 404, { code: "not_found" });
  if (patch.remove) {
    await db.update(users).set({ role: "customer", permissions: [], updatedAt: new Date() }).where(eq(users.id, id));
    // Sign them out everywhere so the removal takes effect immediately.
    await db.delete(sessions).where(eq(sessions.userId, id));
    await logActivity({ kind: "staff", permission: "team", title: `${actor.name ?? "Owner"} removed ${member.name} from the team`, refType: "user", refId: id, actorId: actor.id });
    return { removed: true };
  }
  const permissions = sanitizePermissions(patch.permissions);
  if (!permissions.length) throw new PublicError("Keep at least one permission, or remove the person from the team.", 400);
  // recordServices left out = unchanged; null = every service; a list = only those services.
  const services = patch.recordServices === undefined ? undefined : serviceChoice(patch.recordServices);
  await db.update(users).set({ permissions, ...(services === undefined ? {} : { recordServices: services }), updatedAt: new Date() }).where(eq(users.id, id));
  const scope = services === undefined ? sanitizeServices(member.recordServices) : services;
  await logActivity({ kind: "staff", permission: "team", title: `${actor.name ?? "Owner"} changed ${member.name}'s access`, detail: `${permissions.join(", ")} · ${scope ? `services: ${scope.join(", ")}` : "all services"}`, refType: "user", refId: id, actorId: actor.id });
  return { removed: false };
}
