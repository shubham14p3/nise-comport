#!/usr/bin/env node
/**
 * Reconcile missing Counter comments table, index and the 0044 mobile/WhatsApp
 * future-write trigger. Uses the reviewed, original migration SQL verbatim.
 * Existing user phone/WhatsApp values are NEVER bulk updated by this script.
 * No modifications to the Drizzle migration ledger or Universal Job IDs.
 *
 * DRY RUN: npm run db:counter:repair
 * APPLY:   npm run db:counter:repair -- --apply --backup-file "backups/<fresh>.sql" --confirm "database@host"
 */
import { existsSync, readFileSync, statSync, openSync, readSync, closeSync } from "node:fs";
import { loadEnvFile } from "node:process";
import pg from "pg";

for (const file of [".env.local", ".env"]) if (existsSync(file)) loadEnvFile(file);
const url = process.env.DATABASE_URL?.trim();
if (!url) { console.error("DATABASE_URL missing"); process.exit(1); }
const u = new URL(url);
if (!["postgres:", "postgresql:"].includes(u.protocol)) { console.error("Not a PostgreSQL URL"); process.exit(1); }
const target = decodeURIComponent(u.pathname.slice(1)) + "@" + u.hostname;
const args = process.argv.slice(2);
const index = (flag) => args.indexOf(flag);
const value = (flag) => index(flag) >= 0 ? args[index(flag) + 1] : undefined;
const apply = args.includes("--apply");
if (apply) {
  if (value("--confirm") !== target) {
    console.error("Confirmation mismatch. Expected --confirm " + JSON.stringify(target));
    process.exit(1);
  }
  const backup = value("--backup-file");
  if (!backup || !existsSync(backup) || statSync(backup).size < 1024) {
    console.error("A fresh, nonempty SQL backup is required."); process.exit(1);
  }
  const stat = statSync(backup);
  if (Date.now() - stat.mtimeMs > 24 * 3600_000 || stat.mtimeMs > Date.now() + 60_000) {
    console.error("Backup is not fresh (24 hours). Create and export a new backup."); process.exit(1);
  }
  const fd = openSync(backup, "r"), buffer = Buffer.alloc(512);
  const count = readSync(fd, buffer, 0, buffer.length, 0);
  closeSync(fd);
  const header = buffer.subarray(0, count).toString("utf8");
  if (!header.startsWith("-- NISE COMPORT data backup") || !header.includes("from " + u.hostname)) {
    console.error("Backup is not a NiSE backup from the intended host."); process.exit(1);
  }
}
const sql = readFileSync("drizzle/0044_counter_comments_mobile_whatsapp.sql", "utf8");
const bulkUserUpdate = 'UPDATE "users" SET "whatsapp" = "phone" WHERE "whatsapp" IS DISTINCT FROM "phone";';
if (!sql.trimEnd().endsWith(bulkUserUpdate) || !sql.includes('CREATE TABLE IF NOT EXISTS "counter_comments"') ||
    !sql.includes('CREATE INDEX IF NOT EXISTS "counter_comments_visit_created_idx"') ||
    !sql.includes('CREATE OR REPLACE FUNCTION nise_match_mobile_whatsapp()') ||
    !sql.includes('CREATE TRIGGER nise_mobile_whatsapp')) {
  console.error("Migration 0044 content does not match the reviewed recovery expectations."); process.exit(1);
}
// Perform schema and future-write repairs but never the original 0044 bulk user UPDATE.
const ddl = sql.trimEnd().slice(0, -bulkUserUpdate.length).trim();
const ssl = process.env.DATABASE_SSL?.trim().toLowerCase();
const useSsl = ssl ? ssl !== "false" : !["localhost", "127.0.0.1", "::1"].includes(u.hostname);
const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 10_000, ssl: useSsl ? { rejectUnauthorized: false } : undefined });

async function inspect() {
  const { rows: [r] } = await client.query(`SELECT
    to_regclass('public.counter_comments') IS NOT NULL AS table_ok,
    to_regclass('public.counter_comments_visit_created_idx') IS NOT NULL AS index_ok,
    to_regprocedure('public.nise_match_mobile_whatsapp()') IS NOT NULL AS function_ok,
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.users'::regclass
      AND tgname = 'nise_mobile_whatsapp' AND NOT tgisinternal AND tgenabled <> 'D') AS trigger_ok,
    (SELECT count(*)::int FROM jobs) AS job_count,
    (SELECT count(*)::int FROM users WHERE whatsapp IS DISTINCT FROM phone) AS unsynced_users`);
  return r;
}
let started = false;
try {
  await client.connect();
  const { rows: [current] } = await client.query("SELECT current_database() AS db");
  if (current.db !== decodeURIComponent(u.pathname.slice(1))) throw new Error("Connected database does not match intended name.");
  const before = await inspect();
  console.log("Database:", target);
  console.log("Before:", JSON.stringify(before));
  if (!apply) {
    console.log("READ ONLY. To fix 0044 structures after a fresh backup and clone rehearsal:");
    console.log('npm run db:counter:repair -- --apply --backup-file "backups/<fresh>.sql" --confirm ' + JSON.stringify(target));
  } else if (before.table_ok && before.index_ok && before.function_ok && before.trigger_ok) {
    console.log("Already repaired; no database changes made.");
  } else {
    await client.query("BEGIN");
    started = true;
    await client.query("SET LOCAL lock_timeout = '8s'");
    await client.query("SET LOCAL statement_timeout = '120s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('nise-counter-comments-0044-repair'))");
    await client.query(ddl);
    const after = await inspect();
    if (!after.table_ok || !after.index_ok || !after.function_ok || !after.trigger_ok) throw new Error("0044 structure verification failed, rolling back.");
    if (before.job_count !== after.job_count) throw new Error("Job ID count changed during repair; rolling back.");
    await client.query("COMMIT");
    started = false;
    console.log("RECOVERED: counter_comments table, index, function and trigger.");
    console.log("Universal Job IDs before/after:", before.job_count, after.job_count);
    if (after.unsynced_users > 0) console.log("NOTICE:", after.unsynced_users, "existing users have different phone/WhatsApp values. Existing values were NOT modified.");
  }
  if (before.unsynced_users > 0 && !apply) console.log("Existing differing phone/WhatsApp values:", before.unsynced_users, "(no automatic data rewrite)");
  console.log("Drizzle migration ledger was not modified; audit using npm run db:migrations:doctor.");
} catch (error) {
  if (started) await client.query("ROLLBACK").catch(() => undefined);
  console.error("Counter migration repair failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally { await client.end().catch(() => undefined); }
