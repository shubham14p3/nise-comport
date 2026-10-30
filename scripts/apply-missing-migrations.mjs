#!/usr/bin/env node
/**
 * Repair for a database whose migration log says "applied" while some tables are missing.
 * Runs the CREATE / ALTER statements of drizzle/*.sql in batches, one file at a time, and ignores
 * "already exists" results, so it only adds what is missing. It never drops or deletes anything.
 *
 *   node scripts/apply-missing-migrations.mjs                 all files, in batches of 5
 *   node scripts/apply-missing-migrations.mjs --batch 3       batches of 3 files
 *   node scripts/apply-missing-migrations.mjs --from 0034     start at the file that begins with 0034
 *   node scripts/apply-missing-migrations.mjs --only 0039     run just one file
 *   node scripts/apply-missing-migrations.mjs --pause         wait for Enter between batches
 *
 * If a statement is waiting on a lock (for example because the running app is using the table),
 * it says so after 5 seconds and gives up after 15 seconds. Stop `npm run dev` first.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { createInterface } from "node:readline/promises";
import pg from "pg";

for (const file of [".env.local", ".env"]) if (existsSync(file)) loadEnvFile(file);
const url = process.env.DATABASE_URL?.trim();
if (!url) { console.error("DATABASE_URL is missing."); process.exit(1); }
const ssl = process.env.DATABASE_SSL?.trim().toLowerCase();

const args = process.argv.slice(2);
const option = (name) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const batchSize = Math.max(1, Number(option("--batch") ?? 5));
const from = option("--from");
const only = option("--only");
const pause = args.includes("--pause");

const pool = new pg.Pool({ connectionString: url, max: 1, ssl: ssl && ssl !== "false" ? { rejectUnauthorized: false } : undefined });
// Fail after 15 s when a table is locked by another connection, instead of waiting forever.
pool.on("connect", (client) => { client.query("set lock_timeout = '15s'").catch(() => undefined); });
// 42P07 table exists, 42710 object exists, 42701 column exists, 42P16 already set, 42P06 schema exists
const HARMLESS = new Set(["42P07", "42710", "42701", "42P16", "42P06"]);

let files = readdirSync("drizzle").filter((name) => name.endsWith(".sql")).sort();
if (only) files = files.filter((name) => name.startsWith(only));
if (from) files = files.filter((name) => name >= from);
if (!files.length) { console.error("No migration files match."); await pool.end(); process.exit(1); }

/** Runs one statement. Says so after 5 s if it is still waiting (usually a lock held by another connection). */
async function runStatement(statement, file) {
  const slow = setTimeout(() => console.log(`  … still waiting on: ${statement.slice(0, 90).replace(/\s+/g, " ")}`), 5000);
  try { await pool.query(statement); return "ran"; }
  catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (HARMLESS.has(code)) return "skipped";
    console.error(`  ✗ ${file}: ${error instanceof Error ? error.message : error}\n    ${statement.slice(0, 120).replace(/\s+/g, " ")}`);
    return "failed";
  } finally { clearTimeout(slow); }
}

let total = { ran: 0, skipped: 0, failed: 0 };
const rl = pause ? createInterface({ input: process.stdin, output: process.stdout }) : null;
try {
  for (let start = 0; start < files.length; start += batchSize) {
    const batch = files.slice(start, start + batchSize);
    const batchTotal = { ran: 0, skipped: 0, failed: 0 };
    console.log(`\nBatch ${Math.floor(start / batchSize) + 1}: ${batch[0]} … ${batch[batch.length - 1]}`);
    for (const file of batch) {
      const statements = readFileSync(`drizzle/${file}`, "utf8").split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
      const counts = { ran: 0, skipped: 0, failed: 0 };
      process.stdout.write(`  ${file} … `);
      for (const statement of statements) {
        if (!/^(CREATE|ALTER|DO)\b/i.test(statement) || /\bDROP\b/i.test(statement)) { counts.skipped++; continue; }
        const result = await runStatement(statement, file);
        counts[result]++;
      }
      console.log(counts.failed ? "PROBLEM" : "ok", `(ran ${counts.ran}, already there ${counts.skipped}, problems ${counts.failed})`);
      for (const key of Object.keys(counts)) { batchTotal[key] += counts[key]; total[key] += counts[key]; }
    }
    console.log(`Batch done: ran ${batchTotal.ran}, already there ${batchTotal.skipped}, problems ${batchTotal.failed}`);
    if (rl && start + batchSize < files.length) await rl.question("Press Enter for the next batch… ");
  }
  const wanted = ["users", "payments", "service_prices", "whatsapp_messages", "legal_pages", "loyalty_settings", "phone_otps", "mail_tickets", "mail_messages", "mail_attachments", "mail_sync", "contact_change_requests", "team_members"];
  const { rows } = await pool.query("select table_name from information_schema.tables where table_schema = 'public' and table_name = any($1)", [wanted]);
  const have = new Set(rows.map((row) => row.table_name));
  console.log(`\nAll done: ran ${total.ran}, already there ${total.skipped}, problems ${total.failed}`);
  for (const name of wanted) console.log(`${have.has(name) ? "✓" : "✗ MISSING"} ${name}`);
} finally { rl?.close(); await pool.end(); }
