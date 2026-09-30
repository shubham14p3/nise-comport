/**
 * Makes a "?next=" value safe to redirect to after sign-in.
 * Only same-site page paths are allowed. Anything that could send the visitor to another
 * website ("//evil.com", "/\evil.com", "https://evil.com", "javascript:") falls back to the default.
 */
const BLOCKED_PREFIXES = ["/api/", "/login", "/signup", "/forgot-password", "/_next/"];

export function safeNextPath(value: string | null | undefined, fallback = "/profile") {
  if (!value || typeof value !== "string") return fallback;
  let candidate = value.trim();
  try { candidate = decodeURIComponent(candidate); } catch { return fallback; }
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return fallback;
  if ([...candidate].some((character) => { const code = character.codePointAt(0) ?? 0; return code < 32 || code === 127; })) return fallback;
  let parsed: URL;
  try { parsed = new URL(candidate, "https://placeholder.invalid"); } catch { return fallback; }
  if (parsed.origin !== "https://placeholder.invalid") return fallback;
  const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  if (BLOCKED_PREFIXES.some((prefix) => parsed.pathname === prefix.replace(/\/$/, "") || parsed.pathname.startsWith(prefix))) return fallback;
  return path.length > 512 ? fallback : path;
}
