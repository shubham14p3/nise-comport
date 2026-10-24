import { revalidateTag, unstable_cache } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { teamMembers as teamTable } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { teamMembers as defaultTeam } from "@/lib/content";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";

/**
 * The people shown on the Team and About pages. Managed in Admin → Team ("Shown on the website").
 * While nothing has been saved in the database the original list in src/lib/content.ts is shown,
 * so the website is never empty and a database problem never breaks the Team page.
 */
export type TeamPerson = { id: string; name: string; role: string; bio: string | null; image: string | null; active: boolean; sortOrder: number;
  /** Private contact details: only ever sent to the owner's admin screen. */
  phone?: string | null; email?: string | null };

const IMAGE_PATTERN = /^\/(images\/team\/[A-Za-z0-9._-]+\.(png|jpe?g|webp)|media\/[0-9a-f-]{36})$/i;

function fromDefaults(): TeamPerson[] {
  return defaultTeam.map((person, index) => ({ id: `default-${index}`, name: person.name, role: person.role, bio: null, image: person.image, active: true, sortOrder: (index + 1) * 10 }));
}

function fromRow(row: typeof teamTable.$inferSelect): TeamPerson {
  return { id: row.id, name: row.name, role: row.role, bio: row.bio ?? null, image: row.image ?? null, active: row.active, sortOrder: row.sortOrder, phone: row.phone ?? null, email: row.email ?? null };
}

async function loadAll(): Promise<{ people: TeamPerson[]; fromDatabase: boolean }> {
  try {
    const rows = await db.select().from(teamTable).orderBy(asc(teamTable.sortOrder), asc(teamTable.createdAt));
    if (rows.length) return { people: rows.map(fromRow), fromDatabase: true };
  } catch (error) { console.error("[team] team_members unavailable (run npm run db:migrate)", error); }
  return { people: fromDefaults(), fromDatabase: false };
}

const cachedPublic = unstable_cache(async () => (await loadAll()).people.filter((person) => person.active).map(({ phone, email, ...person }) => { void phone; void email; return person; }), ["site-team"], { revalidate: 300, tags: ["site-team"] });

/** Active team members in display order, for the public pages. */
export function publicTeam() { return cachedPublic(); }

/** Everyone (including hidden) for the admin screen, and whether they are already saved in the database. */
export function adminTeam() { return loadAll(); }

export type TeamInput = { id?: string; name: string; role: string; bio?: string | null; image?: string | null; active?: boolean; phone?: string | null; email?: string | null };

function clean(input: TeamInput) {
  const name = input.name.replace(/\s+/g, " ").trim().slice(0, 80);
  const role = input.role.replace(/\s+/g, " ").trim().slice(0, 80);
  if (!name) throw new PublicError("Enter the person’s name.", 400);
  if (!role) throw new PublicError("Enter their role, for example “Service team”.", 400);
  const image = input.image?.trim() || null;
  if (image && !IMAGE_PATTERN.test(image)) throw new PublicError("Choose one of the listed photos or upload a new one.", 400);
  const bio = input.bio?.replace(/\s+/g, " ").trim().slice(0, 300) || null;
  const email = input.email?.trim().toLowerCase() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new PublicError("Enter a valid email address or leave it empty.", 400);
  const digits = (input.phone ?? "").replace(/[^\d+]/g, "");
  if (digits && !/^(\+?91)?[6-9]\d{9}$/.test(digits)) throw new PublicError("Enter a valid 10-digit mobile number or leave it empty.", 400);
  const phone = digits ? digits.replace(/^\+?91/, "").slice(-10) : null;
  return { name, role, bio, image, active: input.active ?? true, email, phone };
}

function refresh() { revalidateTag("site-team", { expire: 0 }); }

/** Copies the original team into the database the first time, so it can be edited. */
async function ensureSeeded(actorId: string) {
  const existing = await db.select({ id: teamTable.id }).from(teamTable).limit(1);
  if (existing.length) return;
  await db.insert(teamTable).values(fromDefaults().map((person) => ({ name: person.name, role: person.role, image: person.image, sortOrder: person.sortOrder, active: true, createdBy: actorId })));
}

export async function importDefaultTeam(actor: { id: string }) {
  await ensureSeeded(actor.id);
  refresh();
}

/** Built-in people have ids like "default-3" until the team is copied into the database; this maps them to the saved row. */
async function resolveId(id: string, actor: { id: string }) {
  const match = /^default-(\d+)$/.exec(id);
  if (!match) return id;
  await ensureSeeded(actor.id);
  const [row] = await db.select({ id: teamTable.id }).from(teamTable).where(eq(teamTable.sortOrder, (Number(match[1]) + 1) * 10)).limit(1);
  if (!row) throw new PublicError("That team member no longer exists.", 404);
  return row.id;
}

export async function saveTeamMember(input: TeamInput, actor: { id: string }) {
  const values = clean(input);
  await ensureSeeded(actor.id);
  if (input.id) {
    const id = await resolveId(input.id, actor);
    const updated = await db.update(teamTable).set({ ...values, updatedAt: new Date() }).where(eq(teamTable.id, id)).returning({ id: teamTable.id });
    if (!updated.length) throw new PublicError("That team member no longer exists.", 404);
  } else {
    const last = await db.select({ sortOrder: teamTable.sortOrder }).from(teamTable).orderBy(asc(teamTable.sortOrder));
    const next = (last.at(-1)?.sortOrder ?? 0) + 10;
    await db.insert(teamTable).values({ ...values, sortOrder: next, createdBy: actor.id });
  }
  await logActivity({ kind: "staff", permission: "team", title: `${input.id ? "Updated" : "Added"} team page member: ${values.name}`, detail: values.role, actorId: actor.id });
  refresh();
}

export async function deleteTeamMember(id: string, actor: { id: string }) {
  const removed = await db.delete(teamTable).where(eq(teamTable.id, await resolveId(id, actor))).returning({ name: teamTable.name });
  if (removed[0]) await logActivity({ kind: "staff", permission: "team", title: `Removed from team page: ${removed[0].name}`, actorId: actor.id });
  refresh();
}

/** Swaps a person with their neighbour so the order on the website changes. */
export async function moveTeamMember(id: string, direction: "up" | "down", actor: { id: string }) {
  id = await resolveId(id, actor);
  const rows = await db.select().from(teamTable).orderBy(asc(teamTable.sortOrder), asc(teamTable.createdAt));
  const index = rows.findIndex((row) => row.id === id);
  const other = rows[direction === "up" ? index - 1 : index + 1];
  if (index < 0 || !other) return;
  const ordered = [...rows];
  [ordered[index], ordered[ordered.indexOf(other)]] = [other, rows[index]];
  await Promise.all(ordered.map((row, position) => db.update(teamTable).set({ sortOrder: (position + 1) * 10 }).where(eq(teamTable.id, row.id))));
  refresh();
}
