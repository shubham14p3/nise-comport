#!/usr/bin/env node
/**
 * NiSE COMPORT schema audit / additive sync.
 *
 * Local Windows (no Next build, no SSH):
 *   npm run db:schema:check
 *   npm run db:backup -- --no-readable
 *   npm run db:schema:plan
 *   npm run db:schema:apply -- --backup-confirmed --confirm "database@hostname"
 *   npm run db:schema:check
 *
 * ONLY planned CREATE TABLE, ADD COLUMN, missing indexes for NEW tables,
 * and missing foreign-key constraints for NEW tables are applied. No data DML
 * or Drizzle migration-ledger mutation. One atomic transaction, fail closed.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadEnvFile } from "node:process";
import pg from "pg";
import { getTableConfig } from "drizzle-orm/pg-core";
import * as models from "../src/db/schema.ts";
import { migrationSteps, planRepair } from "./schema-compat-core.mjs";

if (existsSync(".env.local")) loadEnvFile(".env.local");
else if (existsSync(".env")) loadEnvFile(".env");

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const reportOnly = !apply;
const confirmation = args[args.indexOf("--confirm") + 1];
const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) { console.error("DATABASE_URL missing. Aborting."); process.exit(1); }

const uri = new URL(connectionString);
if (!["postgres:", "postgresql:"].includes(uri.protocol)) throw new Error("DATABASE_URL is not PostgreSQL.");
const target = `${decodeURIComponent(uri.pathname.slice(1))}@${uri.hostname}`;
const safeTarget = `${uri.hostname}:${uri.port || "5432"}/${decodeURIComponent(uri.pathname.slice(1))}`;
if (apply && (!args.includes("--backup-confirmed") || confirmation !== target)) {
  console.error("APPLY BLOCKED. First back up the database, then pass: --backup-confirmed --confirm " + JSON.stringify(target));
  process.exit(1);
}

const expected = new Map();
const sqlTypes = new Map();
for (const item of Object.values(models)) {
  try {
    const table = getTableConfig(item);
    if (!table?.name || !table.columns?.length) continue;
    const cols = new Set(table.columns.map((c) => c.name));
    expected.set(table.name, cols);
    sqlTypes.set(table.name, new Map(table.columns.map((c) => [c.name, c.getSQLType()])));
  } catch { /* not a Drizzle table */ }
}
if (expected.size < 30) throw new Error("Could not import Drizzle model metadata; refusing to continue.");

const migrations = readdirSync("drizzle").filter((name) => /^\d{4}_.+\.sql$/.test(name)).sort()
  .map((name) => ({ name, content: readFileSync(join("drizzle", name), "utf8") }));
const steps = migrationSteps(migrations);
const sslFlag = process.env.DATABASE_SSL?.trim().toLowerCase();
// Hosted PostgreSQL usually requires TLS even for scripts invoked on Windows.
const remoteHost = !["localhost", "127.0.0.1", "::1"].includes(uri.hostname);
const useSsl = sslFlag ? sslFlag !== "false" : remoteHost;
const client = new pg.Client({
  connectionString, ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 10000,
});

async function inventory() {
  const rows = (await client.query(`
    SELECT cls.relname AS table_name, att.attname AS column_name,
           format_type(att.atttypid, att.atttypmod) AS column_type
      FROM pg_class cls
      JOIN pg_namespace ns ON ns.oid = cls.relnamespace
      JOIN pg_attribute att ON att.attrelid = cls.oid
     WHERE ns.nspname = 'public' AND cls.relkind IN ('r', 'p')
       AND att.attnum > 0 AND NOT att.attisdropped
     ORDER BY cls.relname, att.attnum
  `)).rows;
  const tables = new Map(), types = new Map();
  for (const row of rows) {
    if (!tables.has(row.table_name)) { tables.set(row.table_name, new Set()); types.set(row.table_name, new Map()); }
    tables.get(row.table_name).add(row.column_name);
    types.get(row.table_name).set(row.column_name, row.column_type);
  }
  const indices = new Set((await client.query("SELECT indexname FROM pg_indexes WHERE schemaname = 'public'")).rows.map((r) => r.indexname));
  return { tables, types, indices };
}

/** Execute real SELECTs without touching customer rows. */
async function criticalQueries(failClosed = false) {
  const critical = [
    "users", "rate_limits", "email_otps", "sessions", "coupons",
    "coupon_blocks", "coupon_credits", "hardware_items",
    "mail_tickets", "mail_messages", "mail_attachments", "mail_sync",
    "qr_scans", "record_claims", "record_flags", "outreach_log", "outreach_settings",
  ];
  let failed = 0;
  console.log("\nCritical read-only SQL probes (LIMIT 0):");
  for (const table of critical) {
    const columns = expected.get(table);
    if (!columns) continue;
    const quote = (name) => '"' + name.replaceAll('"', '""') + '"';
    try {
      await client.query(`SELECT ${[...columns].map(quote).join(", ")} FROM public.${quote(table)} LIMIT 0`);
      console.log(`  PASS ${table}`);
    } catch (error) {
      failed += 1;
      console.log(`  FAIL ${table}: ${error?.code || "query_failed"}`);
      if (failClosed) throw error;
    }
  }
  return failed;
}

const normalizeType = (text) => String(text).toLowerCase().replace(/\s+/g, "").replace(/int4/g, "integer").replace(/int8/g, "bigint").replace(/bool/g, "boolean").replace(/timestamp\(6\)/g, "timestamp").replace(/timestamptz/g, "timestampwithtimezone");
function drift(actual) {
  const missing = [], typeMismatch = [];
  for (const [table, cols] of expected) {
    if (!actual.tables.has(table)) { missing.push({ table, reason: "table missing", columns: cols.size }); continue; }
    for (const col of cols) {
      if (!actual.tables.get(table).has(col)) { missing.push({ table, column: col, reason: "column missing" }); continue; }
      const expectedType = sqlTypes.get(table).get(col);
      const actualType = actual.types.get(table).get(col);
      if (expectedType && actualType && normalizeType(expectedType) !== normalizeType(actualType)) {
        typeMismatch.push({ table, column: col, expectedType, actualType });
      }
    }
  }
  return { missing, typeMismatch };
}
function printGroup(records, heading, limit = 150) {
  console.log(`\n${heading}: ${records.length}`);
  for (const row of records.slice(0, limit)) {
    if (typeof row === "string") console.log("  - " + row);
    else console.log(`  - ${row.table}${row.column ? "." + row.column : ""}: ${row.reason || row.name || ""}`);
  }
  if (records.length > limit) console.log(`  ... and ${records.length - limit} more`);
}

let opened = false;
try {
  await client.connect();
  opened = true;
  const dbName = (await client.query("SELECT current_database() AS name")).rows[0].name;
  if (dbName !== decodeURIComponent(uri.pathname.slice(1))) throw new Error("Connected database does not match DATABASE_URL target.");
  console.log(`NiSE schema audit: ${safeTarget} [${reportOnly ? "READ-ONLY" : "CONTROLLED ADDITIVE APPLY"}]`);
  const before = await inventory();
  if (!before.tables.has("users") || !before.tables.has("coupons")) {
    throw new Error("Existing NiSE users/coupons tables not found. Wrong database or incomplete bootstrap; refusing automatic changes.");
  }
  const initial = drift(before);
  const plan = planRepair(expected, before.tables, steps, before.indices);
  printGroup(initial.missing, "MISSING TABLES / COLUMNS");
  printGroup(plan.blockers, "UNSAFE OR UNDOCUMENTED GAPS (MANUAL REVIEW)");
  console.log(`\nPlanned safe additive statements: ${plan.pending.length}`);
  for (const step of plan.pending) console.log(`  ${step.kind.padEnd(6)} ${step.table}${step.column ? "." + step.column : ""} [${step.name}]`);
  console.log(`\nIndexes on existing tables not automatically rebuilt: ${plan.deferredIndexes.length}`);
  if (plan.deferredIndexes.length) console.log("  These require separate indexing review (unique indexes can fail on duplicate existing rows).");
  if (initial.typeMismatch.length) {
    console.log(`\nTYPE DIFFERENCES REQUIRING REVIEW: ${initial.typeMismatch.length}`);
    for (const x of initial.typeMismatch.slice(0, 25)) console.log(`  ${x.table}.${x.column}: expected ${x.expectedType}; database ${x.actualType}`);
  }

  if (!apply) {
    const probeFailures = await criticalQueries();
    console.log(`\nTo back up locally: npm run db:backup -- --no-readable`);
    console.log(`To apply: npm run db:schema:apply -- --backup-confirmed --confirm ${JSON.stringify(target)}`);
    if (initial.missing.length || plan.blockers.length || probeFailures) process.exitCode = 1;
  } else {
    if (plan.blockers.length) throw new Error("Unresolved table/column gaps; no SQL applied.");
    if (!plan.pending.length) {
      console.log("\nNo missing additive structures. Nothing changed.");
    } else {
      await client.query("BEGIN");
      try {
        await client.query("SET LOCAL lock_timeout = '5s'");
        await client.query("SET LOCAL statement_timeout = '60s'");
        await client.query("SELECT pg_advisory_xact_lock(hashtext('nise-schema-additive-sync-v1'))");
        for (const [i, step] of plan.pending.entries()) {
          console.log(`APPLY ${i + 1}/${plan.pending.length}: ${step.kind} ${step.table}${step.column ? "." + step.column : ""}`);
          await client.query(step.sql);
        }
        const after = await inventory();
        const result = drift(after);
        if (result.missing.length) throw new Error(`Still missing ${result.missing.length} required table(s)/column(s). Rolling back ALL changes.`);
        await criticalQueries(true);
        await client.query("COMMIT");
        console.log("\nSUCCESS: additive schema sync committed. No customer rows were modified or deleted.");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      }
    }
    const completed = drift(await inventory());
    printGroup(completed.missing, "REMAINING MISSING TABLES / COLUMNS");
    const probeFailures = await criticalQueries();
    if (completed.missing.length || probeFailures) process.exitCode = 1;
  }
} catch (error) {
  console.error("SCHEMA COMPATIBILITY FAILED:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (opened) await client.end().catch(() => {});
}
