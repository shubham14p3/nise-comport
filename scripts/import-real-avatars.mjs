#!/usr/bin/env node
/**
 * Pulls real reviewer avatar photos out of a saved Google Maps reviews page and wires them into
 * the site. Google's public APIs never expose a reviewer's photo, but the live Maps page embeds
 * each one as a small 40×40 image right next to their review (a real photo if the reviewer set
 * one, or Google's own colored-initial circle if they didn't) — this script matches those images
 * to the reviews already imported via testimonials:seed (same Google review id) and copies them
 * into public/avatars/real/.
 *
 * Usage:
 *   1. Open the business's Google Maps listing → Reviews, scroll to load as many as you want,
 *      then File → Save page as… → "Webpage, Complete" (this saves an .html + a "_files" folder).
 *   2. Zip that output (or point this script straight at the saved folder).
 *   3. npm run avatars:import-real -- /path/to/saved-page.zip
 *      (or) npm run avatars:import-real -- /path/to/saved-page-folder
 *
 * Safe to re-run any time you save a fresh copy of the reviews page — it only ever adds/replaces
 * files for reviewers it finds a photo for, by their slug (see src/lib/avatar.ts).
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const input = process.argv[2];
if (!input) { console.error("Usage: npm run avatars:import-real -- /path/to/saved-page.zip (or folder)"); process.exit(1); }

function slugFor(name) {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "reviewer";
}

async function resolveSourceDir(inputPath) {
  if (!existsSync(inputPath)) { console.error(`Not found: ${inputPath}`); process.exit(1); }
  if (!inputPath.toLowerCase().endsWith(".zip")) return inputPath;
  const { execFileSync } = await import("node:child_process");
  const dir = await mkdtemp(path.join(tmpdir(), "nise-avatars-"));
  execFileSync("unzip", ["-oq", inputPath, "-d", dir]);
  return dir;
}

function findHtmlFile(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const html = entries.find((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".html"));
  if (html) return path.join(dir, html.name);
  for (const entry of entries) { if (entry.isDirectory()) { const found = findHtmlFile(path.join(dir, entry.name)); if (found) return found; } }
  return null;
}

function findFilesDir(dir, htmlFile) {
  const base = path.basename(htmlFile, ".html");
  const candidate = path.join(dir, `${base}_files`);
  if (existsSync(candidate)) return candidate;
  // Fall back: any "*_files" folder.
  const entries = readdirSync(dir, { withFileTypes: true });
  const found = entries.find((entry) => entry.isDirectory() && entry.name.endsWith("_files"));
  return found ? path.join(dir, found.name) : null;
}

const sourceDir = await resolveSourceDir(input);
const htmlFile = findHtmlFile(sourceDir);
if (!htmlFile) { console.error("Could not find a saved .html page in that input."); process.exit(1); }
const filesDir = findFilesDir(path.dirname(htmlFile), htmlFile);
if (!filesDir) { console.error("Could not find the saved page's \"_files\" folder (the images) next to the .html."); process.exit(1); }

const html = readFileSync(htmlFile, "utf8");
const pattern = /data-review-id="([^"]+)"[\s\S]{0,600}?unnamed\((\d+)\)\.png/g;
const byReviewId = new Map();
for (const match of html.matchAll(pattern)) { if (!byReviewId.has(match[1])) byReviewId.set(match[1], match[2]); }
console.log(`Found ${byReviewId.size} reviewer photo(s) in the saved page.`);

const seedPath = path.join(root, "../src/data/testimonials-seed.json");
const seed = JSON.parse(readFileSync(seedPath, "utf8"));
const outDir = path.join(root, "../public/avatars/real");
mkdirSync(outDir, { recursive: true });

let matched = 0;
const slugs = new Set();
for (const row of seed) {
  const n = byReviewId.get(row.sourceId);
  if (!n) continue;
  const src = path.join(filesDir, `unnamed(${n}).png`);
  if (!existsSync(src)) continue;
  const slug = slugFor(row.authorName);
  const dest = path.join(outDir, `${slug}.png`);
  copyFileSync(src, dest);
  slugs.add(slug);
  matched++;
}

const slugsPath = path.join(root, "../src/data/avatar-real-slugs.json");
const existing = existsSync(slugsPath) ? new Set(JSON.parse(readFileSync(slugsPath, "utf8"))) : new Set();
for (const slug of slugs) existing.add(slug);
writeFileSync(slugsPath, JSON.stringify([...existing].sort(), null, 0));

console.log(`Matched and copied ${matched} real avatar photo(s) into public/avatars/real/.`);
console.log(`src/data/avatar-real-slugs.json now lists ${existing.size} reviewer(s) with a real photo.`);
if (sourceDir !== input) await rm(sourceDir, { recursive: true, force: true });
