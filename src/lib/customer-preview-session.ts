import { createHmac, timingSafeEqual } from "node:crypto";

/** Short-lived admin-owned preview state; never replaces the real login session. */
export const PREVIEW_COOKIE = "nc_owner_preview";
export const PREVIEW_MS = 15 * 60_000;
export const MAX_PREVIEW_MS = 30 * 60_000;
export type PreviewGrant = { actor: string; target: string; until: number; started: number };

function key() {
  const secret = process.env.INTERNAL_API_TOKEN;
  if (!secret || secret.length < 32) throw new Error("Preview signing requires INTERNAL_API_TOKEN (32+ characters).");
  return secret;
}
export function createPreviewGrant(actor: string, target: string, now = Date.now(), started = now, until = now + PREVIEW_MS): string {
  const grant: PreviewGrant = { actor, target, started, until };
  const payload = Buffer.from(JSON.stringify(grant), "utf8").toString("base64url");
  const signature = createHmac("sha256", key()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}
export function readPreviewGrant(cookie: string | undefined, actorId: string, now = Date.now()): PreviewGrant | null {
  if (!cookie || cookie.length > 1024) return null;
  const [payload, signature, extra] = cookie.split(".");
  if (!payload || !signature || extra) return null;
  try {
    const expected = createHmac("sha256", key()).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const grant = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PreviewGrant;
    if (grant.actor !== actorId || !/^[a-f0-9-]{36}$/i.test(grant.target) ||
        !Number.isSafeInteger(grant.until) || !Number.isSafeInteger(grant.started) ||
        now >= grant.until || grant.until - grant.started > MAX_PREVIEW_MS ||
        now < grant.started - 60_000) return null;
    return grant;
  } catch { return null; }
}
