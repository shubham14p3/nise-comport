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

// Try every key in .env: records imported before RECORDS_ENCRYPTION_KEY existed were sealed with PAN_ENCRYPTION_KEY.
const keys = [...new Set([process.env.RECORDS_ENCRYPTION_KEY, process.env.PAN_ENCRYPTION_KEY].map((key) => key?.trim()).filter((key): key is string => Boolean(key)))];
const worked = new Map<number, number>();
function openAny(sealed: string): Sealed {
  for (let index = 0; index < keys.length; index++) {
    process.env.RECORDS_ENCRYPTION_KEY = keys[index];
    try { const value = open<Sealed>(sealed); worked.set(index, (worked.get(index) ?? 0) + 1); return value; } catch { /* try the next key */ }
  }
  throw new Error("Unreadable record.");
}

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
      try { sealed = openAny(row.payload_enc); } catch { stats.unreadable++; continue; }
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
  console.log(`Records read. Updating ${useful.length.toLocaleString("en-IN")} contacts…`);
  const started = Date.now();
  for (let offset = 0; offset < useful.length; offset += 300) {
    const chunk = useful.slice(offset, offset + 300);
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
        stats.contactsUpdated++;
      }
    }
    if (fresh.length) {
      const params: unknown[] = [];
      const tuples = fresh.map(([phone, person]) => {
        const list: Service[] = [...person.services.entries()].map(([service, renewalOn]) => ({ service, renewalOn, note: null }));
        const base = params.length;
        params.push(person.name.slice(0, 100), phone, JSON.stringify(list), person.email, person.birth?.month ?? null, person.birth?.day ?? null, "import: records scan");
        return `($${base + 1},$${base + 2},$${base + 3}::jsonb,$${base + 4},$${base + 5}::smallint,$${base + 6}::smallint,$${base + 7})`;
      });
      const added = await pool.query(`insert into contacts (name, phone, services, email, birth_month, birth_day, source) values ${tuples.join(",")} on conflict (phone) do nothing`, params);
      stats.contactsAdded += added.rowCount ?? 0;
    }
    const done = Math.min(offset + 300, useful.length);
    const left = Math.round(((Date.now() - started) / 1000 / done) * (useful.length - done));
    process.stdout.write(`\r  ${String(Math.floor((done / useful.length) * 100)).padStart(3)}%  ${done.toLocaleString("en-IN")} / ${useful.length.toLocaleString("en-IN")} contacts  ~${Math.floor(left / 60)}m ${left % 60}s left   `);
  }
  process.stdout.write("\n");
  for (const [index, total] of worked) console.log(`${total} records opened with ${index === 0 && process.env.PAN_ENCRYPTION_KEY?.trim() !== keys[0] ? "RECORDS_ENCRYPTION_KEY" : keys[index] === process.env.PAN_ENCRYPTION_KEY?.trim() ? "PAN_ENCRYPTION_KEY" : "RECORDS_ENCRYPTION_KEY"}.`);
  const { rows: [count] } = await pool.query("select count(*)::int as n from contacts where birth_month is not null");
  console.log(`Done. ${stats.scanned} records read${stats.unreadable ? ` (${stats.unreadable} could not be decrypted: wrong RECORDS_ENCRYPTION_KEY?)` : ""}.`);
  console.log(`Birthdays found in records: ${stats.birthdays}. Bike/car marked: ${stats.vehicles}.`);
  console.log(`Contacts added: ${stats.contactsAdded}, updated: ${stats.contactsUpdated}. Contacts with a birthday now: ${count.n}.`);
  const { rows: [summary] } = await pool.query(`
    select
      (select count(*)::int from contacts) as contacts,
      (select count(*)::int from contacts where birth_month is not null) as birthdays,
      (select count(*)::int from contacts where birth_month = extract(month from (now() at time zone 'Asia/Kolkata'))::int) as birthdays_this_month,
      (select count(*)::int from contacts where email is not null) as emails,
      (select count(*)::int from contacts where services @> '[{"service":"insurance"}]'::jsonb) as insurance_people,
      (select count(distinct c.id)::int from contacts c, jsonb_array_elements(c.services) s
         where s->>'service' = 'insurance' and s->>'renewalOn' between to_char(now() at time zone 'Asia/Kolkata','YYYY-MM-DD') and to_char((now() at time zone 'Asia/Kolkata') + interval '60 days','YYYY-MM-DD')) as renewals_60,
      (select count(distinct c.id)::int from contacts c, jsonb_array_elements(c.services) s
         where s->>'service' = 'insurance' and s->>'renewalOn' < to_char(now() at time zone 'Asia/Kolkata','YYYY-MM-DD')) as renewals_past,
      (select count(*)::int from customer_records where service = 'insurance' and vehicle = 'bike') as bikes,
      (select count(*)::int from customer_records where service = 'insurance' and vehicle = 'car') as cars`);
  console.log(`\nWhat the admin will show now:`);
  console.log(`  Contacts: ${summary.contacts} (${summary.emails} with an email)`);
  console.log(`  Birthdays: ${summary.birthdays} people have one, ${summary.birthdays_this_month} this month`);
  console.log(`  Insurance: ${summary.insurance_people} people, ${summary.renewals_60} renewals due in the next 60 days, ${summary.renewals_past} already past`);
  console.log(`  Insurance vehicles marked: ${summary.bikes} bike, ${summary.cars} car`);
  if (stats.scanned && !stats.birthdays && !count.n) console.log("No date-of-birth column was found in the saved rows. Birthdays only appear when the Excel sheet had a column like DOB / Date of Birth / Birthday.");
} finally { await pool.end(); }
