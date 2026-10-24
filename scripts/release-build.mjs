// Builds a deployable .next on your PC. Run: npm run release
// Reads APP_ENV and NEXT_PUBLIC_SITE_URL from your environment file. The site URL
// is baked into the build. Upload .next separately, never commit it to Git.
import { spawnSync, execSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { join } from "node:path";
import { missingBuildFiles } from "./check-build.mjs";

const envFile = existsSync(".env.local") ? ".env.local" : existsSync(".env") ? ".env" : null;
if (envFile) loadEnvFile(envFile);
const mode = (process.env.APP_ENV || "prod").trim().toLowerCase();
if (mode !== "prod" && mode !== "local") {
  console.error("APP_ENV must be 'prod' or 'local'.");
  process.exit(1);
}
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || (mode === "prod" ? "https://nisecomport.aitapri.com" : "http://localhost:3000")).trim();
try {
  const url = new URL(SITE);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported protocol");
} catch {
  console.error("NEXT_PUBLIC_SITE_URL must be a complete http(s) URL.");
  process.exit(1);
}
const env = { ...process.env, APP_ENV: mode, NEXT_PUBLIC_SITE_URL: SITE, NEXT_TELEMETRY_DISABLED: "1" };

const key = (process.env.NEXT_PUBLIC_API_ENVELOPE_PUBLIC_JWK ?? "").trim();
if (!existsSync(".env.local") && !existsSync(".env") && !key) {
  console.error("No .env.local or .env found. The browser key (NEXT_PUBLIC_API_ENVELOPE_PUBLIC_JWK) is baked into the build, so create it first.");
  process.exit(1);
}

console.log(`Building APP_ENV=${mode} for ${SITE} ...\n`);
const run = spawnSync(process.execPath, [join("node_modules", "next", "dist", "bin", "next"), "build", "--webpack"], { stdio: "inherit", env });
if (run.status !== 0) { console.error("\nBuild failed. Nothing to push."); process.exit(run.status ?? 1); }

const missing = missingBuildFiles();
if (missing.length) { console.error(`\nBuild exited cleanly but .next is incomplete: ${missing.join(", ")}`); process.exit(1); }

let commit = "unknown commit";
try { commit = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim() + (execSync('git status --porcelain -- . ":!.next"', { encoding: "utf8" }).trim() ? " + uncommitted changes" : ""); } catch { /* not a git folder */ }
writeFileSync(join(".next", "BUILT_FROM"), `${commit} at ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC\n`);

console.log(`\nBuild ready (${commit}). Deploy .next over SSH without committing it:\n`);
console.log("  tar -czf nise-next.tar.gz --exclude=\'.next/cache\' --exclude=\'.next/dev\' .next");
console.log("  scp -P 22 nise-next.tar.gz YOUR_SSH_USER@YOUR_SERVER:~/nisecomport.aitapri.com/\n");
console.log("Stop the server app, extract the tarball at the app root, verify with node scripts/check-build.mjs, and restart.");
