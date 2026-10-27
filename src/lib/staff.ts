import { randomBytes, randomInt } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { emailOtps, sessions, users } from "@/db/schema";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { PublicError } from "@/lib/errors";
import { deliverNotifications, queueNotification } from "@/lib/notifications";
import { sanitizePermissions, sanitizeScope, SCOPE_PREFIX, type Permission } from "@/lib/permissions";
import { serviceCatalog } from "@/lib/services";
import { site } from "@/lib/site";
import { openWorkCount } from "@/lib/auth";
import { cleanName, looksLikeEmail, normalizeEmail, normalizePhone, passwordProblem } from "@/lib/validation";

export type StaffMember = { id: string; name: string; email: string; phone: string | null; role: string; permissions: Permission[]; categories: string[]; verified: boolean; createdAt: string; disabled: boolean; tempPassword: boolean };

export async function listStaff(): Promise<StaffMember[]> {
  const rows = await db.select().from(users).where(and(inArray(users.role, ["admin", "staff"]), isNull(users.deletedAt))).orderBy(asc(users.role), asc(users.name));
  return rows.map((row) => ({
    id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role,
    permissions: row.role === "admin" ? [] : sanitizePermissions(row.permissions), categories: row.role === "admin" ? [] : sanitizeScope(row.permissions), verified: Boolean(row.emailVerifiedAt), createdAt: row.createdAt.toISOString(), disabled: Boolean(row.disabledAt), tempPassword: row.mustChangePassword,
  }));
}

const TEMP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/** A readable one-time password (no look-alike characters) that always passes the password rules. */
export function makeTempPassword() {
  let value = "";
  for (let i = 0; i < 10; i += 1) value += TEMP_ALPHABET[randomInt(TEMP_ALPHABET.length)];
  return `${value}#${randomInt(10, 99)}`;
}

function cleanPhoneInput(value: string | undefined | null) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const phone = normalizePhone(raw);
  if (!phone) throw new PublicError("Enter a valid mobile number.", 400, { fields: { phone: "Enter a valid mobile number." } });
  return phone;
}

function chooseTempPassword(custom: string | undefined, context: { email: string; name: string }) {
  const value = (custom ?? "").trim();
  if (!value) return makeTempPassword();
  const problem = passwordProblem(value, context);
  if (problem) throw new PublicError(problem, 400, { fields: { password: problem } });
  return value;
}

async function sendAccessEmail(userId: string, email: string, subject: string, lines: string[]) {
  try {
    const id = await queueNotification(userId, "staff_alert", { email, subject, lines });
    await deliverNotifications([id]).catch(() => undefined);
  } catch (error) { console.error("[staff] access email failed", error); }
}

const roleWord = (role: string) => (role === "admin" ? "an owner (administrator)" : "a staff member");

/**
 * Gives someone access. An existing customer account becomes staff or owner and keeps their own
 * password. A new person gets an account with a temporary password (generated, or the one the owner
 * typed) that is emailed to them and shown to the owner once; they must replace it after signing in.
 */
/** Turns what the form sent ("requests", "scope:pan-card" …) into the stored list, checking category names. */
function storedAccess(input: unknown) {
  const permissions = sanitizePermissions(input);
  const categories = sanitizeScope(input);
  const known = new Set(serviceCatalog.map((group) => group.slug));
  const unknown = categories.filter((slug) => !known.has(slug));
  if (unknown.length) throw new PublicError("One of the service categories is not recognised. Refresh the page and try again.", 400);
  // Category limits only mean something for requests, so keep them only when requests is ticked.
  const scoped = permissions.includes("requests") ? categories : [];
  return { permissions, categories: scoped, stored: [...permissions, ...scoped.map((slug) => `${SCOPE_PREFIX}${slug}`)] };
}

export async function addStaff(
  input: { email: string; name: string; phone?: string; role?: "staff" | "admin"; permissions: string[]; password?: string },
  actor: { id: string; name: string },
) {
  const role = input.role === "admin" ? "admin" : "staff";
  const email = normalizeEmail(input.email);
  if (!looksLikeEmail(email)) throw new PublicError("Enter a valid email address.", 400, { fields: { email: "Enter a valid email address." } });
  const access = role === "admin" ? { permissions: [] as Permission[], categories: [] as string[], stored: [] as string[] } : storedAccess(input.permissions);
  const { permissions, stored } = access;
  if (role === "staff" && !permissions.length) throw new PublicError("Tick at least one thing this person may do.", 400, { fields: { permissions: "Choose at least one." } });
  const phone = cleanPhoneInput(input.phone);
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  let userId: string;
  let tempPassword: string | null = null;
  let displayName = input.name;
  if (existing) {
    if (existing.deletedAt || existing.disabledAt) throw new PublicError("This account is closed or disabled. Use another email address.", 409);
    if (existing.role === "admin") throw new PublicError("This person is already an owner.", 409);
    if (existing.role === "demo") throw new PublicError("The demo account can’t be staff.", 409);
    if (existing.role === "staff" && role === "staff") throw new PublicError("This person is already on the team. Edit them in the list below.", 409);
    await db.update(users).set({ role, permissions: stored, ...(phone ? { phone } : {}), updatedAt: new Date() }).where(eq(users.id, existing.id));
    userId = existing.id;
    displayName = existing.name;
  } else {
    const name = cleanName(input.name ?? "");
    if (name.length < 2) throw new PublicError("Enter the person’s name.", 400, { fields: { name: "Enter a name." } });
    tempPassword = chooseTempPassword(input.password, { email, name });
    const [row] = await db.insert(users).values({
      email, name, phone, role, permissions: stored, passwordHash: await hash(tempPassword), mustChangePassword: true, emailVerifiedAt: new Date(),
    }).returning({ id: users.id });
    userId = row.id;
    displayName = name;
  }
  await sendAccessEmail(userId, email, "You’ve been added to the NISE COMPORT team", [
    `${actor.name} has made you ${roleWord(role)} on the NISE COMPORT website.`,
    tempPassword
      ? `Sign in at ${site.url}/login with your email address and this temporary password: ${tempPassword}`
      : `Sign in at ${site.url}/login with your usual password or an email code, then open the staff dashboard.`,
    ...(tempPassword ? ["For safety, change it straight away: Profile → Security → Change password."] : []),
    "If you weren’t expecting this, please tell the shop owner.",
  ]);
  await logActivity({ kind: "staff", permission: "team", title: `${actor.name} added ${displayName} to the team as ${role === "admin" ? "an owner" : "staff"}`, detail: permissions.join(", ") || null, refType: "user", refId: userId, actorId: actor.id });
  return { id: userId, created: Boolean(tempPassword), tempPassword };
}

type StaffPatch = { name?: string; email?: string; phone?: string | null; role?: "staff" | "admin"; permissions?: string[]; disabled?: boolean; remove?: boolean };

async function adminCount() {
  const rows = await db.select({ id: users.id }).from(users).where(and(eq(users.role, "admin"), isNull(users.deletedAt), isNull(users.disabledAt)));
  return rows.length;
}

export async function updateStaff(id: string, patch: StaffPatch, actor: { id: string; name?: string }) {
  const by = actor.name ?? "Owner";
  const [member] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!member || member.deletedAt || (member.role !== "staff" && member.role !== "admin")) throw new PublicError("Team member not found.", 404, { code: "not_found" });
  const self = id === actor.id;
  const set: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
  const notes: string[] = [];

  if (patch.remove) {
    if (self) throw new PublicError("You can’t remove yourself.", 400);
    if (member.role === "admin" && (await adminCount()) <= 1) throw new PublicError("Keep at least one owner.", 400);
    await db.update(users).set({ role: "customer", permissions: [], updatedAt: new Date() }).where(eq(users.id, id));
    await db.delete(sessions).where(eq(sessions.userId, id));
    await logActivity({ kind: "staff", permission: "team", title: `${by} removed ${member.name} from the team`, refType: "user", refId: id, actorId: actor.id });
    return { removed: true };
  }

  if (patch.name !== undefined) {
    const name = cleanName(patch.name);
    if (name.length < 2) throw new PublicError("Enter a name.", 400, { fields: { name: "Enter a name." } });
    if (name !== member.name) { set.name = name; notes.push("name"); }
  }
  if (patch.email !== undefined) {
    const email = normalizeEmail(patch.email);
    if (!looksLikeEmail(email)) throw new PublicError("Enter a valid email address.", 400, { fields: { email: "Enter a valid email address." } });
    if (email !== member.email) {
      const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (taken) throw new PublicError("Another account already uses this email address.", 409, { fields: { email: "Already in use." } });
      set.email = email; set.emailVerifiedAt = null; notes.push("email");
    }
  }
  if (patch.phone !== undefined) {
    const phone = cleanPhoneInput(patch.phone);
    if (phone !== member.phone) { set.phone = phone; set.phoneVerifiedAt = null; notes.push("mobile"); }
  }
  const nextRole = patch.role ?? (member.role as "staff" | "admin");
  if (nextRole !== member.role) {
    if (self) throw new PublicError("You can’t change your own role.", 400);
    if (member.role === "admin" && (await adminCount()) <= 1) throw new PublicError("Keep at least one owner.", 400);
    set.role = nextRole; notes.push(`role → ${nextRole === "admin" ? "owner" : "staff"}`);
  }
  if (nextRole === "admin") {
    if (member.permissions.length) set.permissions = [];
  } else if (patch.permissions !== undefined || nextRole !== member.role) {
    const access = storedAccess(patch.permissions ?? member.permissions);
    if (!access.permissions.length) throw new PublicError("Keep at least one permission, or remove the person from the team.", 400);
    set.permissions = access.stored; notes.push("access");
  }
  if (patch.disabled !== undefined && Boolean(member.disabledAt) !== patch.disabled) {
    if (self) throw new PublicError("You can’t disable yourself.", 400);
    if (patch.disabled && member.role === "admin" && (await adminCount()) <= 1) throw new PublicError("Keep at least one owner.", 400);
    set.disabledAt = patch.disabled ? new Date() : null; notes.push(patch.disabled ? "disabled" : "enabled");
  }
  if (notes.length === 0) return { removed: false, changed: false };
  await db.update(users).set(set).where(eq(users.id, id));
  if (set.disabledAt || set.role || set.email || set.permissions) await db.delete(sessions).where(and(eq(sessions.userId, id)));
  await logActivity({ kind: "staff", permission: "team", title: `${by} updated ${set.name ?? member.name}`, detail: notes.join(", "), refType: "user", refId: id, actorId: actor.id });
  return { removed: false, changed: true };
}

/** Sets a new temporary password, signs the person out everywhere and emails them. */
export async function resetStaffPassword(id: string, custom: string | undefined, actor: { id: string; name?: string }) {
  if (id === actor.id) throw new PublicError("Change your own password from Profile → Security.", 400);
  const [member] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!member || member.deletedAt || (member.role !== "staff" && member.role !== "admin")) throw new PublicError("Team member not found.", 404, { code: "not_found" });
  const tempPassword = chooseTempPassword(custom, { email: member.email, name: member.name });
  await db.update(users).set({ passwordHash: await hash(tempPassword), passwordChangedAt: new Date(), mustChangePassword: true, updatedAt: new Date() }).where(eq(users.id, id));
  await db.delete(sessions).where(eq(sessions.userId, id));
  await sendAccessEmail(id, member.email, "Your NISE COMPORT password was reset", [
    `${actor.name ?? "The owner"} has set a new temporary password for you.`,
    `Sign in at ${site.url}/login with your email address and this temporary password: ${tempPassword}`,
    "For safety, change it straight away: Profile → Security → Change password.",
  ]);
  await logActivity({ kind: "staff", permission: "team", title: `${actor.name ?? "Owner"} reset ${member.name}'s password`, refType: "user", refId: id, actorId: actor.id });
  return { tempPassword };
}

/**
 * Deletes a team member's account. Service records must be kept, so the row is anonymised like a
 * customer account deletion. Refused while the person still has open requests.
 */
export async function deleteStaff(id: string, actor: { id: string; name?: string }) {
  if (id === actor.id) throw new PublicError("You can’t delete yourself.", 400);
  const [member] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!member || member.deletedAt || (member.role !== "staff" && member.role !== "admin")) throw new PublicError("Team member not found.", 404, { code: "not_found" });
  if (member.role === "admin" && (await adminCount()) <= 1) throw new PublicError("Keep at least one owner.", 400);
  const open = await openWorkCount(id);
  if (open > 0) throw new PublicError(`${member.name} still has ${open} open request${open === 1 ? "" : "s"}. Finish them, or use “Remove from team”.`, 409);
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.update(users).set({
      name: "Deleted user", email: `deleted-${id}@deleted.invalid`, phone: null, whatsapp: null, role: "customer", permissions: [],
      passwordHash: await hash(randomBytes(32).toString("hex")), emailVerifiedAt: null, mustChangePassword: false, deletedAt: now, updatedAt: now,
    }).where(eq(users.id, id));
    await tx.delete(sessions).where(eq(sessions.userId, id));
    await tx.delete(emailOtps).where(eq(emailOtps.email, member.email));
  });
  await logActivity({ kind: "staff", permission: "team", title: `${actor.name ?? "Owner"} deleted ${member.name}'s account`, refType: "user", refId: id, actorId: actor.id });
  return { deleted: true };
}
