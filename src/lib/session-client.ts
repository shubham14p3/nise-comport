"use client";

import { secureApi } from "@/lib/secure-api-client";
import { createSingleFlightCache } from "@/lib/single-flight-cache";

export type SessionUser = { id: string; name: string; email: string; role: string };
export const SESSION_CHANGED = "nise:session-changed";

// Page-local headers are mounted on every route. Without shared state, each
// mount separately calls /api/auth/session, including unauthenticated pages.
const cache = createSingleFlightCache(async () => {
  const response = await secureApi<{ user: SessionUser | null; degraded?: boolean }>("C4w7G2hN6kP9");
  // Never cache an unavailable database as proof of signed-out status.
  if (response.degraded) throw new Error("Session temporarily unavailable.");
  return response.user;
}, 45_000);

export function getSessionUser(): Promise<SessionUser | null> {
  return cache.get();
}

/** Call after successful login and after logout. Does not expose any secrets. */
export function invalidateSessionCache(notify = true) {
  cache.invalidate();
  if (notify && typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_CHANGED));
  }
}
