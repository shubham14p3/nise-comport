// Builds a deployable .next on your PC. Run: npm run release
// Reads APP_ENV and NEXT_PUBLIC_SITE_URL from your environment file. The site URL
// is baked into the build. Upload .next separately, never commit it to Git.
import { spawnSync, execSync } from "node:child_process";
import { createHash } from "node:crypto";
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
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || (mode === "prod" ? "https://nisecomport.com" : "http://localhost:3000")).trim();
try {
  const url = new URL(SITE);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported protocol");
} catch {
  console.error("NEXT_PUBLIC_SITE_URL must be a complete http(s) URL.");
  process.exit(1);
}
const env = { ...process.env, APP_ENV: mode, NEXT_PUBLIC_SITE_URL: SITE, NEXT_TELEMETRY_DISABLED: "1" };

const key = (process.env.NEXT_PUBLIC_API_ENVELOPE_PUBLIC_JWK ?? "").trim();
const privateKey = (process.env.API_ENVELOPE_PRIVATE_JWK ?? "").trim();
if (!key || !privateKey) {
  console.error("A matching public/private API envelope JWK pair is required before release.");
  process.exit(1);
}

function keyFingerprint(jwk) {
  if (jwk?.kty !== "EC" || jwk?.crv !== "P-256" || !jwk.x || !jwk.y) throw new Error("Expected a P-256 ECDH key.");
  return createHash("sha256").update([jwk.crv, jwk.x, jwk.y].join("|")).digest("hex");
}
let publicFingerprint;
try {
  const publicJwk = JSON.parse(key);
  const privateJwk = JSON.parse(privateKey);
  if (!privateJwk.d || publicJwk.d) throw new Error("Private/public JWK material is incorrectly assigned.");
  publicFingerprint = keyFingerprint(publicJwk);
  if (publicFingerprint !== keyFingerprint(privateJwk)) throw new Error("Browser public JWK does not match server private JWK.");
} catch (error) {
  console.error("API envelope key validation failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const parsedSite = new URL(SITE);
if ((mode === "prod" && ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsedSite.hostname))
    || (mode === "local" && parsedSite.hostname === "nisecomport.com")) {
  console.error("APP_ENV and NEXT_PUBLIC_SITE_URL point to different environments.");
  process.exit(1);
}

// Prevent multi-minute green builds that silently fall back because PostgreSQL
// is missing a column/table introduced by an unreviewed merged PR.
if (mode === "prod") {
  console.log("Checking live PostgreSQL schema before production build...");
  const schemaCheck = spawnSync(process.execPath, [
    "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
    "--experimental-strip-types",
    join("scripts", "schema-compat.mjs"),
  ], { stdio: "inherit", env });
  if (schemaCheck.status !== 0) {
    console.error("Production build blocked: database schema is not compatible. Run npm run db:schema:check, then back up and apply the reviewed additive sync.");
    process.exit(schemaCheck.status ?? 1);
  }
}

console.log(`Building APP_ENV=${mode} for ${SITE} ...\n`);
const run = spawnSync(process.execPath, [join("node_modules", "next", "dist", "bin", "next"), "build", "--webpack"], { stdio: "inherit", env });
if (run.status !== 0) { console.error("\nBuild failed. Nothing to push."); process.exit(run.status ?? 1); }

const missing = missingBuildFiles();
if (missing.length) { console.error(`\nBuild exited cleanly but .next is incomplete: ${missing.join(", ")}`); process.exit(1); }

let commit = "unknown commit";
try { commit = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim() + (execSync('git status --porcelain -- . ":!.next"', { encoding: "utf8" }).trim() ? " + uncommitted changes" : ""); } catch { /* not a git folder */ }
writeFileSync(join(".next", "BUILT_FROM"), `${commit} at ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC\n`);
writeFileSync(join(".next", "DEPLOY_INFO.json"), JSON.stringify({
  mode, siteUrl: SITE, publicKeyFingerprint: publicFingerprint,
  port: process.env.INTERNAL_API_PORT || (mode === "prod" ? "3020" : "3000"),
}, null, 2) + "\n");


console.log(`\nBuild ready (${commit}). To deploy with your ZIP/cPanel workflow:\n`);
console.log("1. ZIP .next and the required scripts from this project on Windows.");
console.log("2. Stop the MilesWeb Node.js application from the panel.");
console.log("3. Upload/extract the ZIP using cPanel File Manager, replacing only .next and included scripts.");
console.log("4. Verify .next/BUILD_ID and run scripts/check-build.mjs if Terminal is available; restart via the panel.");
console.log("Never upload .env.local or Windows node_modules. PostgreSQL is external and not included in the ZIP.");
