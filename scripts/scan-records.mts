#!/usr/bin/env node
/**
 * Reads every saved customer record once and fills in birthdays, bike/car and WhatsApp contacts,
 * so the Birthdays and Renewals tabs show your existing data. Same work as the "Refresh the data"
 * button, but without the twice-a-day limit. Safe to run again: nothing is overwritten or duplicated.
 *
 *   npm run records:scan
 *
 * Needs DATABASE_URL and the same RECORDS_ENCRYPTION_KEY that was used when the Excel files were imported.
 */
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { birthFromFields, vehicleFrom } from "../src/lib/record-import.ts";
import { open } from "../src/lib/vault.ts";

for (const file of [".env.local", ".env"]) if (existsSync(file)) { try { loadEnvFile(file); } catch { /* reported below */ } }
const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) { console.error("DATABASE_URL is missing. Add it to .env.local."); process.exit(1); }
if (!process.env.RECORDS_ENCRYPTION_KEY?.trim() && !process.env.PAN_ENCRYPTION_KEY?.trim()) { console.error("RECORDS_ENCRYPTION_KEY is missing. Use the same key you had when you imported the Excel files."); process.exit(1); }
const sslSetting = process.env.DATABASE_SSL?.trim().toLowerCase();
const { default: pg } = await import("pg");
const pool = new pg.Pool({ connectionString, max: 2, connectionTimeoutMillis: 10_000, ssl: (sslSetting ? sslSetting !== "false" : process.env.NODE_ENV === "production") ? { rejectUnauthorized: false } : undefined });

const CONTACT_SERVICE: Record<string, string> = {
  pan: "pan", insurance: "insurance", passport: "passport", itr: "itr", "driving-licence": "driving-licence", "aadhaar-update": "aadhaar",
  ayushman: "ayushman", "voter-id": "voter-id", "bank-account": "banking", "caste-certificate": "income-caste", "income-certificate": "income-caste",
  "ews-certificate": "income-caste", "residence-certificate": "residence",
};
type Sealed = { mobile: string | null; whatsapp?: string | null; email?: string | null; fields?: Record<string, string> };
type Service = { service: string; renewalOn: string | null; note: string | null };
type Person = { name: string; services: Map<string, string | null>; email: string | null; birth: { month: number; day: number } | null };

const stats = { scanned: 0, unreadable: 0, birthdays: 0, vehicles: 0, contactsAdded: 0, contactsUpdated: 0 };
const people = new Map<string, Person>();
let cursor = "00000000-0000-0000-0000-000000000000";
try {
  for (;;) {
    const { rows } = await pool.query("select id, service, source, name, renewal_on::text as renewal_on, birth_month, birth_day, vehicle, payload_enc from customer_records where id > $1 order by id limit 500", [cursor]);
    if (!rows.length) break;
    cursor = rows[rows.length - 1].id;
    for (const row of rows) {
      stats.scanned++;
      let sealed: Sealed;
      try { sealed = open<Sealed>(row.payload_enc); } catch { stats.unreadable++; continue; }
      const fields = sealed.fields ?? {};
      const birth = birthFromFields(fields);
      const vehicle = row.service === "insurance" ? vehicleFrom(fields, row.source) : null;
      let month: number | null = row.birth_month; let day: number | null = row.birth_day;
      if (birth && (month !== birth.month || day !== birth.day)) {
        month = birth.month; day = birth.day; stats.birthdays++;
        await pool.query("update customer_records set birth_month = $2, birth_day = $3 where id = $1", [row.id, month, day]);
      }
      if (vehicle && row.vehicle !== vehicle) { stats.vehicles++; await pool.query("update customer_records set vehicle = $2 where id = $1", [row.id, vehicle]); }
      const phone = sealed.whatsapp ?? sealed.mobile;
      if (!phone) continue;
      const person = people.get(phone) ?? { name: row.name as string, services: new Map<string, string | null>(), email: null, birth: null };
      person.email ??= sealed.email ?? null;
      if (month && day) person.birth ??= { month, day };
      const service = CONTACT_SERVICE[row.service];
      if (service) { const previous = person.services.get(service); if (!previous || (row.renewal_on && row.renewal_on > previous)) person.services.set(service, row.renewal_on ?? previous ?? null); }
      people.set(phone, person);
    }
    process.stdout.write(`\r${stats.scanned} rows read…`);
  }
  process.stdout.write("\n");

  const useful = [...people].filter(([, person]) => person.birth || person.email || person.services.size);
  for (let offset = 0; offset < useful.length; offset += 300) {
    const chunk = useful.slice(offset, offset + 300);
    const existing = await pool.query("select phone, services from contacts where phone = any($1)", [chunk.map(([phone]) => phone)]);
    const known = new Map<string, Service[]>(existing.rows.map((row): [string, Service[]] => [row.phone, (row.services ?? []) as Service[]]));
    for (const [phone, person] of chunk) {
      const fresh: Service[] = [...person.services.entries()].map(([service, renewalOn]) => ({ service, renewalOn, note: null }));
      const current = known.get(phone);
      if (!current) {
        const added = await pool.query(
          "insert into contacts (name, phone, services, email, birth_month, birth_day, source) values ($1,$2,$3::jsonb,$4,$5,$6,$7) on conflict (phone) do nothing",
          [person.name.slice(0, 100), phone, JSON.stringify(fresh), person.email, person.birth?.month ?? null, person.birth?.day ?? null, "import: records scan"],
        );
        stats.contactsAdded += added.rowCount ?? 0;
        continue;
      }
      const merged = [...current];
      for (const item of fresh) {
        const index = merged.findIndex((old) => old.service === item.service);
        if (index < 0) merged.push(item);
        else if (item.renewalOn && (!merged[index].renewalOn || item.renewalOn > (merged[index].renewalOn ?? ""))) merged[index] = { ...merged[index], renewalOn: item.renewalOn };
      }
      let changed = JSON.stringify(merged) !== JSON.stringify(current);
      if (changed) await pool.query("update contacts set services = $2::jsonb, updated_at = now() where phone = $1", [phone, JSON.stringify(merged.slice(0, 12))]);
      if (person.email) { const r = await pool.query("update contacts set email = $2 where phone = $1 and email is null", [phone, person.email]); changed ||= (r.rowCount ?? 0) > 0; }
      if (person.birth) { const r = await pool.query("update contacts set birth_month = $2, birth_day = $3 where phone = $1 and birth_month is null", [phone, person.birth.month, person.birth.day]); changed ||= (r.rowCount ?? 0) > 0; }
      if (changed) stats.contactsUpdated++;
    }
  }
  const { rows: [count] } = await pool.query("select count(*)::int as n from contacts where birth_month is not null");
  console.log(`Done. ${stats.scanned} records read${stats.unreadable ? ` (${stats.unreadable} could not be decrypted: wrong RECORDS_ENCRYPTION_KEY?)` : ""}.`);
  console.log(`Birthdays found in records: ${stats.birthdays}. Bike/car marked: ${stats.vehicles}.`);
  console.log(`Contacts added: ${stats.contactsAdded}, updated: ${stats.contactsUpdated}. Contacts with a birthday now: ${count.n}.`);
  if (stats.scanned && !stats.birthdays && !count.n) console.log("No date-of-birth column was found in the saved rows. Birthdays only appear when the Excel sheet had a column like DOB / Date of Birth / Birthday.");
} finally { await pool.end(); }
