#!/usr/bin/env node
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import pg from "pg";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  try {
    loadEnvFile(file);
  } catch (error) {
    console.error(`Could not load ${file}:`, error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error("DATABASE_URL is missing. Add it to .env.local or the server environment.");
  process.exit(1);
}

let target;
try {
  target = new URL(connectionString);
} catch {
  console.error("DATABASE_URL is not a valid PostgreSQL connection URL.");
  process.exit(1);
}

if (!["postgres:", "postgresql:"].includes(target.protocol)) {
  console.error("DATABASE_URL must start with postgres:// or postgresql://.");
  process.exit(1);
}

const sslSetting = process.env.DATABASE_SSL?.trim().toLowerCase();
const useSsl = sslSetting ? sslSetting !== "false" : process.env.NODE_ENV === "production";
const { Pool } = pg;

const pool = new Pool({
  connectionString,
  max: 1,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 5_000,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

const host = target.hostname;
const port = target.port || "5432";
const database = decodeURIComponent(target.pathname.replace(/^\//, ""));
console.log(`Checking PostgreSQL at ${host}:${port}/${database} (SSL ${useSsl ? "on" : "off"})…`);

try {
  const result = await pool.query(`
    select
      current_database() as database,
      current_user as db_user,
      current_setting('server_version') as server_version,
      (select count(*)::int from information_schema.tables where table_schema = 'public') as public_tables,
      to_regclass('public.users')::text as users_table,
      to_regclass('drizzle.__drizzle_migrations')::text as migrations_table
  `);
  const info = result.rows[0];

  console.log("✓ PostgreSQL connection successful");
  console.log(`  Database: ${info.database}`);
  console.log(`  User: ${info.db_user}`);
  console.log(`  PostgreSQL: ${info.server_version}`);
  console.log(`  Public tables: ${info.public_tables}`);
  console.log(`  NISE users table: ${info.users_table ? "present" : "not migrated yet"}`);
  console.log(`  Drizzle migration table: ${info.migrations_table ? "present" : "not created yet"}`);

  if (!info.users_table || !info.migrations_table) {
    console.log("\nConnection is working. Run `npm run db:migrate` (or `npm run db:setup`) to make the NISE schema ready.");
  }
} catch (error) {
  console.error("✗ PostgreSQL connection failed");
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (code) console.error(`  Code: ${code}`);
  console.error(`  ${error instanceof Error ? error.message : String(error)}`);
  console.error("\nIf the URL is correct but this times out, allow remote PostgreSQL access/whitelist your current IP on the hosting server. Do not change the database password just to fix a network timeout.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
