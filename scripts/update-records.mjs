#!/usr/bin/env node
/**
 * One command to bring the database up to date with your Excel files, whenever they change.
 *
 *   npm run records:update                      uses the folder or file you used last time (asks the first time)
 *   npm run records:update -- "D:/new/place"    a different folder or file; it is remembered for next time
 *   npm run records:update -- --yes             skip the "save these?" question
 *
 * Steps: (1) read the files and show what would be saved, (2) ask you to confirm, (3) save only what is new
 * (rows already in the database are skipped), (4) refresh birthdays and WhatsApp contacts from all records.
 * The last location is kept in .records-source.json (not committed to git).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const REMEMBER = ".records-source.json";
const args = process.argv.slice(2);
const yes = args.includes("--yes");
let paths = args.filter((arg) => !arg.startsWith("--")).map((arg) => arg.trim());
if (!paths.length && existsSync(REMEMBER)) { try { paths = JSON.parse(readFileSync(REMEMBER, "utf8")).paths ?? []; } catch { /* ask below */ } }

const rl = createInterface({ input: process.stdin, output: process.stdout });
if (!paths.length) {
  const answer = (await rl.question("Folder or Excel file to load (e.g. C:/Users/you/Downloads/MYEXCEL): ")).trim().replace(/^["']|["']$/g, "");
  if (answer) paths = [answer];
}
const missing = paths.filter((path) => !existsSync(path));
if (!paths.length || missing.length) {
  console.error(missing.length ? `Not found: ${missing.join(", ")}\nGive the new location: npm run records:update -- "D:/new/place"` : "No folder given.");
  rl.close(); process.exit(1);
}
console.log(`Using: ${paths.join("  |  ")}\n`);

const NODE_FLAGS = ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--experimental-strip-types"];
const run = (script, extra = []) => spawnSync(process.execPath, [...NODE_FLAGS, script, ...extra], { stdio: "inherit" }).status === 0;

console.log("Step 1 of 3: reading your files (nothing is saved yet)…");
if (!run("scripts/import-records.mts", paths)) { rl.close(); process.exit(1); }
writeFileSync(REMEMBER, JSON.stringify({ paths, updatedAt: new Date().toISOString() }, null, 2));

if (!yes) {
  const answer = (await rl.question("\nSave what is new to the database? (y/N) ")).trim().toLowerCase();
  if (answer !== "y" && answer !== "yes") { console.log("Nothing was saved."); rl.close(); process.exit(0); }
}
rl.close();

console.log("\nStep 2 of 3: saving new records…");
if (!run("scripts/import-records.mts", ["--apply", ...paths])) process.exit(1);
console.log("\nStep 3 of 3: refreshing birthdays and contacts…");
if (!run("scripts/scan-records.mts")) process.exit(1);
console.log("\nAll done. Reload the Birthdays and Records tabs in the admin desk.");
