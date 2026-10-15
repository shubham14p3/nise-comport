import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cappedDiscount, cleanScope, personalCode, scopeAllows, scopeLabel } from "../src/lib/promo-scope.ts";
import { STAFF_PERMISSIONS } from "../src/lib/permissions.ts";

test("a code works only on the services it was made for", () => {
  assert.ok(scopeAllows(null, { service: "print" }), "unrestricted codes work everywhere");
  const printOnly = cleanScope({ categories: [], services: ["print"] });
  assert.ok(scopeAllows(printOnly, { service: "print" }));
  assert.ok(!scopeAllows(printOnly, { service: "bike-insurance", category: "insurance" }));
  const insurance = cleanScope({ categories: ["insurance"], services: ["pan"] });
  assert.ok(scopeAllows(insurance, { service: "car-insurance", category: "insurance" }), "a category covers its services");
  assert.ok(scopeAllows(insurance, { service: "pan-card", category: "government-services" }), "\"pan\" covers the PAN service");
  assert.ok(!scopeAllows(insurance, { service: "print" }));
  assert.equal(cleanScope({ categories: [], services: [] }), null);
  assert.deepEqual(cleanScope({ categories: ["insurance", "insurance", "<script>"], services: [7] }), { categories: ["insurance"], services: [] });
  assert.equal(scopeLabel(insurance, { insurance: "Insurance Assistance" }), "Insurance Assistance, PAN requests");
  assert.equal(scopeLabel(null, {}), "All services");
});

test("percent codes can be capped, and never exceed the bill", () => {
  assert.equal(cappedDiscount("percent", 20, 1000, 100), 100);
  assert.equal(cappedDiscount("percent", 20, 300, 100), 60);
  assert.equal(cappedDiscount("fixed", 50, 30, null), 30);
  assert.equal(cappedDiscount("fixed", 50, 200, null), 50);
});

test("personal codes are long, unambiguous and random", () => {
  let seed = 1; const random = (max: number) => { seed = (seed * 48271) % 2147483647; return seed % max; };
  const codes = new Set(Array.from({ length: 2000 }, () => personalCode("diwali 26!", random)));
  assert.equal(codes.size, 2000);
  for (const code of codes) assert.match(code, /^DIWALI26-[A-HJ-NP-Z2-9]{8}$/);
  assert.match(personalCode("", random), /^NC-/);
});

test("site content permission and migration 0010", () => {
  assert.ok(STAFF_PERMISSIONS.includes("content"));
  const sql = readFileSync(new URL("../drizzle/0010_coupon_scope_batches.sql", import.meta.url), "utf8");
  for (const part of ['"applies_to" jsonb', '"max_discount"', 'CREATE TABLE "coupon_batches"', 'CREATE TABLE "site_banners"', 'CREATE TABLE "custom_services"']) assert.ok(sql.includes(part), part);
  const journal = JSON.parse(readFileSync(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8")) as { entries: { tag: string }[] };
  assert.ok(journal.entries.some((entry: { tag: string }) => entry.tag === "0010_coupon_scope_batches"));
});
