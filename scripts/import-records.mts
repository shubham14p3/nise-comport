#!/usr/bin/env node
/**
 * Imports Excel registers into the database from your own computer: every sheet is read with the
 * same rules as Admin → Records → Upload, then encrypted and saved. Rows that are already there
 * are skipped, so running it twice never duplicates anything.
 *
 *   npm run records:import -- "C:\path\folder"                                       every Excel file in a folder: show what would happen (nothing is written)
 *   npm run records:import -- "C:\path\Insurance.xlsx" "C:\path\BC-11110854.xlsx"     or pick files one by one
 *   npm run records:import -- --apply "C:\path\*.xlsx files…"                          save to the database
 *
 * Needs DATABASE_URL and the same encryption key the existing records use (the script checks this first).
 * Portal passwords, PINs and user IDs are never saved. The Excel files are not changed or uploaded anywhere.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { loadEnvFile } from "node:process";
import { parseWorkbook, type SheetInput } from "../src/lib/record-import.ts";
import { blindIndex, open, seal } from "../src/lib/vault.ts";

for (const file of [".env.local", ".env"]) if (existsSync(file)) { try { loadEnvFile(file); } catch { /* reported below */ } }
const apply = process.argv.includes("--apply");
// A folder means every .xlsx / .xlsm inside it (including sub-folders); Excel temp files (~$…) are ignored.
function expand(path: string): string[] {
  if (!existsSync(path)) return [path];
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? expand(join(path, entry.name)) : /\.(xlsx|xlsm)$/i.test(entry.name) && !entry.name.startsWith("~$") ? [join(path, entry.name)] : []).sort();
}
const files = process.argv.slice(2).filter((arg) => !arg.startsWith("--")).flatMap(expand);
if (!files.length) { console.error('Give at least one .xlsx file or a folder: npm run records:import -- "C:\\path\\file.xlsx"'); process.exit(1); }
const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) { console.error("DATABASE_URL is missing. Add it to .env.local."); process.exit(1); }
if (!process.env.RECORDS_ENCRYPTION_KEY?.trim() && !process.env.PAN_ENCRYPTION_KEY?.trim()) { console.error("RECORDS_ENCRYPTION_KEY is missing."); process.exit(1); }
const sslSetting = process.env.DATABASE_SSL?.trim().toLowerCase();
const { default: pg } = await import("pg");
const { default: ExcelJS } = await import("exceljs");
const pool = new pg.Pool({ connectionString, max: 2, connectionTimeoutMillis: 10_000, ssl: (sslSetting ? sslSetting !== "false" : process.env.NODE_ENV === "production") ? { rejectUnauthorized: false } : undefined });

const CONTACT_SERVICE: Record<string, string> = {
  pan: "pan", insurance: "insurance", passport: "passport", itr: "itr", "driving-licence": "driving-licence", "aadhaar-update": "aadhaar",
  ayushman: "ayushman", "voter-id": "voter-id", "bank-account": "banking", "caste-certificate": "income-caste", "income-certificate": "income-caste",
  "ews-certificate": "income-caste", "residence-certificate": "residence",
};
type Service = { service: string; renewalOn: string | null; note: string | null };
type Person = { name: string; services: Map<string, string | null>; area: string | null; email: string | null; birth: { month: number; day: number } | null };
const MAX_ROWS = 100_000; const MAX_COLUMNS = 80;

try {
  // Safety: the key in .env must open the records already saved, otherwise new rows would be unreadable.
  const { rows: sample } = await pool.query("select payload_enc from customer_records limit 1");
  if (sample[0]) { try { open(sample[0].payload_enc); } catch { console.error("The encryption key in .env cannot open the records already in the database. Fix RECORDS_ENCRYPTION_KEY first (see npm run records:scan), then run this again."); process.exit(1); } }

  // 1) Read every file and sheet (fast, nothing is written yet).
  type Parsed = { fileName: string; parsed: ReturnType<typeof parseWorkbook> };
  const all: Parsed[] = [];
  for (const path of files) {
    if (!existsSync(path)) { console.error(`\nNot found: ${path}`); continue; }
    const fileName = basename(path).replace(/\.(xlsx|xlsm)$/i, "");
    console.log(`\n## ${fileName}`);
    const workbook = new ExcelJS.Workbook();
    try { await workbook.xlsx.readFile(path); } catch { console.error("  Could not be read. Open it in Excel and Save As a new .xlsx first."); continue; }
    let count = 0;
    const sheets: SheetInput[] = workbook.worksheets.slice(0, 40).map((sheet) => {
      const rows: unknown[][] = [];
      sheet.eachRow({ includeEmpty: false }, (row) => {
        if (++count > MAX_ROWS) throw new Error(`More than ${MAX_ROWS} rows in one workbook. Split the file.`);
        rows.push(Array.from(Array.isArray(row.values) ? row.values.slice(1, MAX_COLUMNS + 1) : [], (value) => value ?? null));
      });
      return { name: sheet.name.slice(0, 60), rows };
    });
    const parsed = parseWorkbook(fileName, sheets);
    for (const s of parsed.sheets) console.log(`  [${s.sheet}] ${s.service ?? "skipped"}: ${s.records} saved, ${s.skipped} skipped${s.reason ? ` (${s.reason})` : ""}${s.droppedColumns?.length ? ` · dropped columns: ${s.droppedColumns.join(", ")}` : ""}`);
    all.push({ fileName, parsed });
  }
  const grand = all.reduce((total, item) => total + item.parsed.records.length, 0);
  if (!apply) { console.log(`\nDry run: ${grand} records would be read. Nothing was saved. Add --apply to save them.`); process.exit(0); }

  // 2) Save, in batches, with a live percentage.
  console.log(`\nSaving ${grand.toLocaleString("en-IN")} records…`);
  const started = Date.now();
  let done = 0;
  const progress = (label: string) => {
    const percent = grand ? Math.floor((done / grand) * 100) : 100;
    const seconds = (Date.now() - started) / 1000;
    const left = done > 0 ? Math.round((seconds / done) * (grand - done)) : 0;
    process.stdout.write(`\r  ${String(percent).padStart(3)}%  ${done.toLocaleString("en-IN")} / ${grand.toLocaleString("en-IN")}  ${label.slice(0, 28).padEnd(28)} ~${Math.floor(left / 60)}m ${left % 60}s left   `);
  };
  const totals = { imported: 0, duplicates: 0, contactsAdded: 0 };
  const COLUMNS = ["import_id", "service", "source", "name", "mobile_hash", "mobile_enc", "mobile_last4", "pan_hash", "aadhaar_hash", "phone_hashes", "email_hash", "contact_enc", "record_date", "renewal_on", "birth_month", "birth_day", "vehicle", "payload_enc", "row_hash"];
  for (const { fileName, parsed } of all) {
    if (!parsed.records.length) continue;
    const { rows: [batch] } = await pool.query("insert into record_imports (file_name, sheets) values ($1, $2::jsonb) returning id", [fileName.slice(0, 200), JSON.stringify(parsed.sheets)]);
    let imported = 0;
    const people = new Map<string, Person>();
    for (let offset = 0; offset < parsed.records.length; offset += 150) {
      const chunk = parsed.records.slice(offset, offset + 150);
      const params: unknown[] = [];
      const tuples = chunk.map((record) => {
        const phoneHashes = [...new Set([record.mobile, record.whatsapp, ...record.altMobiles].filter((value): value is string => Boolean(value)))].map((value) => blindIndex("mobile", value));
        const contactEnc = record.whatsapp || record.altMobiles.length || record.email || record.address ? seal({ whatsapp: record.whatsapp, altMobiles: record.altMobiles, email: record.email, address: record.address }) : null;
        const values = [batch.id, record.service, record.source.slice(0, 200), record.name,
          record.mobile ? blindIndex("mobile", record.mobile) : null, record.mobile ? seal(record.mobile) : null, record.mobile ? record.mobile.slice(-4) : null,
          record.pan ? blindIndex("pan", record.pan) : null, record.aadhaar ? blindIndex("aadhaar", record.aadhaar) : null,
          phoneHashes, record.email ? blindIndex("email", record.email) : null, contactEnc, record.recordDate, record.renewalOn, record.birthMonth, record.birthDay, record.vehicle,
          seal({ mobile: record.mobile, pan: record.pan, aadhaar: record.aadhaar, whatsapp: record.whatsapp, altMobiles: record.altMobiles, email: record.email, address: record.address, fields: record.fields }),
          blindIndex("row", record.dedupeKey)];
        const base = params.length;
        params.push(...values);
        return `(${values.map((_, index) => `$${base + index + 1}${index === 9 ? "::text[]" : ""}`).join(",")})`;
      });
      const result = await pool.query(`insert into customer_records (${COLUMNS.join(",")}) values ${tuples.join(",")} on conflict (row_hash) do nothing`, params);
      imported += result.rowCount ?? 0;
      for (const record of chunk) {
        const phone = record.whatsapp ?? record.mobile;
        if (!phone) continue;
        const person = people.get(phone) ?? { name: record.name, services: new Map<string, string | null>(), area: record.address, email: null, birth: null };
        person.email ??= record.email;
        if (record.birthMonth && record.birthDay) person.birth ??= { month: record.birthMonth, day: record.birthDay };
        const service = CONTACT_SERVICE[record.service];
        if (service) { const previous = person.services.get(service); if (!previous || (record.renewalOn && record.renewalOn > previous)) person.services.set(service, record.renewalOn ?? previous ?? null); }
        people.set(phone, person);
      }
      done += chunk.length; progress(fileName);
    }

    // Contacts: add new people, merge services / email / birthday for people already there.
    let contactsAdded = 0;
    const entries = [...people];
    for (let offset = 0; offset < entries.length; offset += 200) {
      const chunk = entries.slice(offset, offset + 200);
      const { rows: existing } = await pool.query("select phone, services, email, birth_month from contacts where phone = any($1::text[])", [chunk.map(([phone]) => phone)]);
      const known = new Map<string, { services: Service[]; email: string | null; birth_month: number | null }>(existing.map((row) => [row.phone as string, { services: (row.services ?? []) as Service[], email: row.email as string | null, birth_month: row.birth_month as number | null }]));
      const fresh: [string, Person][] = [];
      for (const [phone, person] of chunk) {
        const list: Service[] = [...person.services.entries()].map(([service, renewalOn]) => ({ service, renewalOn, note: null }));
        const current = known.get(phone);
        if (!current) { fresh.push([phone, person]); continue; }
        const merged = [...current.services];
        for (const item of list) {
          const index = merged.findIndex((old) => old.service === item.service);
          if (index < 0) merged.push(item);
          else if (item.renewalOn && (!merged[index].renewalOn || item.renewalOn > (merged[index].renewalOn ?? ""))) merged[index] = { ...merged[index], renewalOn: item.renewalOn };
        }
        const servicesChanged = JSON.stringify(merged) !== JSON.stringify(current.services);
        const needsEmail = Boolean(person.email) && !current.email;
        const needsBirth = Boolean(person.birth) && current.birth_month === null;
        if (servicesChanged || needsEmail || needsBirth) {
          await pool.query("update contacts set services = $2::jsonb, email = coalesce(email, $3), birth_day = case when birth_month is null then $5::smallint else birth_day end, birth_month = coalesce(birth_month, $4::smallint), updated_at = now() where phone = $1",
            [phone, JSON.stringify(merged.slice(0, 12)), person.email, person.birth?.month ?? null, person.birth?.day ?? null]);
        }
      }
      if (fresh.length) {
        const params: unknown[] = [];
        const tuples = fresh.map(([phone, person]) => {
          const list: Service[] = [...person.services.entries()].map(([service, renewalOn]) => ({ service, renewalOn, note: null }));
          const base = params.length;
          params.push(person.name.slice(0, 100), phone, JSON.stringify(list), person.area?.slice(0, 80) || null, person.email, person.birth?.month ?? null, person.birth?.day ?? null, `import: ${fileName}`.slice(0, 40));
          return `($${base + 1},$${base + 2},$${base + 3}::jsonb,$${base + 4},$${base + 5},$${base + 6}::smallint,$${base + 7}::smallint,$${base + 8})`;
        });
        const added = await pool.query(`insert into contacts (name, phone, services, area, email, birth_month, birth_day, source) values ${tuples.join(",")} on conflict (phone) do nothing`, params);
        contactsAdded += added.rowCount ?? 0;
      }
    }
    const skipped = parsed.sheets.reduce((total, sheet) => total + sheet.skipped + (sheet.service && !sheet.reason ? 0 : sheet.rows), 0);
    const duplicates = parsed.records.length - imported;
    await pool.query("update record_imports set imported=$2, duplicates=$3, skipped=$4, contacts_added=$5, total_rows=$6 where id=$1", [batch.id, imported, duplicates, skipped, contactsAdded, parsed.sheets.reduce((t, s) => t + s.rows, 0)]);
    totals.imported += imported; totals.duplicates += duplicates; totals.contactsAdded += contactsAdded;
    process.stdout.write(`\r${" ".repeat(110)}\r  ✓ ${fileName}: ${imported} new, ${parsed.records.length - imported} already there, ${contactsAdded} contacts added\n`);
  }
  console.log(`\n100%  Done in ${Math.round((Date.now() - started) / 1000)}s. ${totals.imported} new records, ${totals.duplicates} already there, ${totals.contactsAdded} contacts added.`);
} finally { await pool.end(); }
