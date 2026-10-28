/**
 * Next.js calls this in both Node.js and Edge runtimes.
 * Node-only process event listeners must never appear in the Edge bundle.
 * See https://nextjs.org/docs/app/guides/instrumentation#recording-runtime-specific-code
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerNodeInstrumentation } = await import("./instrumentation-node");
    registerNodeInstrumentation();
  }
}
