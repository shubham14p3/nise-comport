#!/usr/bin/env node
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import nodemailer from "nodemailer";
import { promises as dns } from "node:dns";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  try { loadEnvFile(file); } catch (error) {
    console.error(`Could not load ${file}:`, error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"];
const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length) {
  console.error(`Missing SMTP values: ${missing.join(", ")}`);
  process.exit(1);
}

const port = Number(process.env.SMTP_PORT);
if (!Number.isFinite(port)) {
  console.error("SMTP_PORT must be a number.");
  process.exit(1);
}

if (/%[0-9A-Fa-f]{2}/.test(process.env.SMTP_PASSWORD ?? "")) {
  console.warn("Warning: SMTP_PASSWORD contains URL-encoded characters. SMTP passwords normally need the literal mailbox password, unlike DATABASE_URL.");
}

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  requireTLS: port === 587,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  ...(process.env.SMTP_TLS_SERVERNAME?.trim() ? { tls: { servername: process.env.SMTP_TLS_SERVERNAME.trim() } } : {}),
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
});

console.log(`Checking SMTP at ${process.env.SMTP_HOST}:${port} as ${process.env.SMTP_USER} (${port === 587 ? "STARTTLS required" : port === 465 ? "implicit TLS" : "TLS per server"})…`);

let resolvedAddresses = [];
try {
  const answers = await dns.lookup(process.env.SMTP_HOST, { all: true });
  resolvedAddresses = [...new Set(answers.map((answer) => answer.address))];
  if (resolvedAddresses.length) console.log(`  DNS: ${resolvedAddresses.join(", ")}`);
} catch (error) {
  console.warn(`  DNS lookup failed: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  await transport.verify();
  console.log("✓ SMTP connection and authentication successful");
  console.log(`  From: ${process.env.SMTP_FROM}`);
} catch (error) {
  console.error("✗ SMTP verification failed");
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (code) console.error(`  Code: ${code}`);
  console.error(`  ${error instanceof Error ? error.message : String(error)}`);

  if (code === "ESOCKET" && resolvedAddresses.length) {
    const ptrNames = new Set();
    for (const address of resolvedAddresses) {
      try {
        for (const name of await dns.reverse(address)) ptrNames.add(name.replace(/\.$/, ""));
      } catch {
        // Reverse DNS is optional; continue checking any other resolved address.
      }
    }
    if (ptrNames.size) {
      console.error(`  Reverse DNS candidate(s): ${[...ptrNames].join(", ")}`);
      console.error("  If one of these hostnames is listed by your hosting provider and matches the TLS certificate, use that exact hostname as SMTP_HOST.");
    } else {
      console.error("  No reverse-DNS hostname was returned. Ask the email host for the SSL/TLS server hostname (not merely mail.yourdomain.com).");
    }
  }

  process.exitCode = 1;
} finally {
  transport.close();
}
