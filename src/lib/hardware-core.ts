import type { HardwareGroup, HardwareItem } from "./hardware-catalogue.ts";

export type HardwareRow = { id?: string; kind: string; groupSlug: string; name: string; note: string; image: string | null; published: boolean; sortOrder: number };

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Built-in parts minus the ones switched off, plus parts added in the admin area (new groups are not allowed: they join an existing group). */
export function mergeHardware(builtIn: HardwareGroup[], rows: HardwareRow[]): HardwareGroup[] {
  const hidden = rows.filter((row) => row.kind === "hide");
  const added = rows.filter((row) => row.kind === "item" && row.published).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  return builtIn.map((group) => {
    const items: HardwareItem[] = group.items.filter((item) => !hidden.some((row) => row.groupSlug === group.slug && same(row.name, item.name)));
    for (const row of added) if (row.groupSlug === group.slug && !items.some((item) => same(item.name, row.name))) items.push({ name: row.name, note: row.note, ...(row.image ? { image: row.image } : {}) });
    return { ...group, items };
  }).filter((group) => group.items.length > 0);
}

/** Trims and checks one admin-entered part. Returns an error message or the clean values. */
export function cleanHardwareInput(input: { groupSlug?: unknown; name?: unknown; note?: unknown; image?: unknown }, groups: { slug: string }[]) {
  const text = (value: unknown, max: number) => typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
  const groupSlug = text(input.groupSlug, 60);
  const name = text(input.name, 90);
  const note = text(input.note, 160);
  const image = text(input.image, 200);
  if (!groups.some((group) => group.slug === groupSlug)) return { error: "Choose a group." } as const;
  if (name.length < 3) return { error: "Write the part name (at least 3 letters)." } as const;
  if (image && !/^\/(?!\/)[\w\-/.%]+\.(png|jpe?g|webp|avif)$/i.test(image)) return { error: "Photo must be a file inside this site, like /images/hardware/ssd.webp." } as const;
  return { groupSlug, name, note, image: image || null } as const;
}
