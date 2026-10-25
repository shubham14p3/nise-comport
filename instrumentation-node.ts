/**
 * Node-only last-resort process logging.
 * Kept out of Next.js Edge bundles by a conditional import in instrumentation.ts.
 */
export function registerNodeInstrumentation() {
  const state = process as typeof process & { __niseInstrumented?: boolean };
  if (state.__niseInstrumented) return;
  state.__niseInstrumented = true;

  process.on("uncaughtException", (error) => {
    console.error("[server] uncaughtException (process kept alive):", error);
  });
  process.on("unhandledRejection", (reason) => {
    console.error("[server] unhandledRejection (process kept alive):", reason);
  });
}
