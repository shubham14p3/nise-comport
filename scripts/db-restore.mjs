#!/usr/bin/env node
/**
 * Loads a backup made by `npm run db:backup` into the database named by DATABASE_URL.
 *   1. Point DATABASE_URL at an EMPTY database (for a local copy: postgres://postgres:postgres@localhost:5432/nise_comport)
 *   2. npm run db:migrate            (creates the tables)
 *   3. npm run db:restore -- backups/nise-comport-2026-10-19_11-30.sql --yes
 * Needs a database role that may switch off foreign-key checks while loading (the local "postgres" user can).
 */
import { existsSync, readFileSync } from "node:fs";
import { loadEnvFile } from "node:process";
import pg from "pg";

for (const file of [".env.local", ".env"]) if (existsSync(file)) loadEnvFile(file);
const url = process.env.DATABASE_URL?.trim();
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
if (!url || !file || !existsSync(file)) { console.error("Usage: npm run db:restore -- backups/<file>.sql --yes   (with DATABASE_URL set)"); process.exit(1); }
const target = new URL(url);
const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(target.hostname);
console.log(`Target database: ${target.hostname}:${target.port || 5432}${target.pathname}`);
if (!local && !args.includes("--i-know-this-is-not-local")) { console.error("✗ This is not a local database. To protect the live site, restoring is refused. (Use --i-know-this-is-not-local only if you really mean it.)"); process.exit(1); }
if (!args.includes("--yes")) { console.error("Add --yes to confirm loading the backup into the database above."); process.exit(1); }

const ssl = process.env.DATABASE_SSL?.trim().toLowerCase();
const pool = new pg.Pool({ connectionString: url, max: 1, ssl: ssl && ssl !== "false" ? { rejectUnauthorized: false } : undefined });
try {
  const used = (await pool.query("select count(*)::int n from users")).rows[0].n;
  if (used > 0) { console.error(`✗ The users table already has ${used} rows. Restore into an empty database (run db:migrate on a new, empty one).`); process.exitCode = 1; }
  else { await pool.query(readFileSync(file, "utf8")); console.log("✓ Backup loaded."); }
} catch (error) { console.error("✗ Restore failed:", error instanceof Error ? error.message : error); process.exitCode = 1; }
finally { await pool.end(); }
