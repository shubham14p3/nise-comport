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

  const totals = { records: 0, imported: 0, duplicates: 0, contactsAdded: 0 };
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
        rows.push((Array.isArray(row.values) ? row.values.slice(1, MAX_COLUMNS + 1) : []).map((value) => value ?? null));
      });
      return { name: sheet.name.slice(0, 60), rows };
    });
    const parsed = parseWorkbook(fileName, sheets);
    for (const s of parsed.sheets) console.log(`  [${s.sheet}] ${s.service ?? "skipped"}: ${s.records} saved, ${s.skipped} skipped${s.reason ? ` (${s.reason})` : ""}${s.droppedColumns?.length ? ` · dropped columns: ${s.droppedColumns.join(", ")}` : ""}`);
    totals.records += parsed.records.length;
    if (!apply) continue;

    const { rows: [batch] } = await pool.query("insert into record_imports (file_name, sheets) values ($1, $2::jsonb) returning id", [fileName.slice(0, 200), JSON.stringify(parsed.sheets)]);
    let imported = 0;
    const people = new Map<string, Person>();
    for (const record of parsed.records) {
      const phoneHashes = [...new Set([record.mobile, record.whatsapp, ...record.altMobiles].filter((value): value is string => Boolean(value)))].map((value) => blindIndex("mobile", value));
      const contactEnc = record.whatsapp || record.altMobiles.length || record.email || record.address ? seal({ whatsapp: record.whatsapp, altMobiles: record.altMobiles, email: record.email, address: record.address }) : null;
      const result = await pool.query(
        `insert into customer_records (import_id, service, source, name, mobile_hash, mobile_enc, mobile_last4, pan_hash, aadhaar_hash, phone_hashes, email_hash, contact_enc, record_date, renewal_on, birth_month, birth_day, vehicle, payload_enc, row_hash)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::text[],$11,$12,$13,$14,$15,$16,$17,$18,$19) on conflict (row_hash) do nothing`,
        [batch.id, record.service, record.source.slice(0, 200), record.name,
          record.mobile ? blindIndex("mobile", record.mobile) : null, record.mobile ? seal(record.mobile) : null, record.mobile ? record.mobile.slice(-4) : null,
          record.pan ? blindIndex("pan", record.pan) : null, record.aadhaar ? blindIndex("aadhaar", record.aadhaar) : null,
          phoneHashes, record.email ? blindIndex("email", record.email) : null, contactEnc, record.recordDate, record.renewalOn, record.birthMonth, record.birthDay, record.vehicle,
          seal({ mobile: record.mobile, pan: record.pan, aadhaar: record.aadhaar, whatsapp: record.whatsapp, altMobiles: record.altMobiles, email: record.email, address: record.address, fields: record.fields }),
          blindIndex("row", record.dedupeKey)],
      );
      imported += result.rowCount ?? 0;
      const phone = record.whatsapp ?? record.mobile;
      if (!phone) continue;
      const person = people.get(phone) ?? { name: record.name, services: new Map<string, string | null>(), area: record.address, email: null, birth: null };
      person.email ??= record.email;
      if (record.birthMonth && record.birthDay) person.birth ??= { month: record.birthMonth, day: record.birthDay };
      const service = CONTACT_SERVICE[record.service];
      if (service) { const previous = person.services.get(service); if (!previous || (record.renewalOn && record.renewalOn > previous)) person.services.set(service, record.renewalOn ?? previous ?? null); }
      people.set(phone, person);
    }

    let contactsAdded = 0;
    for (const [phone, person] of people) {
      const fresh: Service[] = [...person.services.entries()].map(([service, renewalOn]) => ({ service, renewalOn, note: null }));
      const { rows: [existing] } = await pool.query("select services from contacts where phone = $1", [phone]);
      if (!existing) {
        const added = await pool.query("insert into contacts (name, phone, services, area, email, birth_month, birth_day, source) values ($1,$2,$3::jsonb,$4,$5,$6,$7,$8) on conflict (phone) do nothing",
          [person.name.slice(0, 100), phone, JSON.stringify(fresh), person.area?.slice(0, 80) || null, person.email, person.birth?.month ?? null, person.birth?.day ?? null, `import: ${fileName}`.slice(0, 40)]);
        contactsAdded += added.rowCount ?? 0;
        continue;
      }
      const current = (existing.services ?? []) as Service[];
      const merged = [...current];
      for (const item of fresh) {
        const index = merged.findIndex((old) => old.service === item.service);
        if (index < 0) merged.push(item);
        else if (item.renewalOn && (!merged[index].renewalOn || item.renewalOn > (merged[index].renewalOn ?? ""))) merged[index] = { ...merged[index], renewalOn: item.renewalOn };
      }
      if (JSON.stringify(merged) !== JSON.stringify(current)) await pool.query("update contacts set services = $2::jsonb, updated_at = now() where phone = $1", [phone, JSON.stringify(merged.slice(0, 12))]);
      if (person.email) await pool.query("update contacts set email = $2 where phone = $1 and email is null", [phone, person.email]);
      if (person.birth) await pool.query("update contacts set birth_month = $2, birth_day = $3 where phone = $1 and birth_month is null", [phone, person.birth.month, person.birth.day]);
    }
    const skipped = parsed.sheets.reduce((total, sheet) => total + sheet.skipped + (sheet.service && !sheet.reason ? 0 : sheet.rows), 0);
    const duplicates = parsed.records.length - imported;
    await pool.query("update record_imports set imported=$2, duplicates=$3, skipped=$4, contacts_added=$5, total_rows=$6 where id=$1", [batch.id, imported, duplicates, skipped, contactsAdded, parsed.sheets.reduce((t, s) => t + s.rows, 0)]);
    console.log(`  → ${imported} new records saved, ${duplicates} already there, ${contactsAdded} contacts added.`);
    totals.imported += imported; totals.duplicates += duplicates; totals.contactsAdded += contactsAdded;
  }
  console.log(apply
    ? `\nDone. ${totals.imported} new records, ${totals.duplicates} already there, ${totals.contactsAdded} contacts added.`
    : `\nDry run: ${totals.records} records would be read. Nothing was saved. Add --apply to save them.`);
} finally { await pool.end(); }
