#!/usr/bin/env node
/**
 * Repair for a database whose migration log says "applied" while some tables are missing.
 * Runs every CREATE / ALTER statement of drizzle/*.sql one by one and ignores "already exists" results,
 * so it only adds what is missing. It never drops or deletes anything.
 *   node scripts/apply-missing-migrations.mjs
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { loadEnvFile } from "node:process";
import pg from "pg";

for (const file of [".env.local", ".env"]) if (existsSync(file)) loadEnvFile(file);
const url = process.env.DATABASE_URL?.trim();
if (!url) { console.error("DATABASE_URL is missing."); process.exit(1); }
const ssl = process.env.DATABASE_SSL?.trim().toLowerCase();
const pool = new pg.Pool({ connectionString: url, max: 1, ssl: ssl && ssl !== "false" ? { rejectUnauthorized: false } : undefined });
// 42P07 table exists, 42710 constraint/object exists, 42701 column exists, 42P16 invalid definition (already set), 42P06 schema exists
const HARMLESS = new Set(["42P07", "42710", "42701", "42P16", "42P06"]);

let created = 0, skipped = 0, failed = 0;
try {
  for (const file of readdirSync("drizzle").filter((name) => name.endsWith(".sql")).sort()) {
    const statements = readFileSync(`drizzle/${file}`, "utf8").split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
    for (const statement of statements) {
      if (!/^(CREATE|ALTER|DO)\b/i.test(statement) || /\bDROP\b/i.test(statement)) { skipped++; continue; }
      try { await pool.query(statement); created++; }
      catch (error) {
        const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
        if (HARMLESS.has(code)) { skipped++; continue; }
        failed++; console.error(`✗ ${file}: ${error instanceof Error ? error.message : error}\n  ${statement.slice(0, 120).replace(/\s+/g, " ")}`);
      }
    }
  }
  const wanted = ["users", "payments", "service_prices", "whatsapp_messages", "legal_pages", "loyalty_settings", "phone_otps", "mail_tickets", "mail_messages", "mail_attachments", "mail_sync"];
  const { rows } = await pool.query("select table_name from information_schema.tables where table_schema = 'public' and table_name = any($1)", [wanted]);
  const have = new Set(rows.map((row) => row.table_name));
  console.log(`Statements run: ${created}, already in place: ${skipped}, problems: ${failed}`);
  for (const name of wanted) console.log(`${have.has(name) ? "✓" : "✗ MISSING"} ${name}`);
} finally { await pool.end(); }
