#!/usr/bin/env node
/**
 * Gives thank-you wallet credit for work that was finished before the credit existed.
 *
 *   npm run loyalty:backfill                          show what would be given (nothing is written)
 *   npm run loyalty:backfill -- --apply               write the credit to customers' wallets
 *   npm run loyalty:backfill -- --csv old.csv         use a list instead of the website's orders
 *   npm run loyalty:backfill -- --csv old.csv --apply
 *
 * CSV columns (header row required): mobile or email, name (optional), service, amount (only needed for printing).
 * Each order or CSV row is rewarded once, so running the script twice never pays twice.
 * The rules are the ones saved in Admin → Loyalty credit (or the built-in ones if none were saved).
 * The same thing can be done from the website with the "Sync up" button.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { DEFAULT_LOYALTY, loyaltyReference, loyaltyReward, sanitizeLoyalty } from "../src/lib/loyalty-core.ts";
import { normalizePhone } from "../src/lib/validation.ts";

for (const file of [".env.local", ".env"]) if (existsSync(file)) { try { loadEnvFile(file); } catch { /* reported below */ } }
const apply = process.argv.includes("--apply");
const csvIndex = process.argv.indexOf("--csv");
const csvPath = csvIndex > -1 ? process.argv[csvIndex + 1] : "";

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) { console.error("DATABASE_URL is missing. Add it to .env.local or the server environment."); process.exit(1); }
const sslSetting = process.env.DATABASE_SSL?.trim().toLowerCase();
const { default: pg } = await import("pg");
const pool = new pg.Pool({ connectionString, max: 2, connectionTimeoutMillis: 10_000, ssl: (sslSetting ? sslSetting !== "false" : process.env.NODE_ENV === "production") ? { rejectUnauthorized: false } : undefined });

type Item = { userId: string; who: string; reference: string; text: string; reward: NonNullable<ReturnType<typeof loyaltyReward>> };
let settings = DEFAULT_LOYALTY;
const items: Item[] = []; const skipped: string[] = [];

function parseCsv(text: string) {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch; }
    else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); if (row.some((c) => c.trim())) rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  row.push(cell); if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

try {
  try { const row = (await pool.query("select settings from loyalty_settings where id = 'main'")).rows[0]; if (row) settings = sanitizeLoyalty(row.settings); } catch { console.log("(no saved rules yet, using the built-in ones)"); }
  if (!settings.enabled) console.log("Loyalty credit is switched off in the admin, so nothing would be given.");
  if (csvPath) {
    const rows = parseCsv(readFileSync(csvPath, "utf8"));
    const head = rows.shift()?.map((h) => h.trim().toLowerCase()) ?? [];
    const col = (...names: string[]) => head.findIndex((h) => names.includes(h));
    const iMobile = col("mobile", "phone", "number"); const iEmail = col("email"); const iName = col("name"); const iService = col("service"); const iAmount = col("amount", "total");
    if (iService < 0 || (iMobile < 0 && iEmail < 0)) throw new Error("The CSV needs a header row with a 'service' column and a 'mobile' or 'email' column.");
    const users = (await pool.query("select id, name, email, phone from users where deleted_at is null")).rows as { id: string; name: string; email: string; phone: string | null }[];
    for (const [n, cells] of rows.entries()) {
      const mobile = iMobile > -1 ? normalizePhone(cells[iMobile] ?? "") : null;
      const email = iEmail > -1 ? (cells[iEmail] ?? "").trim().toLowerCase() : "";
      const service = (cells[iService] ?? "").trim();
      const matches = users.filter((u) => (email && u.email === email) || (mobile && u.phone === mobile));
      const label = `row ${n + 2} (${cells[iName]?.trim() || email || mobile || "?"}, ${service})`;
      if (matches.length !== 1) { skipped.push(`${label}: ${matches.length ? "more than one account matches" : "no account found"}`); continue; }
      const reward = loyaltyReward(settings, service, Number((cells[iAmount] ?? "").replace(/[₹,\s]/g, "")) || 0);
      if (!reward) { skipped.push(`${label}: no credit for this service`); continue; }
      const key = createHash("sha1").update([matches[0].id, service.toLowerCase(), cells[iAmount] ?? "", n].join("|")).digest("hex").slice(0, 16);
      items.push({ userId: matches[0].id, who: matches[0].name, reference: loyaltyReference("csv", key), text: service, reward });
    }
  } else {
    const services = (await pool.query("select r.user_id, u.name, r.reference, r.service_slug, r.service_name, r.service_fee from service_requests r join users u on u.id = r.user_id where r.status = 'completed' and u.deleted_at is null")).rows;
    for (const r of services) { const reward = loyaltyReward(settings, `${r.service_slug} ${r.service_name}`, Number(r.service_fee)); if (reward) items.push({ userId: r.user_id, who: r.name, reference: loyaltyReference("service", r.reference), text: r.service_name, reward }); }
    const prints = (await pool.query("select j.user_id, u.name, j.reference, j.file_name, j.total from print_jobs j join users u on u.id = j.user_id where j.status = 'completed' and u.deleted_at is null")).rows;
    for (const j of prints) { const reward = loyaltyReward(settings, `print ${j.file_name}`, Number(j.total)); if (reward) items.push({ userId: j.user_id, who: j.name, reference: loyaltyReference("print", j.reference), text: `Print: ${j.file_name}`, reward }); }
  }

  const done = new Set((await pool.query("select reference from wallet_entries where reference like 'loyalty:%'")).rows.map((r) => r.reference as string));
  const fresh = settings.enabled ? items.filter((item) => !done.has(item.reference)) : [];
  const total = fresh.reduce((sum, item) => sum + item.reward.amount, 0);
  console.log("Rules: " + settings.rules.filter((rule) => rule.enabled).map((rule) => `${rule.label} ${rule.type === "flat" ? `₹${rule.value}` : `${rule.value}%`}`).join(", ") + ".");
  for (const item of fresh) console.log(`  ₹${item.reward.amount.toFixed(2).padStart(7)}  ${item.who.padEnd(24)} ${item.text}`);
  if (items.length - fresh.length) console.log(`${items.length - fresh.length} already rewarded earlier, left alone.`);
  for (const line of skipped) console.log(`  skipped ${line}`);
  console.log(`\n${fresh.length} credits, ₹${total.toFixed(2)} in total, ${new Set(fresh.map((item) => item.userId)).size} customers.`);
  if (!apply) console.log("Nothing was written. Add --apply to give these credits.");
  else {
    const client = await pool.connect();
    try {
      await client.query("begin");
      for (const item of fresh) await client.query("insert into wallet_entries (user_id, amount, kind, description, reference) values ($1, $2, 'credit', $3, $4)", [item.userId, item.reward.amount.toFixed(2), `Thank-you credit: ${item.reward.label} (${item.text})`.slice(0, 160), item.reference]);
      await client.query("commit");
      console.log("Done. The credit is now in the customers' wallets.");
    } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
  }
} catch (error) {
  console.error("Loyalty backfill failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally { await pool.end(); }
