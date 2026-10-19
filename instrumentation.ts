/**
 * Runs once when the Next.js server process boots (Node runtime only — Next calls `register()`
 * automatically, no extra config needed in Next.js 16).
 *
 * Why this exists: an unhandled "error" event anywhere in the process (a dropped DB connection, a
 * stray promise rejection in a background job, …) otherwise kills the whole server — every
 * in-flight request with it — instead of just failing the one operation that triggered it. This
 * is the last-resort net: log it and keep the process alive. The actual fixes for known causes
 * (e.g. the pg pool's own "error" listener in src/lib/db.ts) still come first; this just stops a
 * cause nobody's anticipated yet from taking the whole site down.
 */
export function register() {
  if (typeof process === "undefined" || (process as unknown as { __niseInstrumented?: boolean }).__niseInstrumented) return;
  (process as unknown as { __niseInstrumented?: boolean }).__niseInstrumented = true;

  process.on("uncaughtException", (error) => {
    console.error("[server] uncaughtException (process kept alive):", error);
  });
  process.on("unhandledRejection", (reason) => {
    console.error("[server] unhandledRejection (process kept alive):", reason);
  });
}
