#!/usr/bin/env node
/**
 * Explicit, transactional one-time recovery for 0045 when Drizzle's ledger
 * reports migrations but jobs tables/backfill/triggers are absent.
 * Requires a verified fresh off-repository backup and exact target confirmation.
 * Does NOT edit the Drizzle ledger or run migration 0044.
 */
import { existsSync, openSync, readSync, closeSync, statSync, readFileSync } from "node:fs";
import { loadEnvFile } from "node:process";
import pg from "pg";

for (const file of [".env.local", ".env"]) if (existsSync(file)) loadEnvFile(file);
const args = process.argv.slice(2);
const val = (name) => { const idx=args.indexOf(name); return idx>=0 ? args[idx+1] : undefined; };
const url=process.env.DATABASE_URL?.trim();
if (!url) { console.error("DATABASE_URL missing"); process.exit(1); }
const u=new URL(url);
const target=decodeURIComponent(u.pathname.slice(1))+"@"+u.hostname;
console.log("Target:",target,"port:",u.port||"5432");
if (!args.includes("--apply") || val("--confirm") !== target) {
  console.error("NO CHANGES. To apply after restoring and testing on a clone, run:");
  console.error('npm run db:jobs:repair -- --apply --backup-file "backups/<fresh-name>.sql" --confirm "'+target+'"');
  process.exit(1);
}
const backupPath=val("--backup-file");
if (!backupPath || !existsSync(backupPath) || statSync(backupPath).size < 1024) {
  console.error("A new, nonempty SQL backup file is mandatory. Do not migrate.");
  process.exit(1);
}
const stat=statSync(backupPath);
if (Date.now()-stat.mtimeMs>24*3600_000 || stat.mtimeMs>Date.now()+60_000) {
  console.error("Backup file must be locally created within the last 24 hours. Do not migrate.");
  process.exit(1);
}
const fd=openSync(backupPath,"r");
const buf=Buffer.alloc(512);
const read=readSync(fd,buf,0,buf.length,0);
closeSync(fd);
const header=buf.subarray(0,read).toString("utf8");
if (!header.startsWith("-- NISE COMPORT data backup") || !header.includes("from "+u.hostname)) {
  console.error("Backup header does not match this host. Do not migrate.");
  process.exit(1);
}
const ssl=process.env.DATABASE_SSL?.trim().toLowerCase();
const useSsl=ssl?ssl!=="false":!["localhost","127.0.0.1","::1"].includes(u.hostname);
const client=new pg.Client({ connectionString:url,connectionTimeoutMillis:10_000,ssl:useSsl?{rejectUnauthorized:false}:undefined });
let inTx=false;
try {
  await client.connect();
  await client.query("BEGIN");
  inTx=true;
  await client.query("SET LOCAL lock_timeout = '10s'");
  await client.query("SET LOCAL statement_timeout = '180s'");
  // Block concurrent writes briefly while capturing a consistent source count,
  // executing the backfill and installing new-record triggers.
  await client.query("LOCK TABLE service_requests, print_jobs, counter_visits, customer_records IN SHARE ROW EXCLUSIVE MODE");
  const expectedRows=await client.query("SELECT (SELECT count(*) FROM service_requests WHERE NOT (details->>'source' = 'counter' AND details ? 'counterVisitId'))::int services, (SELECT count(*) FROM print_jobs)::int prints, (SELECT count(*) FROM counter_visits)::int counter, (SELECT count(*) FROM customer_records)::int historical");
  const expected=Object.values(expectedRows.rows[0]).reduce((a,b)=>a+b,0);
  console.log("Expected distinct job sources:",expected);
  const sql=readFileSync("drizzle/0045_universal_jobs.sql","utf8");
  if (!sql.includes("CREATE OR REPLACE FUNCTION") || !sql.includes("nise_sync_universal_job") || !sql.includes("INSERT INTO \"jobs\"")) {
    throw new Error("Required 0045 migration content is missing; no changes will be committed.");
  }
  const steps=sql.split("--> statement-breakpoint").map(s=>s.trim()).filter(Boolean);
  for (const step of steps) await client.query(step);
  const counts=await client.query("SELECT count(*)::int n FROM jobs");
  if (counts.rows[0].n!==expected) throw new Error("Backfill mismatch: expected "+expected+" but got "+counts.rows[0].n+"; rolled back.");
  const triggers=await client.query("SELECT count(*)::int n FROM pg_trigger WHERE tgname IN ('nise_service_job_sync','nise_print_job_sync','nise_counter_job_sync','nise_historical_job_sync') AND NOT tgisinternal");
  if (triggers.rows[0].n!==4) throw new Error("Expected four job triggers; rolled back.");
  await client.query("COMMIT");
  inTx=false;
  console.log("Universal jobs migration RECOVERED:",counts.rows[0].n,"jobs, 4 triggers.");
  console.log("Drizzle migration ledger was deliberately left unchanged. Run db:jobs:doctor and db:schema:check next.");
} catch(e) {
  if(inTx) await client.query("ROLLBACK").catch(()=>undefined);
  console.error("Recovery FAILED (transaction rolled back):",e instanceof Error?e.message:String(e));
  process.exitCode=1;
} finally { await client.end().catch(()=>undefined); }
