import { revalidateTag, unstable_cache } from "next/cache";
import { and, asc, eq, sql } from "drizzle-orm";
import { hardwareItems } from "@/db/schema";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";
import { hardwareCatalogue } from "@/lib/hardware-catalogue";
import { cleanHardwareInput, mergeHardware, type HardwareRow } from "@/lib/hardware-core";

const load = unstable_cache(async (): Promise<HardwareRow[]> => {
  try {
    const rows = await db.select().from(hardwareItems).orderBy(asc(hardwareItems.sortOrder), asc(hardwareItems.name));
    return rows.map((row) => ({ id: row.id, kind: row.kind, groupSlug: row.groupSlug, name: row.name, note: row.note, image: row.image, published: row.published, sortOrder: row.sortOrder }));
  } catch (error) { console.error("[hardware] hardware_items unavailable (run npm run db:migrate)", error); return []; }
}, ["hardware-items"], { revalidate: 300, tags: ["hardware-items"] });

/** What /hardware shows: built-in parts plus admin changes. */
export async function hardwareGroups() { return mergeHardware(hardwareCatalogue, await load()); }

/** Admin view: every built-in part with its on/off state, and the added parts. */
export async function adminHardware() {
  const rows = await db.select().from(hardwareItems).orderBy(asc(hardwareItems.groupSlug), asc(hardwareItems.sortOrder), asc(hardwareItems.name));
  const hidden = rows.filter((row) => row.kind === "hide");
  return {
    groups: hardwareCatalogue.map((group) => ({ slug: group.slug, title: group.title })),
    builtIn: hardwareCatalogue.flatMap((group) => group.items.map((item) => ({ groupSlug: group.slug, name: item.name, note: item.note, hidden: hidden.some((row) => row.groupSlug === group.slug && row.name.toLowerCase() === item.name.toLowerCase()) }))),
    added: rows.filter((row) => row.kind === "item").map((row) => ({ id: row.id, groupSlug: row.groupSlug, name: row.name, note: row.note, image: row.image, published: row.published, sortOrder: row.sortOrder })),
  };
}

type Actor = { id: string; name: string };
const refresh = () => revalidateTag("hardware-items", { expire: 0 });

export async function saveHardwareItem(input: Record<string, unknown>, actor: Actor) {
  const clean = cleanHardwareInput(input, hardwareCatalogue);
  if ("error" in clean) throw new PublicError(clean.error, 400, { fields: { name: clean.error } });
  const id = typeof input.id === "string" ? input.id : null;
  const values = { kind: "item", ...clean, published: input.published !== false, sortOrder: Math.max(0, Math.min(999, Number(input.sortOrder) || 0)), updatedAt: new Date() };
  try {
    const [row] = id ? await db.update(hardwareItems).set(values).where(and(eq(hardwareItems.id, id), eq(hardwareItems.kind, "item"))).returning()
      : await db.insert(hardwareItems).values({ ...values, createdBy: actor.id }).returning();
    if (!row) throw new PublicError("Part not found.", 404);
    refresh();
    await logActivity({ kind: "promotion", permission: "content", category: "content", title: `${actor.name} ${id ? "updated" : "added"} the hardware part “${clean.name}”`, detail: "/hardware", actorId: actor.id });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") throw new PublicError("That part is already in this group.", 409, { fields: { name: "Already added." } });
    throw error;
  }
}

export async function deleteHardwareItem(id: string, actor: Actor) {
  const [row] = await db.delete(hardwareItems).where(and(eq(hardwareItems.id, id), eq(hardwareItems.kind, "item"))).returning();
  if (!row) throw new PublicError("Part not found.", 404);
  refresh();
  await logActivity({ kind: "promotion", permission: "content", category: "content", title: `${actor.name} deleted the hardware part “${row.name}”`, actorId: actor.id });
}

/** Switches a built-in part off or on again. */
export async function setBuiltInHardwareHidden(groupSlug: string, name: string, hidden: boolean, actor: Actor) {
  const item = hardwareCatalogue.find((group) => group.slug === groupSlug)?.items.find((entry) => entry.name === name);
  if (!item) throw new PublicError("Unknown part.", 404);
  if (hidden) await db.insert(hardwareItems).values({ kind: "hide", groupSlug, name, published: false, createdBy: actor.id }).onConflictDoNothing();
  else await db.delete(hardwareItems).where(and(eq(hardwareItems.kind, "hide"), eq(hardwareItems.groupSlug, groupSlug), sql`lower(${hardwareItems.name}) = ${name.toLowerCase()}`));
  refresh();
  await logActivity({ kind: "promotion", permission: "content", category: "content", title: `${actor.name} ${hidden ? "hid" : "showed again"} the hardware part “${name}”`, actorId: actor.id });
}
