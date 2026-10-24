#!/usr/bin/env node
/**
 * Safe MilesWeb API infrastructure smoke test.
 * Run while the panel-managed Next.js app is running: npm run api:smoke
 * Never logs credentials, sends mail, signs in, or modifies customer records.
 */
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

const envFile = existsSync(".env.local") ? ".env.local" : existsSync(".env") ? ".env" : null;
if (envFile) loadEnvFile(envFile);

const mode = (process.env.APP_ENV || "prod").toLowerCase();
const port = process.env.INTERNAL_API_PORT || (mode === "prod" ? "3020" : "3000");
if (!/^[1-9]\d{0,4}$/.test(port) || Number(port) > 65535) {
  console.error("Invalid internal API port. Check APP_ENV and INTERNAL_API_PORT.");
  process.exit(1);
}
const base = `http://127.0.0.1:${port}`;
const token = process.env.INTERNAL_API_TOKEN;
if (!token || token.length < 32) {
  console.error("INTERNAL_API_TOKEN is missing or too short. No requests sent.");
  process.exit(1);
}

let failed = false;
async function check(name, path, options, expectedStatus, expectedCode) {
  try {
    const response = await fetch(base + path, { ...options, redirect: "manual", signal: AbortSignal.timeout(8000) });
    const body = (response.headers.get("content-type") || "").includes("application/json")
      ? await response.json().catch(() => null)
      : null;
    const goodStatus = response.status === expectedStatus;
    const goodCode = !expectedCode || body?.code === expectedCode;
    console.log(`${goodStatus && goodCode ? "PASS" : "FAIL"} ${name}: HTTP ${response.status}${body?.code ? ` (${body.code})` : ""}`);
    if (!goodStatus || !goodCode) failed = true;
  } catch (error) {
    failed = true;
    console.error(`FAIL ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const path = "/api/auth/password";
const body = JSON.stringify({ email: "", password: "" }); // Invalid by schema: no DB query or login.
const baseHeaders = { "content-type": "application/json" };

console.log(`Checking NiSE COMPORT internal APIs at ${base}; APP_ENV=${mode}`);
await check("Private endpoint rejects missing token", path, {
  method: "POST", headers: { ...baseHeaders, origin: base }, body,
}, 404);
await check("Authenticated loopback request reaches handler", path, {
  method: "POST", headers: { ...baseHeaders, origin: base, "x-nise-internal": token }, body,
}, 400, "invalid_input");
await check("Private endpoint rejects foreign Origin", path, {
  method: "POST", headers: { ...baseHeaders, origin: "https://example.invalid", "x-nise-internal": token }, body,
}, 403, "cross_site");

console.log(failed ? "API smoke checks FAILED." : "API routing smoke checks PASSED (login and SMTP still require separate real-world tests).");
if (failed) process.exitCode = 1;
