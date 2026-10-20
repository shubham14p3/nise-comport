#!/usr/bin/env node
/**
 * Builds the country / state / city JSON files in src/data/geo from browser "HAR" captures of a page that loads them
 * (for example MSG91's dashboard, whose calls are getStatesByCountryId/<id> and getCitiesByStateId/<id>).
 *
 *   node scripts/build-geo-from-har.mjs --har a.har [--har b.har ...] [--countries countries-response.json]
 *
 * - Several HAR files are merged; running it again with more captures only ADDS states and cities (nothing is removed).
 * - --countries is the saved response of the countries call ({ data: [{ id, name, countryCode, shortName }] }).
 * - Output: src/data/geo/countries.json and src/data/geo/states-cities.json (keyed by country id).
 * No dependencies. Runs on plain Node 22.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const values = (flag) => args.flatMap((arg, index) => (arg === flag && args[index + 1] ? [args[index + 1]] : []));
const hars = values("--har");
const countriesFile = values("--countries")[0];
if (!hars.length && !countriesFile) { console.error("Give at least one --har file (and optionally --countries file)."); process.exit(1); }

const OUT = "src/data/geo";
mkdirSync(OUT, { recursive: true });
const readJson = (file, fallback) => (existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : fallback);
const clean = (text) => String(text ?? "").replace(/\s+/g, " ").trim();

// ---- countries -----------------------------------------------------------------------------------------------------------
let countries = readJson(`${OUT}/countries.json`, []);
if (countriesFile) {
  const body = JSON.parse(readFileSync(countriesFile, "utf8"));
  const incoming = (body.data ?? body).map((row) => ({ id: row.id, name: clean(row.name), dialCode: String(row.countryCode ?? ""), iso: String(row.shortName ?? "") }));
  const byId = new Map(countries.map((row) => [row.id, row]));
  for (const row of incoming) byId.set(row.id, row);
  countries = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(`${OUT}/countries.json`, JSON.stringify(countries, null, 1) + "\n");
  console.log(`countries.json: ${countries.length} countries`);
}

// ---- states and cities (keyed by country id) -------------------------------------------------------------------------------
const world = readJson(`${OUT}/states-cities.json`, {});
const stateOwner = new Map(); // state id -> country id
for (const [countryId, entry] of Object.entries(world)) for (const state of entry.states) stateOwner.set(state.id, Number(countryId));
const seenStates = new Map();
const calls = [];
for (const file of hars) {
  const har = JSON.parse(readFileSync(file, "utf8"));
  for (const entry of har.log.entries) {
    const url = entry.request.url;
    const text = entry.response.content?.text;
    if (!text || entry.response.status !== 200) continue;
    let body; try { body = JSON.parse(entry.response.content.encoding === "base64" ? Buffer.from(text, "base64").toString("utf8") : text); } catch { continue; }
    if (!Array.isArray(body.data)) continue;
    let match = /getStatesByCountryId\/(\d+)/.exec(url);
    if (match) calls.push({ kind: "states", id: Number(match[1]), rows: body.data });
    match = /getCitiesByStateId\/(\d+)/.exec(url);
    if (match) calls.push({ kind: "cities", id: Number(match[1]), rows: body.data });
  }
}
for (const call of calls.filter((item) => item.kind === "states")) {
  const entry = (world[call.id] ??= { states: [] });
  for (const row of call.rows) {
    let state = entry.states.find((item) => item.id === row.id);
    if (!state) { state = { id: row.id, name: clean(row.name), cities: [] }; entry.states.push(state); }
    stateOwner.set(row.id, call.id); seenStates.set(row.id, state);
  }
}
let citiesAdded = 0;
for (const call of calls.filter((item) => item.kind === "cities")) {
  const owner = stateOwner.get(call.id);
  const state = owner === undefined ? undefined : world[owner].states.find((item) => item.id === call.id);
  if (!state) { console.warn(`Skipped cities of state ${call.id}: its states list is not in the capture.`); continue; }
  const known = new Set(state.cities.map((city) => city.id));
  for (const row of call.rows) { if (known.has(row.id) || !clean(row.name)) continue; state.cities.push({ id: row.id, name: clean(row.name) }); known.add(row.id); citiesAdded++; }
  state.cities.sort((a, b) => a.name.localeCompare(b.name));
}
for (const entry of Object.values(world)) entry.states.sort((a, b) => a.name.localeCompare(b.name));
if (hars.length) {
  writeFileSync(`${OUT}/states-cities.json`, JSON.stringify(world) + "\n");
  for (const [countryId, entry] of Object.entries(world)) {
    const name = countries.find((row) => row.id === Number(countryId))?.name ?? `country ${countryId}`;
    const empty = entry.states.filter((state) => !state.cities.length).map((state) => state.name);
    console.log(`${name}: ${entry.states.length} states, ${entry.states.reduce((sum, state) => sum + state.cities.length, 0)} cities${empty.length ? `; no cities captured for: ${empty.join(", ")}` : ""}`);
  }
  console.log(`${citiesAdded} cities added in this run.`);
}
