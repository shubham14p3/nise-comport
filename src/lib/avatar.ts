/**
 * Google doesn't expose reviewer profile photos through any API we have access to (Places API
 * returns none, the Business Profile API's `reviewer` object has no photo field either, and the
 * saved Maps HTML page we imported from didn't capture avatar URLs). So every testimonial gets a
 * deterministic initials avatar instead — same name always renders the same initials + color,
 * no placeholder-image requests, nothing to break if a URL goes stale.
 */
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

/** Path to this reviewer's pre-generated avatar file under /public — run `npm run avatars:generate` after new reviews come in. */
export function avatarSrc(name: string) {
  return `/avatars/${slugFor(name)}.svg`;
}
