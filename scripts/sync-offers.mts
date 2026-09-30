#!/usr/bin/env node
/**
 * Creates / refreshes festival and Team India promo codes in the database, the same way the daily
 * job (/api/cron/offers) does. Run after `npm run db:migrate`, or any time:
 *   npm run offers:sync            write to the database in DATABASE_URL
 *   npm run offers:sync -- --dry   only print what would be created (no database needed)
 */
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { syncEventCoupons } from "../src/lib/offer-sync.ts";
import { fetchHolidayFeed, matchFestivals } from "../src/lib/festival-calendar.ts";
import { eventPromos } from "../src/lib/promo-calendar.ts";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) { try { loadEnvFile(file); } catch { /* the script reports a missing DATABASE_URL below */ } }
}

if (process.argv.includes("--dry")) {
  const feed = await fetchHolidayFeed();
  const matched = matchFestivals(feed.events);
  const promos = eventPromos(matched);
  console.log(`Google holiday feed: ${feed.ok ? `${feed.events.length} events, ${matched.length} festival dates matched` : "not reachable (using checked dates)"}`);
  for (const promo of promos) console.log(`${promo.code.padEnd(13)} ${promo.startsOn} → ${promo.endsOn}  ${promo.emoji} ${promo.names.en}${promo.tentative ? " (dates TBC)" : ""}${promo.source === "google" ? " [google]" : ""}`);
  console.log(`\n${promos.length} codes.`);
  process.exit(0);
}

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) { console.error("DATABASE_URL is missing. Add it to .env.local or the server environment."); process.exit(1); }
const sslSetting = process.env.DATABASE_SSL?.trim().toLowerCase();
const useSsl = sslSetting ? sslSetting !== "false" : process.env.NODE_ENV === "production";
const { default: pg } = await import("pg");
const pool = new pg.Pool({ connectionString, max: 2, connectionTimeoutMillis: 10_000, ssl: useSsl ? { rejectUnauthorized: false } : undefined });
try {
  const report = await syncEventCoupons((text, params) => pool.query(text, params));
  console.log(`Google holiday feed: ${report.feed.ok ? `${report.feed.events} events, ${report.feed.matched} festival dates matched` : "not reachable (checked dates used)"}`);
  console.log(`${report.promos} codes: ${report.created} created, ${report.updated} updated, ${report.unchanged} unchanged.`);
  if (report.conflicts.length) console.log(`Skipped (code already used by another coupon): ${report.conflicts.join(", ")}`);
} catch (error) {
  console.error("Offers sync failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
