#!/usr/bin/env node
/**
 * One-time, owner-run provisioning for an EXISTING email account.
 *
 * Usage (only on an SSH session to the trusted app server):
 *   node scripts/enable-account-pin.mjs account@example.com 9876543210
 *   node scripts/enable-account-pin.mjs account@example.com 9876543210 --rotate
 *
 * Generates a random six-digit PIN, hashes it with the same Argon2 implementation
 * as the application, and prints the PIN once in your SSH terminal. It never
 * creates an account, changes email/password/signup_method, or marks a phone as
 * SMS-verified. Never paste the displayed PIN into a chat, repo, or log.
 */
import { randomInt } from "node:crypto";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import pg from "pg";
import argon2 from "@node-rs/argon2";

const [emailInput, phoneInput, flag] = process.argv.slice(2);
const email = String(emailInput || "").trim().toLowerCase();
const raw = String(phoneInput || "").replace(/\D/g, "");
const digits = raw.length === 12 && raw.startsWith("91") ? raw.slice(2) : raw;
const phone = `+91${digits}`;
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
    || !/^[6-9]\d{9}$/.test(digits)
    || /^(\d)\1{9}$/.test(digits)
    || (flag !== undefined && flag !== "--rotate")) {
  console.error("Usage: node scripts/enable-account-pin.mjs email@example.com 9876543210 [--rotate]");
  process.exit(1);
}
const envFile = existsSync(".env.local") ? ".env.local" : existsSync(".env") ? ".env" : null;
if (envFile) loadEnvFile(envFile);
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const { Client } = pg;
const { hash, verify } = argon2;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});

function generateSecurePin() {
  for (;;) {
    const pin = String(randomInt(0, 1_000_000)).padStart(6, "0");
    if (/^(\d)\1{5}$/.test(pin)) continue;
    const differences = [...pin].slice(1).map((digit, i) => Number(digit) - Number(pin[i]));
    if (differences.every((d) => d === 1 || d === -1)) continue;
    return pin;
  }
}

let inTransaction = false;
try {
  await client.connect();
  await client.query("BEGIN");
  inTransaction = true;
  const selected = await client.query(
    `SELECT id, phone, login_pin_hash, signup_method
       FROM public.users
      WHERE lower(email) = $1
        AND deleted_at IS NULL
        AND disabled_at IS NULL
      FOR UPDATE`,
    [email],
  );
  if (selected.rowCount !== 1) throw new Error("Exactly one active account was not found. No changes saved.");
  const user = selected.rows[0];
  if (user.login_pin_hash && flag !== "--rotate") {
    throw new Error("A mobile PIN is already enabled. Use --rotate to generate a replacement after verifying the account.");
  }
  const conflict = await client.query(
    `SELECT id FROM public.users
       WHERE phone = $1 AND id <> $2 AND deleted_at IS NULL LIMIT 1`,
    [phone, user.id],
  );
  if (conflict.rowCount) throw new Error("The mobile number is already attached to another account. No changes saved.");

  const pin = generateSecurePin();
  const pinHash = await hash(pin);
  if (!await verify(pinHash, pin)) throw new Error("PIN hash self-check failed.");
  await client.query(
    `UPDATE public.users
        SET phone = $1,
            login_pin_hash = $2,
            phone_verified_at = CASE WHEN phone IS NOT DISTINCT FROM $1::text
                                     THEN phone_verified_at ELSE NULL END,
            updated_at = NOW()
      WHERE id = $3`,
    [phone, pinHash, user.id],
  );
  await client.query("COMMIT");
  inTransaction = false;
  console.log("SUCCESS: Existing account has a mobile sign-in PIN.");
  console.log("Signup method and email/password remain unchanged.");
  console.log(`YOUR NEW 6-DIGIT PIN (shown once): ${pin}`);
  console.log("Keep it private. Run a new production build containing the mobile-auth fix before signing in.");
} catch (error) {
  if (inTransaction) await client.query("ROLLBACK").catch(() => {});
  console.error("FAILED:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
