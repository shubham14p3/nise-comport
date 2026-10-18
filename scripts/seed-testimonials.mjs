#!/usr/bin/env node
/**
 * One-off bulk import of real Google reviews, curated from a saved Google Maps page (the public
 * Places API only ever returns up to 5 reviews — this is how the rest get on the site, see
 * src/components/testimonials-panel.tsx and docs/google-reviews-sync.md).
 *
 * Reads src/data/testimonials-seed.json and upserts each row keyed by (source, source_id), so
 * running this more than once is always safe — it never creates duplicates, and a newer run just
 * refreshes the text/rating/date of rows it already imported. Visibility/featured flags you've
 * since changed in Admin → Testimonials are left alone on a re-run (only inserted as a default on
 * first import).
 *
 * Usage: npm run testimonials:seed
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

const rows = JSON.parse(readFileSync(new URL("../src/data/testimonials-seed.json", import.meta.url), "utf8"));
console.log(`Importing ${rows.length} reviews from src/data/testimonials-seed.json…`);

let inserted = 0, updated = 0, failed = 0;
for (const row of rows) {
  try {
    const result = await pool.query(
      `insert into testimonials (author_name, rating, body, category, service_slug, source, source_id, reviewed_on, featured, visible)
       values ($1, $2, $3, $4, $5, $6, $7, $8, false, $9)
       on conflict (source, source_id) do update
         set author_name = excluded.author_name, rating = excluded.rating, body = excluded.body,
             reviewed_on = excluded.reviewed_on, updated_at = now()
       returning (xmax = 0) as inserted`,
      [row.authorName, row.rating, row.body, row.category, row.serviceSlug, row.source, row.sourceId, row.reviewedOn, row.visible]
    );
    if (result.rows[0]?.inserted) inserted++; else updated++;
  } catch (error) {
    failed++;
    console.error(`  Failed: ${row.authorName} (${row.sourceId}):`, error instanceof Error ? error.message : error);
  }
}

console.log(`\nDone. Inserted ${inserted}, updated ${updated}, failed ${failed}.`);
console.log("Review what came in under Admin → Testimonials — the low-star ones (1-3) were imported hidden by default, so check those before anything goes live.");
await pool.end();
