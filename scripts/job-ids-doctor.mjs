#!/usr/bin/env node
/**
 * READ ONLY. Diagnose migration ledger/table state and universal Job ID backfill coverage.
 * Does not log any names, phone numbers, credentials, or individual customer records.
 */
import { existsSync, readFileSync } from "node:fs";
import { loadEnvFile } from "node:process";
import pg from "pg";
for (const file of [".env.local", ".env"]) if (existsSync(file)) loadEnvFile(file);
const url = process.env.DATABASE_URL?.trim();
if (!url) { console.error("DATABASE_URL is missing"); process.exit(1); }
const u = new URL(url);
const ssl = process.env.DATABASE_SSL?.trim().toLowerCase();
const useSsl = ssl ? ssl !== "false" : !["localhost", "127.0.0.1", "::1"].includes(u.hostname);
const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 10_000, ssl: useSsl ? { rejectUnauthorized: false } : undefined });
try {
  await client.connect();
  const dbName = decodeURIComponent(u.pathname.slice(1));
  console.log("Database:", dbName + "@" + u.hostname);
  const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8"));
  const latestLocal = journal.entries.at(-1);
  console.log("Latest repository migration:", latestLocal.tag, "(journal time", new Date(latestLocal.when).toISOString() + ")");
  const tables = await client.query("SELECT to_regclass('public.users')::text users, to_regclass('public.service_requests')::text service_requests, to_regclass('public.counter_visits')::text counter_visits, to_regclass('public.customer_records')::text customer_records, to_regclass('public.print_jobs')::text print_jobs, to_regclass('public.counter_comments')::text counter_comments, to_regclass('public.jobs')::text jobs, to_regclass('public.job_events')::text job_events, to_regclass('drizzle.__drizzle_migrations')::text ledger");
  for (const [name, value] of Object.entries(tables.rows[0])) console.log(name + ":", value ? "present" : "MISSING");
  if (tables.rows[0].ledger) {
    const recent = await client.query("SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 5");
    console.log("Latest applied ledger timestamps (milliseconds):", recent.rows.map(r => String(r.created_at)).join(", ") || "(none)");
    const last = recent.rows[0]?.created_at;
    if (last !== undefined && Number(last) >= Number(latestLocal.when)) {
      console.warn("Ledger timestamp is >= current migration 0045. Drizzle may skip the missing tables: investigate ledger drift. Do not delete ledger rows.");
    }
  }
  const t = tables.rows[0];
  if ([t.service_requests, t.print_jobs, t.counter_visits, t.customer_records].every(Boolean)) {
    const q = await client.query("SELECT (SELECT count(*) FROM service_requests WHERE NOT (details->>'source' = 'counter' AND details ? 'counterVisitId'))::int services, (SELECT count(*) FROM print_jobs)::int prints, (SELECT count(*) FROM counter_visits)::int counter, (SELECT count(*) FROM customer_records)::int historical");
    const v=q.rows[0];
    const expected = v.services+v.prints+v.counter+v.historical;
    console.log("Expected job sources:", JSON.stringify(v), "total:", expected);
    if (t.jobs) {
      const s=await client.query("SELECT source_kind, count(*)::int n FROM jobs GROUP BY source_kind ORDER BY source_kind");
      console.log("Actual jobs by source:", JSON.stringify(s.rows));
      console.log("Actual total:",s.rows.reduce((sum,row)=>sum+row.n,0));
      const d=await client.query("SELECT count(*)::int n FROM (SELECT source_kind, source_id FROM jobs GROUP BY source_kind,source_id HAVING count(*) > 1) x");
      console.log("Duplicated source mappings:",d.rows[0].n);
    } else {
      console.log("Backfill has NOT happened: jobs table is missing.");
    }
  }
  const trigger=await client.query("SELECT tgname FROM pg_trigger WHERE tgname IN ('nise_service_job_sync','nise_print_job_sync','nise_counter_job_sync','nise_historical_job_sync') AND NOT tgisinternal ORDER BY tgname");
  console.log("Installed job triggers:",trigger.rows.map(r=>r.tgname).join(", ") || "(none)");
} catch (e) { console.error("Read-only diagnosis failed:",e instanceof Error?e.message:String(e)); process.exitCode=1; }
finally { await client.end().catch(()=>undefined); }
