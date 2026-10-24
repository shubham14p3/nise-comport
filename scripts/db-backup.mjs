#!/usr/bin/env node
/**
 * Saves a dated copy of the live database on this computer.
 *   npm run db:backup                 -> backups/nise-comport-2026-10-19_11-30.sql
 *   npm run db:backup -- --keep 30    -> also deletes copies older than the newest 30
 *   npm run db:backup -- --with-sessions  -> also include sign-in sessions and one-time codes (normally left out)
 *   npm run db:backup -- --no-readable    -> explicit privacy-first default (SQL only)
 *   npm run db:backup -- --with-readable  -> OPTIONAL: additionally export decrypted spreadsheets
 *
 * Besides the .sql file (which keeps customer records encrypted, exactly as the site stores them), two optional READABLE files can be saved
 * with --with-readable for you to open in Excel: backups/nise-comport-records-readable-<date>.csv (every customer record, decrypted) and
 * backups/nise-comport-pan-readable-<date>.csv (the PAN list, decrypted). Needs RECORDS_ENCRYPTION_KEY / PAN_ENCRYPTION_KEY in .env.
 * These two files are plain text: keep them on an encrypted disk, never commit, email or share them. They are not for db:restore.
 * Aadhaar numbers are shortened to the last four digits, as in the admin screens.
 *
 * It only READS the database. The file holds every table's rows (customers, requests, messages…) as SQL that
 * `npm run db:restore` can load into an empty database whose tables were created by `npm run db:migrate`.
 * It does not need pg_dump. Private uploaded files live on the server disk, not in the database: copy that folder separately.
 * The file contains personal data. Keep it on your own encrypted disk and never commit or share it.
 */
import { createWriteStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { once } from "node:events";
import { createDecipheriv } from "node:crypto";
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
// Privacy-first: never produce decrypted personal-data CSVs unless explicitly requested.
const readable = args.includes("--with-readable") && !args.includes("--no-readable");
const SKIP = withSessions ? [] : ["sessions", "email_otps", "phone_otps", "rate_limits"];

const ssl = process.env.DATABASE_SSL?.trim().toLowerCase();
const dbHost = new URL(url).hostname;
const useSsl = ssl ? ssl !== "false" : !["localhost", "127.0.0.1", "::1"].includes(dbHost);
const pool = new pg.Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 15_000, ssl: useSsl ? { rejectUnauthorized: false } : undefined });
const pad = (n) => String(n).padStart(2, "0");
const now = new Date();
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
mkdirSync("backups", { recursive: true });
const target = join("backups", `nise-comport-${stamp}.sql`);
const out = createWriteStream(target, { encoding: "utf8" });
const write = async (text) => { if (!out.write(text)) await once(out, "drain"); };
const quote = (name) => `"${name.replace(/"/g, '""')}"`;

const t0 = Date.now();
const secs = () => `${((Date.now() - t0) / 1000).toFixed(0)}s`;
const log = (text) => console.log(`[${secs().padStart(4)}] ${text}`);
let lastTick = 0;
const tick = (text) => { if (Date.now() - lastTick > 1500) { lastTick = Date.now(); log(text); } };
const bar = (done, total) => { const w = 24, f = total ? Math.round((done / total) * w) : w; return `[${"#".repeat(f)}${".".repeat(w - f)}] ${total ? Math.round((done / total) * 100) : 100}%`; };

// ---- Readable (decrypted) copies -------------------------------------------------------------------------------------------
const keys = [process.env.RECORDS_ENCRYPTION_KEY, process.env.PAN_ENCRYPTION_KEY].map((value) => value?.trim()).filter(Boolean).map((value) => Buffer.from(value, "base64")).filter((bytes) => bytes.byteLength === 32);
function openSealed(sealed) {
  const [version, nonce, tag, body] = String(sealed ?? "").split(".");
  if (version !== "v1" || !nonce || !tag || !body) return null;
  for (const key of keys) {
    try {
      const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(nonce, "base64url"));
      decipher.setAuthTag(Buffer.from(tag, "base64url"));
      return JSON.parse(Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8"));
    } catch { /* try the next key */ }
  }
  return null;
}
const csvCell = (value) => { const text = value === null || value === undefined ? "" : String(value); return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; };
const csvLine = (cells) => `${cells.map(csvCell).join(",")}\r\n`;
const maskAadhaar = (value) => { const digits = String(value ?? "").replace(/\D/g, ""); return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : ""; };
async function writeReadable(client, stamp) {
  if (!keys.length) { log("Readable copies skipped: no RECORDS_ENCRYPTION_KEY / PAN_ENCRYPTION_KEY in .env."); return; }
  const files = [];
  const exists = async (table) => (await client.query("select to_regclass($1) as t", [`public.${table}`])).rows[0].t !== null;
  if (await exists("customer_records")) {
    const file = join("backups", `nise-comport-records-readable-${stamp}.csv`);
    const sink = createWriteStream(file, { encoding: "utf8" });
    const put = async (text) => { if (!sink.write(text)) await once(sink, "drain"); };
    await put("\uFEFF" + csvLine(["Service", "Source", "Name", "Mobile", "WhatsApp", "Other mobiles", "Email", "Address", "PAN", "Aadhaar", "Record date", "Renewal on", "Vehicle", "Birthday (day/month)", "Other columns from the register"]));
    await client.query("declare nc_read no scroll cursor for select service, source, name, record_date::text as record_date, renewal_on::text as renewal_on, vehicle, birth_day, birth_month, payload_enc from customer_records order by service, name");
    let ok = 0, bad = 0;
    for (;;) {
      const { rows } = await client.query("fetch 500 from nc_read");
      if (!rows.length) break;
      for (const row of rows) {
        const data = openSealed(row.payload_enc);
        if (!data) { bad++; await put(csvLine([row.service, row.source, row.name, "(could not be decrypted: wrong key?)"])); continue; }
        ok++;
        await put(csvLine([row.service, row.source, row.name, data.mobile, data.whatsapp, (data.altMobiles ?? []).join(" / "), data.email, data.address, data.pan, maskAadhaar(data.aadhaar), row.record_date, row.renewal_on, row.vehicle, row.birth_day ? `${row.birth_day}/${row.birth_month}` : "", Object.entries(data.fields ?? {}).map(([label, value]) => `${label}: ${value}`).join(" | ")]));
      }
    }
    await client.query("close nc_read");
    sink.end(); await once(sink, "finish");
    files.push(`${file}  (${ok} records readable${bad ? `, ${bad} could not be decrypted` : ""})`);
  }
  if (await exists("pan_records")) {
    const file = join("backups", `nise-comport-pan-readable-${stamp}.csv`);
    const { rows } = await client.query("select holder_name, encrypted_pan, record_status from pan_records order by holder_name");
    const lines = ["\uFEFF" + csvLine(["Holder name", "PAN", "Status"])];
    let ok = 0;
    for (const row of rows) { const pan = openSealed(row.encrypted_pan); if (pan) ok++; lines.push(csvLine([row.holder_name, typeof pan === "string" ? pan : "(could not be decrypted)", row.record_status])); }
    const sink = createWriteStream(file, { encoding: "utf8" }); sink.end(lines.join("")); await once(sink, "finish");
    files.push(`${file}  (${ok} of ${rows.length} PANs readable)`);
  }
  for (const line of files) log(`Readable copy: ${line}`);
}

try {
  log(`Connecting to ${new URL(url).hostname}:${new URL(url).port || 5432} …`);
  const client = await pool.connect();
  log("Connected.");
  try {
    // One consistent snapshot, so rows that point at each other still match.
    await client.query("begin transaction isolation level repeatable read read only");
    const tables = (await client.query("select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name")).rows.map((r) => r.table_name).filter((t) => !SKIP.includes(t));
    const identity = (await client.query("select table_name, column_name from information_schema.columns where table_schema = 'public' and is_identity = 'YES'")).rows;
    log(`Counting rows in ${tables.length} tables …`);
    const counts = new Map();
    for (const table of tables) counts.set(table, (await client.query(`select count(*)::int n from ${quote(table)}`)).rows[0].n);
    const grand = [...counts.values()].reduce((a, b) => a + b, 0);
    log(`${grand} rows to save. Writing ${target}`);
    await write(`-- NISE COMPORT data backup, taken ${now.toISOString()} from ${new URL(url).hostname}\n-- Restore: create the tables with "npm run db:migrate" on an empty database, then "npm run db:restore -- ${target.replace(/\\/g, "/")}"\n`);
    await write("set session_replication_role = replica;\nbegin;\n");
    let done = 0, index = 0;
    for (const table of tables) {
      index++;
      const total = counts.get(table);
      if (!total) { log(`(${index}/${tables.length}) ${table}: empty`); continue; }
      // A cursor hands the rows over in small batches, so a big table never has to fit in memory at once.
      await client.query(`declare nc_cur no scroll cursor for select to_jsonb(t) as j from ${quote(table)} t`);
      let saved = 0;
      for (;;) {
        const { rows } = await client.query("fetch 200 from nc_cur");
        if (!rows.length) break;
        const chunk = JSON.stringify(rows.map((r) => r.j));
        let tag = "nc"; while (chunk.includes(`$${tag}$`)) tag += "x";
        await write(`insert into ${quote(table)} overriding system value select * from jsonb_populate_recordset(null::${quote(table)}, $${tag}$${chunk}$${tag}$::jsonb);\n`);
        saved += rows.length; done += rows.length;
        tick(`(${index}/${tables.length}) ${table}: ${saved}/${total}   overall ${bar(done, grand)}`);
      }
      await client.query("close nc_cur");
      log(`(${index}/${tables.length}) ${table}: ${saved} rows   overall ${bar(done, grand)}`);
    }
    for (const { table_name, column_name } of identity) {
      if (!tables.includes(table_name)) continue;
      await write(`select setval(pg_get_serial_sequence('${quote(table_name)}', '${column_name}'), coalesce((select max(${quote(column_name)}) from ${quote(table_name)}), 0) + 1, false);\n`);
    }
    await write("commit;\nset session_replication_role = default;\n");
    if (readable) await writeReadable(client, stamp);
    await client.query("rollback");
    out.end(); await once(out, "finish");
    console.log(`\n✓ Saved ${done} rows from ${tables.length} tables to ${target} (${(statSync(target).size / 1024 / 1024).toFixed(2)} MB) in ${secs()}`);
    if (SKIP.length) console.log(`  Left out (temporary): ${SKIP.join(", ")}`);
    if (readable) console.log("  The *-readable-*.csv files are NOT encrypted: keep them on an encrypted disk and never share them.");
    console.log("  Private uploaded files are not in the database; copy the server's .private-uploads folder too.");
  } finally { client.release(); }
  if (keep > 0) {
    const sql = readdirSync("backups").filter((f) => /^nise-comport-\d.*\.sql$/.test(f)).sort().reverse();
    for (const f of sql.slice(keep)) { unlinkSync(join("backups", f)); console.log(`  Removed old copy ${f}`); }
    const kept = new Set(sql.slice(0, keep).map((f) => f.replace(/^nise-comport-|\.sql$/g, "")));
    for (const f of readdirSync("backups").filter((name) => /-readable-.*\.csv$/.test(name))) {
      if (!kept.has(f.replace(/^.*-readable-|\.csv$/g, ""))) { unlinkSync(join("backups", f)); console.log(`  Removed old readable copy ${f}`); }
    }
  }
} catch (error) {
  out.destroy(); try { unlinkSync(target); } catch { /* nothing written */ }
  console.error("✗ Backup failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally { await pool.end(); }
