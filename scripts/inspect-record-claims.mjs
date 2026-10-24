#!/usr/bin/env node
/**
 * Read-only diagnostics for an existing, populated but partially migrated
 * record_claims table. Prints counts and metadata only, never claim/user rows,
 * phone numbers, emails, keys or sensitive customer details.
 *
 * Windows: npm run db:claims:inspect
 */
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import pg from "pg";

if (existsSync(".env.local")) loadEnvFile(".env.local");
else if (existsSync(".env")) loadEnvFile(".env");

const value = process.env.DATABASE_URL?.trim();
if (!value) { console.error("DATABASE_URL missing"); process.exit(1); }
const target = new URL(value);
if (!["postgres:", "postgresql:"].includes(target.protocol)) throw new Error("Not a PostgreSQL connection URL.");
const ssl = process.env.DATABASE_SSL?.trim().toLowerCase();
const remoteHost = !["localhost", "127.0.0.1", "::1"].includes(target.hostname);
const client = new pg.Client({
  connectionString: value, connectionTimeoutMillis: 10_000,
  ssl: ssl ? ssl !== "false" ? { rejectUnauthorized: false } : undefined
    : remoteHost ? { rejectUnauthorized: false } : undefined,
});
const output = (title, rows) => {
  console.log("\n" + title);
  for (const row of rows) console.log("  " + Object.entries(row).map(([k, v]) => `${k}=${v ?? "(null)"}`).join(" | "));
};
try {
  await client.connect();
  await client.query("BEGIN READ ONLY");
  const db = (await client.query("SELECT current_database() AS name")).rows[0].name;
  if (db !== decodeURIComponent(target.pathname.slice(1))) throw new Error("Unexpected connected database.");
  console.log(`Read-only NiSE record_claims diagnostic: ${db}@${target.hostname}`);
  const check = await client.query("SELECT to_regclass('public.record_claims') AS t, to_regclass('public.users') AS u");
  if (!check.rows[0].t || !check.rows[0].u) throw new Error("Required existing table is missing.");

  output("Existing record_claims column definitions", (await client.query(`
    SELECT column_name AS name, data_type AS type, is_nullable AS nullable,
           CASE WHEN column_default IS NULL THEN 'no' ELSE 'yes' END AS has_default
      FROM information_schema.columns
     WHERE table_schema='public' AND table_name='record_claims'
     ORDER BY ordinal_position
  `)).rows);

  output("Row totals / relationship checks", (await client.query(`
    SELECT COUNT(*)::int AS claim_rows,
           COUNT(DISTINCT c.user_id)::int AS distinct_account_ids,
           COUNT(*) FILTER (WHERE u.id IS NULL)::int AS unmatched_account_ids,
           COUNT(*) FILTER (WHERE u.phone IS NOT NULL)::int AS accounts_with_phone,
           COUNT(*) FILTER (WHERE u.phone_verified_at IS NOT NULL)::int AS accounts_with_verified_phone,
           MIN(c.created_at)::text AS first_claim_created,
           MAX(c.created_at)::text AS last_claim_created
      FROM public.record_claims c
      LEFT JOIN public.users u ON u.id=c.user_id
  `)).rows);
  output("Claim status distribution (counts only)", (await client.query(`
    SELECT COALESCE(status, '(null)') AS status, COUNT(*)::int AS count
      FROM public.record_claims
     GROUP BY status ORDER BY count DESC
  `)).rows);
  output("Claim method distribution (counts only)", (await client.query(`
    SELECT COALESCE(method, '(null)') AS method, COUNT(*)::int AS count
      FROM public.record_claims
     GROUP BY method ORDER BY count DESC
  `)).rows);
  output("Indexes", (await client.query(`
    SELECT indexname AS name FROM pg_indexes
     WHERE schemaname='public' AND tablename='record_claims'
     ORDER BY indexname
  `)).rows);
  console.log("\nNo rows modified. Do not auto-fill claim phone/expiry from unrelated records.");
  await client.query("ROLLBACK");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("Inspection failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
