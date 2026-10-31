#!/usr/bin/env node
/**
 * READ ONLY migration journal + SQL artifacts diagnostic.
 * Never deletes/rewrites drizzle.__drizzle_migrations or customer records.
 * The ledger alone is not proof a migration's operations actually ran.
 */
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { loadEnvFile } from "node:process";
import pg from "pg";
for (const file of [".env.local", ".env"]) if (existsSync(file)) loadEnvFile(file);
const url = process.env.DATABASE_URL?.trim();
if (!url) { console.error("DATABASE_URL missing"); process.exit(1); }
const u = new URL(url);
const ssl = process.env.DATABASE_SSL?.trim().toLowerCase();
const useSsl = ssl ? ssl !== "false" : !["localhost", "127.0.0.1", "::1"].includes(u.hostname);
const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 10_000, ssl: useSsl ? { rejectUnauthorized: false } : undefined });
try {
  await client.connect();
  const name = decodeURIComponent(u.pathname.slice(1));
  const { rows: [connected] } = await client.query("SELECT current_database() AS db");
  if (connected.db !== name) throw new Error("Unexpected connected database");
  console.log("Migration audit (READ ONLY):", name + "@" + u.hostname);
  const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8"));
  const applied = await client.query("SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at, id");
  const entries = journal.entries.map(entry => {
    const file = "drizzle/" + entry.tag + ".sql";
    if (!existsSync(file)) return { tag: entry.tag, when: String(entry.when), fileFound: false, applied: false };
    const hash = createHash("sha256").update(readFileSync(file)).digest("hex");
    const row = applied.rows.find(item => String(item.created_at) === String(entry.when));
    return { tag: entry.tag, when: String(entry.when), fileFound: true,
      applied: Boolean(row), hashMatched: row ? row.hash === hash : null };
  });
  const missingFiles = entries.filter(item => !item.fileFound);
  const unapplied = entries.filter(item => !item.applied);
  const mismatch = entries.filter(item => item.applied && !item.hashMatched);
  const unknown = applied.rows.filter(row => !journal.entries.some(entry => String(entry.when) === String(row.created_at)));
  console.log("Repository migrations:", entries.length, "recorded in ledger:", applied.rowCount);
  console.log("Latest applied:", entries.filter(e => e.applied).at(-1)?.tag ?? "(none)");
  console.log("Unrecorded repository migrations:", unapplied.map(e => e.tag).join(", ") || "(none)");
  console.log("Missing SQL migration files:", missingFiles.map(e => e.tag).join(", ") || "(none)");
  console.log("Recorded hash mismatches:", mismatch.map(e => e.tag).join(", ") || "(none)");
  console.log("Unknown ledger timestamps:", unknown.map(row => String(row.created_at)).join(", ") || "(none)");
  const { rows: [artifacts] } = await client.query(`SELECT
    to_regclass('public.counter_comments') IS NOT NULL AS counter_comments,
    to_regclass('public.counter_comments_visit_created_idx') IS NOT NULL AS counter_comments_index,
    to_regprocedure('public.nise_match_mobile_whatsapp()') IS NOT NULL AS mobile_whatsapp_function,
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'nise_mobile_whatsapp' AND NOT tgisinternal AND tgenabled <> 'D') AS mobile_whatsapp_trigger,
    to_regclass('public.jobs') IS NOT NULL AS jobs,
    to_regclass('public.job_events') IS NOT NULL AS job_events,
    (SELECT count(*)::int FROM pg_trigger WHERE tgname IN ('nise_service_job_sync','nise_print_job_sync','nise_counter_job_sync','nise_historical_job_sync') AND NOT tgisinternal AND tgenabled <> 'D') AS job_triggers`);
  console.log("Actual relevant database artifacts:", JSON.stringify(artifacts));
  if (unapplied.length || mismatch.length || unknown.length) {
    console.warn("Migration LEDGER RECONCILIATION REQUIRED. Some schema may have been repaired out-of-band.");
    console.warn("Do NOT reset or backfill ledger timestamps without a fully verified migration-by-migration inventory.");
  } else {
    console.log("Journal timestamps and hashes match ledger; audit still cannot prove that every SQL operation has run.");
  }
} catch (error) {
  console.error("Read-only migration audit failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally { await client.end().catch(() => undefined); }
