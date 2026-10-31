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
const before = new Set(existsSync("backups") ? readdirSync("backups") : []);
console.log("Creating a fresh database backup (SQL only, no readable CSVs).");
const result = spawnSync(process.execPath, ["scripts/db-backup.mjs", "--no-readable"], { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status || 1);
const files = readdirSync("backups").filter((name) => /^nise-comport-\d{4}-.*\.sql$/.test(name) && !before.has(name));
const good = files.find((name) => statSync(join("backups", name)).size > 1024);
if (!good) { console.error("No new nonempty SQL backup verified. Do NOT migrate."); process.exit(1); }
console.log(`Verified new backup: backups/${good}. Copy it to encrypted storage outside this repository before migration.`);
