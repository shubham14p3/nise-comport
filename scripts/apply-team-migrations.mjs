#!/usr/bin/env node
/**
 * Team only. Creates just what the Team screen needs, and nothing from the other migrations:
 *   - users.permissions and users.must_change_password (staff access and temporary passwords)
 *   - team_members, plus its contact columns (migrations 0019 and 0027)
 * Then, optionally, adds one staff member directly in the database (for a local run without the UI).
 *
 *   node scripts/apply-team-migrations.mjs
 *   node scripts/apply-team-migrations.mjs --add-staff person@example.com --name "Full Name" --permissions requests,pan
 *
 * Existing rows are never dropped or overwritten. A new staff member gets a temporary password,
 * printed once; they must change it at their first sign-in.
 */
import { existsSync, readFileSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { randomBytes } from "node:crypto";
import pg from "pg";
import { hash } from "@node-rs/argon2";

for (const file of [".env.local", ".env"]) if (existsSync(file)) loadEnvFile(file);
const url = process.env.DATABASE_URL?.trim();
if (!url) { console.error("DATABASE_URL is missing."); process.exit(1); }
const ssl = process.env.DATABASE_SSL?.trim().toLowerCase();
const pool = new pg.Pool({ connectionString: url, max: 1, ssl: ssl && ssl !== "false" ? { rejectUnauthorized: false } : undefined });
// 42P07 table exists, 42710 object exists, 42701 column exists, 42P16 already set, 42P06 schema exists
const HARMLESS = new Set(["42P07", "42710", "42701", "42P16", "42P06"]);
// Keep in step with STAFF_PERMISSIONS in src/lib/permissions.ts
const KNOWN_PERMISSIONS = ["requests", "payments", "charge", "records", "pan", "promotions", "content", "campaigns", "whatsapp", "wallet", "mail", "counter"];

const args = process.argv.slice(2);
const option = (name) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const addEmail = option("--add-staff")?.trim().toLowerCase();
const addName = option("--name")?.trim();
const addPermissions = (option("--permissions") ?? "requests").split(",").map((item) => item.trim()).filter(Boolean);

if (addEmail) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(addEmail)) { console.error("Enter a valid --add-staff email address."); process.exit(1); }
  if (!addName || addName.length < 2) { console.error('Add --name "Full Name" (at least 2 characters).'); process.exit(1); }
  const unknown = addPermissions.filter((item) => !KNOWN_PERMISSIONS.includes(item));
  if (unknown.length) { console.error(`Unknown permission(s): ${unknown.join(", ")}. Choose from: ${KNOWN_PERMISSIONS.join(", ")}`); process.exit(1); }
}

// Team-only statements, in order. Files are the ones in drizzle/; the column lines come from 0007.
const statements = [
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "permissions" jsonb DEFAULT '[]'::jsonb NOT NULL`,
  `UPDATE "users" SET "permissions" = '["requests"]'::jsonb WHERE "role" = 'staff' AND "permissions" = '[]'::jsonb`,
  ...["0019_team_members.sql", "0027_team_contacts.sql"].flatMap((file) =>
    readFileSync(`drizzle/${file}`, "utf8").split("--> statement-breakpoint").map((part) => part.trim()).filter(Boolean)),
];

let created = 0, skipped = 0, failed = 0;
try {
  for (const statement of statements) {
    try { await pool.query(statement); created++; }
    catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (HARMLESS.has(code)) { skipped++; continue; }
      failed++; console.error(`✗ ${error instanceof Error ? error.message : error}\n  ${statement.slice(0, 120).replace(/\s+/g, " ")}`);
    }
  }
  console.log(`Team tables and columns: ${created} statement(s) run, ${skipped} already in place, ${failed} problem(s).`);

  const { rows: teamTables } = await pool.query("select table_name from information_schema.tables where table_schema = 'public' and table_name = 'team_members'");
  console.log(teamTables.length ? "✓ team_members" : "✗ MISSING team_members");

  if (addEmail) {
    const { rows } = await pool.query("select id, role, deleted_at from users where email = $1", [addEmail]);
    const existing = rows[0];
    if (existing?.role === "admin") {
      console.log(`${addEmail} is already an owner. Nothing changed.`);
    } else if (existing?.deleted_at) {
      console.log(`${addEmail} belongs to a closed account. Nothing changed; use a different email or restore it in the app.`);
    } else if (existing) {
      await pool.query(`update users set role = 'staff', permissions = $2::jsonb, updated_at = now() where id = $1`, [existing.id, JSON.stringify(addPermissions)]);
      console.log(`✓ ${addEmail} is now staff with: ${addPermissions.join(", ")}. Their sign-in is unchanged.`);
    } else {
      const password = randomBytes(9).toString("base64url");
      await pool.query(
        `insert into users (name, email, role, permissions, password_hash, must_change_password, email_verified_at)
         values ($1, $2, 'staff', $3::jsonb, $4, true, now())`,
        [addName, addEmail, JSON.stringify(addPermissions), await hash(password)],
      );
      console.log(`✓ Created staff account ${addEmail} with: ${addPermissions.join(", ")}`);
      console.log(`  Temporary password (shown once): ${password}`);
      console.log("  They must change it at their first sign-in.");
    }
  }
} finally { await pool.end(); }
