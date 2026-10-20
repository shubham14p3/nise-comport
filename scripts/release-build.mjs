// Builds the production .next on your PC, ready to push. Run: npm run release
// The live site address is forced here because it is baked into the build; a .env.local left on
// localhost from testing would otherwise ship in every email link and canonical tag.
import { spawnSync, execSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { missingBuildFiles } from "./check-build.mjs";

const SITE = "https://www.nisecomport.com";
const env = { ...process.env, NEXT_PUBLIC_SITE_URL: SITE, NEXT_TELEMETRY_DISABLED: "1" };

const key = (process.env.NEXT_PUBLIC_API_ENVELOPE_PUBLIC_JWK ?? "").trim();
if (!existsSync(".env.local") && !existsSync(".env") && !key) {
  console.error("No .env.local or .env found. The browser key (NEXT_PUBLIC_API_ENVELOPE_PUBLIC_JWK) is baked into the build, so create it first.");
  process.exit(1);
}

console.log(`Building for ${SITE} ...\n`);
const run = spawnSync(process.execPath, [join("node_modules", "next", "dist", "bin", "next"), "build", "--webpack"], { stdio: "inherit", env });
if (run.status !== 0) { console.error("\nBuild failed. Nothing to push."); process.exit(run.status ?? 1); }

const missing = missingBuildFiles();
if (missing.length) { console.error(`\nBuild exited cleanly but .next is incomplete: ${missing.join(", ")}`); process.exit(1); }

let commit = "unknown commit";
try { commit = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim() + (execSync('git status --porcelain -- . ":!.next"', { encoding: "utf8" }).trim() ? " + uncommitted changes" : ""); } catch { /* not a git folder */ }
writeFileSync(join(".next", "BUILT_FROM"), `${commit} at ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC\n`);

console.log(`\nBuild ready (${commit}). Now push it:\n`);
console.log("  git add -A");
console.log('  git commit -m "build: release"');
console.log("  git push");
console.log("  git archive --format=zip -o ../nisecomport-upload.zip HEAD\n");
console.log("Then upload the zip to the server, extract it over the app folder and restart the Node app.");
