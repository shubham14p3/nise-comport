#!/usr/bin/env node
/**
 * "Did my Excel import and WhatsApp setup work?" — prints counts only, never names or numbers.
 * Usage: npm run data:check
 */
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import pg from "pg";

for (const file of [".env.local", ".env"]) if (existsSync(file)) { try { loadEnvFile(file); } catch { /* ignore */ } }
const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) { console.error("DATABASE_URL is missing."); process.exit(1); }
const sslSetting = process.env.DATABASE_SSL?.trim().toLowerCase();
const ssl = (sslSetting ? sslSetting !== "false" : process.env.NODE_ENV === "production") ? { rejectUnauthorized: false } : undefined;
const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 10_000, ssl });

const has = async (table) => (await pool.query("select to_regclass($1) as t", [`public.${table}`])).rows[0].t !== null;
const one = async (sql) => (await pool.query(sql)).rows;
const line = (label, value) => console.log(`  ${label.padEnd(34)} ${value}`);

try {
  const migrations = await one("select count(*)::int as n from drizzle.__drizzle_migrations").catch(() => [{ n: "?" }]);
  console.log(`\nMigrations applied: ${migrations[0].n} (this code has 13: 0000–0012)`);

  console.log("\nExcel registers (Admin → Records)");
  if (!(await has("record_imports"))) console.log("  Tables missing: run npm run db:migrate");
  else {
    const imports = await one("select count(*)::int as files, coalesce(sum(imported),0)::int as imported, coalesce(sum(duplicates),0)::int as dup, coalesce(sum(skipped),0)::int as skipped, coalesce(sum(contacts_added),0)::int as contacts, max(created_at) as last from record_imports");
    const people = await one("select count(*)::int as rows, count(distinct coalesce(mobile_hash, pan_hash, id::text))::int as people from customer_records");
    const byService = await one("select service, count(*)::int as n from customer_records group by service order by n desc limit 15");
    line("Files imported", imports[0].files);
    line("Rows saved (encrypted)", `${people[0].rows} (≈ ${people[0].people} people)`);
    line("Duplicates skipped / rows skipped", `${imports[0].dup} / ${imports[0].skipped}`);
    line("Added to WhatsApp contacts", imports[0].contacts);
    line("Last import", imports[0].last ? new Date(imports[0].last).toLocaleString("en-IN") : "never");
    for (const row of byService) line(`  · ${row.service}`, row.n);
    if (!imports[0].files) console.log("  → Nothing imported yet. Upload the .xlsx in Admin → Records (needs the Records permission).");
  }

  console.log("\nContacts for WhatsApp");
  if (await has("contacts")) {
    const contacts = await one("select count(*)::int as total, count(*) filter (where consent = 'opted_in')::int as yes, count(*) filter (where consent = 'opted_out')::int as stop from contacts");
    line("Contacts / said YES / said STOP", `${contacts[0].total} / ${contacts[0].yes} / ${contacts[0].stop}`);
  }

  console.log("\nWhatsApp");
  const cloud = Boolean(process.env.WHATSAPP_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim());
  line("Automatic sending (Cloud API)", cloud ? "configured" : "off → campaigns use one-tap sending in /admin");
  line("Request copy templates", process.env.WHATSAPP_CONFIRM_TEMPLATE || process.env.WHATSAPP_STAFF_TEMPLATE ? "set" : "not set → customers get a one-tap ‘Send on WhatsApp’ button");
  if (await has("campaign_messages")) {
    const sent = await one("select status, count(*)::int as n from campaign_messages group by status order by status");
    line("Campaign messages by status", sent.length ? sent.map((row) => `${row.status} ${row.n}`).join(", ") : "none yet");
    const failed = await one("select error, count(*)::int as n from campaign_messages where status = 'failed' and error is not null group by error order by n desc limit 3");
    for (const row of failed) line("  · failed because", `${row.error.slice(0, 80)} (${row.n})`);
  }
  console.log("");
} catch (error) {
  console.error("Check failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally { await pool.end(); }
