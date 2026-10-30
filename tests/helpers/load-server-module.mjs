import { build } from "esbuild";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

/** Compile the real handler, replacing only I/O boundaries; no live database or email. */
export async function loadServerModule(entry) {
  const cache = resolve("node_modules/.cache");
  await mkdir(cache, { recursive: true });
  const dir = await mkdtemp(join(cache, "nise-server-test-"));
  const outfile = join(dir, "module.mjs");
  try {
    await build({
      entryPoints: [resolve(entry)], outfile, bundle: true, platform: "node", format: "esm", packages: "external", logLevel: "silent",
      plugins: [{ name: "test-io", setup(builder) {
        builder.onResolve({ filter: /^@\/lib\/(db|auth|email|claims)$/ }, args => ({ path: args.path, namespace: "test-io" }));
        builder.onLoad({ filter: /.*/, namespace: "test-io" }, args => ({ contents: args.path.endsWith("/db")
          ? 'export const db = globalThis.__niseTest.db;'
          : args.path.endsWith("/claims") ? 'export async function pendingClaimCount() { return globalThis.__niseTest.claims ?? 0; }'
          : args.path.endsWith("/auth")
            ? 'export const CLOSED_STATUSES = ["completed", "cancelled", "rejected", "closed"]; export async function requireStaff(role) { return globalThis.__niseTest.requireStaff(role); } export async function openWorkCount() { return 0; }'
            : 'export async function sendEmailChangedNotice() {} export async function sendAdminAccountArchivedEmail() {}' }));
        builder.onResolve({ filter: /^next\/server$/ }, () => ({ path: "next/server.js", external: true }));
      } }],
    });
    return await import(pathToFileURL(outfile).href);
  } finally { await rm(dir, { recursive: true, force: true }); }
}
