// Runs on the server before "next start". The server never builds (shared hosting runs out of
// processes and memory): .next is built on your PC with "npm run release" and uploaded with the code.
// This turns a missing or half-finished build into one clear sentence, and prints which commit is live.
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const REQUIRED = ["BUILD_ID", "build-manifest.json", "prerender-manifest.json", "routes-manifest.json", "required-server-files.json", "server", "static"];
export function missingBuildFiles(dir = ".next") { return REQUIRED.filter((name) => !existsSync(join(dir, name))); }

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const missing = missingBuildFiles();
  if (missing.length) {
    console.error(`\nNo complete build in .next (missing: ${missing.join(", ")}).`);
    console.error("This server does not build. On your PC run:  npm run release");
    console.error("then commit, archive and upload it, and restart.\n");
    process.exit(1);
  }
  const required = ["DATABASE_URL", "OTP_SECRET", "CRON_SECRET", "INTERNAL_API_TOKEN", "API_ENVELOPE_PRIVATE_JWK", "NEXT_PUBLIC_API_ENVELOPE_PUBLIC_JWK"];
  const empty = required.filter((name) => !process.env[name]?.trim());
  if (!empty.length) console.log("Settings: all required values are present.");
  else if (!existsSync(".env") && !existsSync(".env.local")) console.warn(`\nWARNING: no .env file in this folder and these are not set in the panel: ${empty.join(", ")}\n`);
  let from = "";
  try { from = readFileSync(join(".next", "BUILT_FROM"), "utf8").trim(); } catch { /* older build */ }
  const when = statSync(join(".next", "BUILD_ID")).mtime.toISOString().replace("T", " ").slice(0, 16);
  console.log(`Serving build ${readFileSync(join(".next", "BUILD_ID"), "utf8").trim()}${from ? ` of ${from}` : ` made ${when} UTC`}`);
}
