import test from "node:test";
import assert from "node:assert/strict";
import { matchesSearch, normaliseSearch } from "../src/lib/search-terms.ts";

const hay = (text: string) => normaliseSearch(text);
const insurance = hay("Bike Insurance Renewal and new policy help");
const pan = hay("PAN Card Application and Correction Help");
const income = hay("Income, Caste and Residential Certificate");

test("misspelt words still find the service", () => {
  for (const q of ["insurnce", "inshurance", "insurence", "insuran", "insu", "bike insurence", "nsurance"]) assert.ok(matchesSearch(insurance, q), q);
  for (const q of ["pann card", "pan crd", "correcton", "aplication"]) assert.ok(matchesSearch(pan, q), q);
  for (const q of ["incom certifcate", "residental"]) assert.ok(matchesSearch(income, q), q);
});
test("unrelated words do not match", () => {
  assert.ok(!matchesSearch(insurance, "passport"));
  assert.ok(!matchesSearch(pan, "laptop"));
  assert.ok(!matchesSearch(income, "electricity"));
});
test("Hindi and Bengali still work", () => {
  assert.ok(matchesSearch(insurance, "बीमा"));
  assert.ok(matchesSearch(income, "আয়"));
});
