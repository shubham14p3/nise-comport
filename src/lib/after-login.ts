/**
 * Where to go after signing in, kept in this browser tab instead of the URL (the security check
 * keeps private navigation state out of addresses and server logs).
 */
import { safeNextPath } from "./safe-redirect.ts";

const KEY = "nise-after-login";

export function rememberReturn(path: string) {
  try { window.sessionStorage.setItem(KEY, path); } catch { /* storage unavailable: fall back to the profile */ }
}

/** Reads and clears the saved destination; only same-site page paths are allowed. */
export function takeReturn(fallback = "/profile") {
  try {
    const saved = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    return safeNextPath(saved, fallback);
  } catch { return fallback; }
}
