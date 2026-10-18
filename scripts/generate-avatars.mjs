#!/usr/bin/env node
/**
 * Generates a real, deterministic initials-avatar SVG file per reviewer and writes it into
 * public/avatars/ — so avatars are actual static image files committed to the repo/GitHub,
 * not something computed on every render. Same name always produces the same file (same
 * initials, same color), so re-running this is always safe: it just (re)writes each file.
 *
 * Source of names: by default reads src/data/testimonials-seed.json (works offline, no DB
 * needed). Pass --db to instead pull distinct author names live from the `testimonials` table
 * (useful after staff have added reviews through Admin → Testimonials that aren't in the seed
 * file) — needs DATABASE_URL.
 *
 * Usage:
 *   npm run avatars:generate        # from the seed file
 *   npm run avatars:generate -- --db  # from the live database
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { loadEnvFile } from "node:process";

// Keep in sync with src/lib/avatar.ts (colorFor/initialsFor/slugFor) — duplicated here because
// this script runs standalone under plain Node, without the Next.js path aliases.
const PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899",
];
function initialsFor(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}
function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
function slugFor(name) {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "reviewer";
}
function svgFor(name) {
  const initials = initialsFor(name);
  const color = colorFor(name);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${initials}">
  <circle cx="32" cy="32" r="32" fill="${color}"/>
  <text x="32" y="32" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#ffffff">${initials}</text>
</svg>
`;
}

async function namesFromSeed() {
  const rows = JSON.parse(readFileSync(new URL("../src/data/testimonials-seed.json", import.meta.url), "utf8"));
  return [...new Set(rows.map((row) => row.authorName).filter(Boolean))];
}

async function namesFromDb() {
  for (const file of [".env.local", ".env"]) if (existsSync(file)) { try { loadEnvFile(file); } catch { /* ignore */ } }
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) { console.error("DATABASE_URL is missing — can't use --db mode."); process.exit(1); }
  const sslSetting = process.env.DATABASE_SSL?.trim().toLowerCase();
  const ssl = (sslSetting ? sslSetting !== "false" : process.env.NODE_ENV === "production") ? { rejectUnauthorized: false } : undefined;
  const pg = await import("pg");
  const pool = new pg.default.Pool({ connectionString, max: 1, connectionTimeoutMillis: 10_000, ssl });
  const result = await pool.query("select distinct author_name from testimonials");
  await pool.end();
  return result.rows.map((row) => row.author_name).filter(Boolean);
}

const names = process.argv.includes("--db") ? await namesFromDb() : await namesFromSeed();
console.log(`Generating avatars for ${names.length} reviewer name(s)…`);

const outDir = new URL("../public/avatars/", import.meta.url);
mkdirSync(outDir, { recursive: true });

let written = 0;
for (const name of names) {
  const path = new URL(`${slugFor(name)}.svg`, outDir);
  writeFileSync(path, svgFor(name));
  written++;
}
console.log(`Wrote ${written} avatar file(s) to public/avatars/.`);
