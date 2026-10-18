#!/usr/bin/env node
/**
 * One-off fix for when `drizzle-kit migrate` silently does nothing (seen on Windows/npm in the
 * field: no "applying migration" lines, no error, just exits) and the tables it should have
 * created (service_requests.official_reference, service_reviews, testimonials, …) never show up.
 *
 * This runs the SQL files for migrations 0015-0018 directly against DATABASE_URL, bypassing
 * drizzle-kit's own bookkeeping entirely. Every statement in those four files is written with
 * IF NOT EXISTS or a duplicate_object exception guard, so running this is safe even if some of it
 * already partially applied — nothing here can double-create a table or column.
 *
 * Usage: node scripts/force-apply-migrations.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { loadEnvFile } from "node:process";
import pg from "pg";

for (const file of [".env.local", ".env"]) if (existsSync(file)) { try { loadEnvFile(file); } catch { /* ignore */ } }
const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) { console.error("DATABASE_URL is missing."); process.exit(1); }
const sslSetting = process.env.DATABASE_SSL?.trim().toLowerCase();
const ssl = (sslSetting ? sslSetting !== "false" : process.env.NODE_ENV === "production") ? { rejectUnauthorized: false } : undefined;
const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 10_000, ssl });

const files = [
  "drizzle/0015_official_reference.sql",
  "drizzle/0016_service_reviews.sql",
  "drizzle/0017_testimonials.sql",
  "drizzle/0018_testimonials_source_id.sql",
];

for (const file of files) {
  console.log(`\n== ${file} ==`);
  const sql = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const statements = sql.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
  for (const statement of statements) {
    try {
      await pool.query(statement);
      console.log("  ok:", statement.split("\n")[0].slice(0, 90));
    } catch (error) {
      console.error("  FAILED:", statement.split("\n")[0].slice(0, 90));
      console.error("   ", error instanceof Error ? error.message : error);
    }
  }
}

const check = await pool.query(
  "select to_regclass('public.service_reviews') as service_reviews, to_regclass('public.testimonials') as testimonials"
);
console.log("\nResult:", check.rows[0]);
await pool.end();
