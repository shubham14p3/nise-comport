import realSlugs from "@/data/avatar-real-slugs.json";

/**
 * Real reviewer photo thumbnails, where we have one. Google doesn't expose these through any API
 * we have access to (Places API returns none, the Business Profile API's `reviewer` object has no
 * photo field either), but a saved copy of the live Google Maps reviews page does embed each
 * reviewer's actual 40×40 avatar image next to their review — real photo if they set one, or
 * Google's own colored-initial circle if they didn't. scripts/import-real-avatars.mjs pulls those
 * out of a saved page into public/avatars/real/<slug>.png and records the slug here.
 *
 * For anyone without a captured photo (reviews added by hand, or a future sync), avatarSrc() falls
 * back to our own generated colorful initials SVG — same idea as Google's own default, so the mix
 * never looks inconsistent.
 */
const REAL_SLUGS = new Set<string>(realSlugs as string[]);

const PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899",
];

export function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0]![0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]![0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length]!;
}

/** Filesystem-safe slug used as the avatar file's name — must match scripts/generate-avatars.mjs. */
export function slugFor(name: string) {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "reviewer";
}

/**
 * Path to this reviewer's avatar — their real captured Google photo/initial-circle if we have
 * one, otherwise our own generated colorful initials SVG. Run `npm run avatars:generate` after
 * new reviews come in by hand, or `npm run avatars:import-real <saved-page.zip>` after saving a
 * fresh copy of the Google Maps reviews page to pull in more real photos.
 */
export function avatarSrc(name: string) {
  const slug = slugFor(name);
  if (REAL_SLUGS.has(slug)) return `/avatars/real/${slug}.png`;
  return `/avatars/${slug}.svg`;
}
