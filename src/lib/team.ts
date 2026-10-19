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
export type TeamPerson = { id: string; name: string; role: string; bio: string | null; image: string | null; active: boolean; sortOrder: number };

const IMAGE_PATTERN = /^\/(images\/team\/[A-Za-z0-9._-]+\.(png|jpe?g|webp)|media\/[0-9a-f-]{36})$/i;

function fromDefaults(): TeamPerson[] {
  return defaultTeam.map((person, index) => ({ id: `default-${index}`, name: person.name, role: person.role, bio: null, image: person.image, active: true, sortOrder: (index + 1) * 10 }));
}

function fromRow(row: typeof teamTable.$inferSelect): TeamPerson {
  return { id: row.id, name: row.name, role: row.role, bio: row.bio ?? null, image: row.image ?? null, active: row.active, sortOrder: row.sortOrder };
}

async function loadAll(): Promise<{ people: TeamPerson[]; fromDatabase: boolean }> {
  try {
    const rows = await db.select().from(teamTable).orderBy(asc(teamTable.sortOrder), asc(teamTable.createdAt));
    if (rows.length) return { people: rows.map(fromRow), fromDatabase: true };
  } catch (error) { console.error("[team] team_members unavailable (run npm run db:migrate)", error); }
  return { people: fromDefaults(), fromDatabase: false };
}

const cachedPublic = unstable_cache(async () => (await loadAll()).people.filter((person) => person.active), ["site-team"], { revalidate: 300, tags: ["site-team"] });

/** Active team members in display order, for the public pages. */
export function publicTeam() { return cachedPublic(); }

/** Everyone (including hidden) for the admin screen, and whether they are already saved in the database. */
export function adminTeam() { return loadAll(); }

export type TeamInput = { id?: string; name: string; role: string; bio?: string | null; image?: string | null; active?: boolean };

function clean(input: TeamInput) {
  const name = input.name.replace(/\s+/g, " ").trim().slice(0, 80);
  const role = input.role.replace(/\s+/g, " ").trim().slice(0, 80);
  if (!name) throw new PublicError("Enter the person’s name.", 400);
  if (!role) throw new PublicError("Enter their role, for example “Service team”.", 400);
  const image = input.image?.trim() || null;
  if (image && !IMAGE_PATTERN.test(image)) throw new PublicError("Choose one of the listed photos or upload a new one.", 400);
  const bio = input.bio?.replace(/\s+/g, " ").trim().slice(0, 300) || null;
  return { name, role, bio, image, active: input.active ?? true };
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

export async function saveTeamMember(input: TeamInput, actor: { id: string }) {
  const values = clean(input);
  await ensureSeeded(actor.id);
  if (input.id) {
    const updated = await db.update(teamTable).set({ ...values, updatedAt: new Date() }).where(eq(teamTable.id, input.id)).returning({ id: teamTable.id });
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
  const removed = await db.delete(teamTable).where(eq(teamTable.id, id)).returning({ name: teamTable.name });
  if (removed[0]) await logActivity({ kind: "staff", permission: "team", title: `Removed from team page: ${removed[0].name}`, actorId: actor.id });
  refresh();
}

/** Swaps a person with their neighbour so the order on the website changes. */
export async function moveTeamMember(id: string, direction: "up" | "down") {
  const rows = await db.select().from(teamTable).orderBy(asc(teamTable.sortOrder), asc(teamTable.createdAt));
  const index = rows.findIndex((row) => row.id === id);
  const other = rows[direction === "up" ? index - 1 : index + 1];
  if (index < 0 || !other) return;
  const ordered = [...rows];
  [ordered[index], ordered[ordered.indexOf(other)]] = [other, rows[index]];
  await Promise.all(ordered.map((row, position) => db.update(teamTable).set({ sortOrder: (position + 1) * 10 }).where(eq(teamTable.id, row.id))));
  refresh();
}
