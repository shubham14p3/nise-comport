#!/usr/bin/env node
/**
 * Saves a dated copy of the live database on this computer.
 *   npm run db:backup                 -> backups/nise-comport-2026-10-19_11-30.sql
 *   npm run db:backup -- --keep 30    -> also deletes copies older than the newest 30
 *   npm run db:backup -- --with-sessions  -> also include sign-in sessions and one-time codes (normally left out)
 *
 * It only READS the database. The file holds every table's rows (customers, requests, messages…) as SQL that
 * `npm run db:restore` can load into an empty database whose tables were created by `npm run db:migrate`.
 * It does not need pg_dump. Private uploaded files live on the server disk, not in the database: copy that folder separately.
 * The file contains personal data. Keep it on your own encrypted disk and never commit or share it.
 */
import { createWriteStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { once } from "node:events";
import { loadEnvFile } from "node:process";
import { join } from "node:path";
import pg from "pg";

for (const file of [".env.local", ".env"]) if (existsSync(file)) loadEnvFile(file);
const url = process.env.DATABASE_URL?.trim();
if (!url) { console.error("DATABASE_URL is missing. Add it to .env.local."); process.exit(1); }
const args = process.argv.slice(2);
const keepIndex = args.indexOf("--keep");
const keep = keepIndex >= 0 ? Number(args[keepIndex + 1]) : 0;
const withSessions = args.includes("--with-sessions");
const SKIP = withSessions ? [] : ["sessions", "email_otps", "phone_otps", "rate_limits"];

const ssl = process.env.DATABASE_SSL?.trim().toLowerCase();
const pool = new pg.Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 15_000, ssl: ssl && ssl !== "false" ? { rejectUnauthorized: false } : undefined });
const pad = (n) => String(n).padStart(2, "0");
const now = new Date();
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
mkdirSync("backups", { recursive: true });
const target = join("backups", `nise-comport-${stamp}.sql`);
const out = createWriteStream(target, { encoding: "utf8" });
const write = async (text) => { if (!out.write(text)) await once(out, "drain"); };
const quote = (name) => `"${name.replace(/"/g, '""')}"`;

try {
  const client = await pool.connect();
  try {
    // One consistent snapshot, so rows that point at each other still match.
    await client.query("begin transaction isolation level repeatable read read only");
    const tables = (await client.query("select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name")).rows.map((r) => r.table_name).filter((t) => !SKIP.includes(t));
    const identity = (await client.query("select table_name, column_name from information_schema.columns where table_schema = 'public' and is_identity = 'YES'")).rows;
    await write(`-- NISE COMPORT data backup, taken ${now.toISOString()} from ${new URL(url).hostname}\n-- Restore: create the tables with "npm run db:migrate" on an empty database, then "npm run db:restore -- ${target.replace(/\\/g, "/")}"\n`);
    await write("set session_replication_role = replica;\nbegin;\n");
    let totalRows = 0;
    for (const table of tables) {
      const rows = (await client.query(`select to_jsonb(t) as j from ${quote(table)} t`)).rows;
      if (!rows.length) { console.log(`  ${table}: empty`); continue; }
      for (let i = 0; i < rows.length; i += 200) {
        const chunk = JSON.stringify(rows.slice(i, i + 200).map((r) => r.j));
        let tag = "nc"; while (chunk.includes(`$${tag}$`)) tag += "x";
        await write(`insert into ${quote(table)} overriding system value select * from jsonb_populate_recordset(null::${quote(table)}, $${tag}$${chunk}$${tag}$::jsonb);\n`);
      }
      totalRows += rows.length;
      console.log(`  ${table}: ${rows.length}`);
    }
    for (const { table_name, column_name } of identity) {
      if (!tables.includes(table_name)) continue;
      await write(`select setval(pg_get_serial_sequence('${quote(table_name)}', '${column_name}'), coalesce((select max(${quote(column_name)}) from ${quote(table_name)}), 0) + 1, false);\n`);
    }
    await write("commit;\nset session_replication_role = default;\n");
    await client.query("rollback");
    out.end(); await once(out, "finish");
    console.log(`\n✓ Saved ${totalRows} rows from ${tables.length} tables to ${target} (${(statSync(target).size / 1024 / 1024).toFixed(2)} MB)`);
    if (SKIP.length) console.log(`  Left out (temporary): ${SKIP.join(", ")}`);
    console.log("  Private uploaded files are not in the database; copy the server's .private-uploads folder too.");
  } finally { client.release(); }
  if (keep > 0) {
    const old = readdirSync("backups").filter((f) => /^nise-comport-.*\.sql$/.test(f)).sort().reverse().slice(keep);
    for (const f of old) { unlinkSync(join("backups", f)); console.log(`  Removed old copy ${f}`); }
  }
} catch (error) {
  out.destroy(); try { unlinkSync(target); } catch { /* nothing written */ }
  console.error("✗ Backup failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally { await pool.end(); }
