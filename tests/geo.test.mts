import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createGeo, INDIA_COUNTRY_ID } from "../src/data/geo/geo.ts";

const read = (name: string) => JSON.parse(readFileSync(new URL(`../src/data/geo/${name}`, import.meta.url), "utf8"));
const geo = createGeo(read("countries.json"), read("states-cities.json"));

test("countries can be found by name, ISO code and id", () => {
  assert.equal(geo.findCountry("india")?.id, INDIA_COUNTRY_ID);
  assert.equal(geo.findCountry("IN")?.name, "India");
  assert.equal(geo.findCountry(101)?.dialCode, "91");
  assert.equal(geo.findCountry("Atlantis"), undefined);
});

test("India has the expected states and Jamshedpur sits under Jharkhand", () => {
  const states = geo.states(INDIA_COUNTRY_ID).map((state) => state.name);
  for (const name of ["Jharkhand", "West Bengal", "Delhi", "Maharashtra"]) assert.ok(states.includes(name), name);
  assert.ok(geo.cities(INDIA_COUNTRY_ID, "jharkhand").some((city) => city.name === "Jamshedpur"));
  assert.equal(geo.cities(INDIA_COUNTRY_ID, 16).length, geo.cities(INDIA_COUNTRY_ID, "Jharkhand").length);
});

test("unknown state or country returns empty lists, never throws", () => {
  assert.deepEqual(geo.cities(INDIA_COUNTRY_ID, "Nowhere"), []);
  assert.deepEqual(geo.states(999999), []);
});

test("every city has a unique id inside its state", () => {
  for (const state of geo.states(INDIA_COUNTRY_ID)) {
    const cities = geo.cities(INDIA_COUNTRY_ID, state.id);
    assert.equal(new Set(cities.map((city) => city.id)).size, cities.length, state.name);
  }
});
