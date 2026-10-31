#!/usr/bin/env node
/**
 * Create an actual fresh SQL data backup before deploying universal-job migrations.
 * Must run on the operator's computer with an explicitly configured DATABASE_URL.
 * The backup is sensitive and must be copied OFF GitHub to encrypted storage.
 * No backup is created by committing this script alone.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const now = new Date();
const two = (n) => String(n).padStart(2, "0");
// The existing backup script timestamps only to the minute. Abort before it can
// truncate a previous backup with the same basename.
const stamp = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}_${two(now.getHours())}-${two(now.getMinutes())}`;
const collision = join("backups", `nise-comport-${stamp}.sql`);
if (existsSync(collision)) {
  console.error(`Backup file already exists: ${collision}. Refusing to overwrite it. Run this in a new minute.`);
  process.exit(1);
}
const before = new Set(existsSync("backups") ? readdirSync("backups") : []);
console.log("Creating a fresh database backup (SQL only, no readable CSVs).");
const result = spawnSync(process.execPath, ["scripts/db-backup.mjs", "--no-readable"], { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status || 1);
const files = readdirSync("backups").filter((name) => /^nise-comport-\d{4}-.*\.sql$/.test(name) && !before.has(name));
const good = files.find((name) => statSync(join("backups", name)).size > 1024);
if (!good) { console.error("No new nonempty SQL backup verified. Do NOT migrate."); process.exit(1); }
console.log(`Verified new backup: backups/${good}. Copy it to encrypted storage outside this repository before migration.`);
