#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { loadEnvFile, exit } from "node:process";
import { webcrypto } from "node:crypto";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) {
    try { loadEnvFile(file); } catch {}
  }
}

const failures = [];
const forbiddenPrivateApis = [
  "/api/auth/", "/api/account/", "/api/profile", "/api/addresses", "/api/requests",
  "/api/pan/requests", "/api/print-jobs", "/api/uploads", "/api/coupons/validate",
  "/api/admin/", "/api/internal/",
];
const forbiddenPrivateUrls = ["/profile/requests/", "/admin/requests/", "?next=", "?email=", "?section="];

function filesUnder(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...filesUnder(path));
    else if (/\.(ts|tsx|js|jsx)$/.test(name)) out.push(path);
  }
  return out;
}

for (const path of filesUnder("src/components")) {
  const source = readFileSync(path, "utf8");
  if (!source.includes('"use client"') && !source.includes("'use client'")) continue;
  const rel = relative(process.cwd(), path).replaceAll("\\", "/");
  for (const token of [...forbiddenPrivateApis, ...forbiddenPrivateUrls]) {
    if (source.includes(token)) failures.push(`${rel}: exposes forbidden browser token ${token}`);
  }
  if (rel !== "src/components/" && source.includes("fetch(") && !source.includes("@/lib/secure-api-client")) {
    failures.push(`${rel}: direct fetch() without secure-api-client`);
  }
}

for (const path of [
  "src/app/(account)/profile/page.tsx",
  "src/app/admin/page.tsx",
  "src/app/pan/request/page.tsx",
]) {
  const source = readFileSync(path, "utf8");
  if (/initialRequests|initialWallet|prefill=\{\{|jobs=\{|requests=\{/.test(source)) {
    failures.push(`${path}: private record data may be serialized into the RSC payload`);
  }
}

const proxy = readFileSync("src/proxy.ts", "utf8");
for (const prefix of forbiddenPrivateApis) {
  if (!proxy.includes(prefix)) failures.push(`src/proxy.ts: missing private API guard for ${prefix}`);
}
if (!proxy.includes("/api/x7q9m2")) failures.push("src/proxy.ts: opaque endpoint is not configured");

const privateRaw = process.env.API_ENVELOPE_PRIVATE_JWK;
const publicRaw = process.env.NEXT_PUBLIC_API_ENVELOPE_PUBLIC_JWK;
const internal = process.env.INTERNAL_API_TOKEN ?? "";
if (!privateRaw || !publicRaw) failures.push("Transport ECDH keypair is missing from environment.");
else {
  try {
    const privateJwk = JSON.parse(privateRaw);
    const publicJwk = JSON.parse(publicRaw);
    if (privateJwk.crv !== "P-256" || publicJwk.crv !== "P-256" || privateJwk.x !== publicJwk.x || privateJwk.y !== publicJwk.y || !privateJwk.d) {
      failures.push("Transport public/private JWK values do not form the configured P-256 pair.");
    } else {
      await webcrypto.subtle.importKey("jwk", privateJwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
      await webcrypto.subtle.importKey("jwk", publicJwk, { name: "ECDH", namedCurve: "P-256" }, false, []);
    }
  } catch {
    failures.push("Transport JWK values could not be imported by WebCrypto.");
  }
}
if (internal.length < 32) failures.push("INTERNAL_API_TOKEN must be at least 32 characters.");

if (failures.length) {
  console.error("Opaque transport security check failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  exit(1);
}
console.log("✓ Opaque transport security checks passed");
console.log("  Private browser APIs: guarded");
console.log("  Private record URLs: absent from client components");
console.log("  RSC private-data checks: passed");
console.log("  ECDH transport keypair: valid");
console.log("  Internal gateway token: configured");
