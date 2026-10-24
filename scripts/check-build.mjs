// Runs on the server before "next start". The server never builds (shared hosting runs out of
// processes and memory): .next is built on your PC with "npm run release" and uploaded with the code.
// This turns a missing or half-finished build into one clear sentence, and prints which commit is live.
import { existsSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { loadEnvFile } from "node:process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const REQUIRED = ["BUILD_ID", "build-manifest.json", "prerender-manifest.json", "routes-manifest.json", "required-server-files.json", "server", "static"];
export function missingBuildFiles(dir = ".next") { return REQUIRED.filter((name) => !existsSync(join(dir, name))); }

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const missing = missingBuildFiles();
  if (missing.length) {
    console.error(`\nNo complete build in .next (missing: ${missing.join(", ")}).`);
    console.error("This server does not build. On your PC run:  npm run release");
    console.error("then transfer the .next archive over SSH and restart.\n");
    process.exit(1);
  }
  const envFile = existsSync(".env.local") ? ".env.local" : existsSync(".env") ? ".env" : null;
  if (envFile) {
    try { loadEnvFile(envFile); }
    catch (error) { console.error("Failed to parse environment file:", error instanceof Error ? error.message : String(error)); process.exit(1); }
  }

  // New builds include a non-secret manifest so mismatched domains, ports and
  // encrypted API public/private keys fail BEFORE users hit login errors.
  const deployInfoFile = join(".next", "DEPLOY_INFO.json");
  if (existsSync(deployInfoFile)) {
    let info;
    try { info = JSON.parse(readFileSync(deployInfoFile, "utf8")); }
    catch { console.error("DEPLOY_INFO.json is corrupt."); process.exit(1); }
    const mode = (process.env.APP_ENV || "prod").trim().toLowerCase();
    const port = process.env.INTERNAL_API_PORT || (mode === "prod" ? "3020" : "3000");
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
    if (!["prod", "local"].includes(mode) || mode !== info.mode || port !== String(info.port) || siteUrl !== info.siteUrl) {
      console.error("Build/environment mismatch. Check APP_ENV, INTERNAL_API_PORT and NEXT_PUBLIC_SITE_URL against your compiled build. No keys printed.");
      process.exit(1);
    }
    try {
      const key = JSON.parse(process.env.API_ENVELOPE_PRIVATE_JWK || "");
      if (!key.d || key.kty !== "EC" || key.crv !== "P-256" || !key.x || !key.y) throw new Error("Invalid private JWK");
      const fingerprint = createHash("sha256").update([key.crv, key.x, key.y].join("|")).digest("hex");
      if (fingerprint !== info.publicKeyFingerprint) throw new Error("Server private JWK does not match the browser public JWK in the build");
    } catch (error) {
      console.error("Encrypted API key mismatch:", error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
    console.log("Build/environment compatibility: verified.");
  } else {
    console.warn("WARNING: old build has no DEPLOY_INFO.json; verify site URL, port and JWK pair manually.");
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
