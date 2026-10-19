import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_LOYALTY, loyaltyReward, sanitizeLoyalty } from "../src/lib/loyalty-core.ts";

const reward = (text: string, total = 0) => loyaltyReward(DEFAULT_LOYALTY, text, total);

test("insurance and certificates earn a flat ₹50", () => {
  assert.equal(reward("bike-insurance Bike insurance")?.amount, 50);
  assert.equal(reward("income-caste-residence-certificate")?.amount, 50);
  assert.equal(reward("Residential certificate")?.amount, 50);
});
test("printing earns 20% from ₹20, to the paisa, with no upper limit", () => {
  assert.equal(reward("print report.pdf", 50)?.amount, 10);
  assert.equal(reward("print report.pdf", 33.5)?.amount, 6.7);
  assert.equal(reward("print report.pdf", 20)?.amount, 4);
  assert.equal(reward("print report.pdf", 2000)?.amount, 400);
  assert.equal(reward("print report.pdf", 19.99), null);
  assert.equal(reward("print report.pdf", 0), null);
});
test("other services earn nothing, and switching off stops everything", () => {
  assert.equal(reward("pan-card PAN card correction", 200), null);
  assert.equal(loyaltyReward({ ...DEFAULT_LOYALTY, enabled: false }, "bike insurance"), null);
});
test("edited rules apply: a cap and a new rule", () => {
  const settings = sanitizeLoyalty({ enabled: true, rules: [
    { label: "Print", keywords: "print", type: "percent", value: 10, cap: 15, minOrder: 0 },
    { label: "Voter ID", keywords: "voter", type: "flat", value: 25 },
  ] });
  assert.equal(loyaltyReward(settings, "print x", 500)?.amount, 15);
  assert.equal(loyaltyReward(settings, "voter-id Voter ID help")?.amount, 25);
});
test("bad saved values are cleaned", () => {
  const settings = sanitizeLoyalty({ rules: [{ label: "", keywords: ["a"] }, { label: "Odd", keywords: ["odd"], type: "percent", value: 5000, cap: -3 }] });
  assert.equal(settings.rules.length, 1);
  assert.equal(settings.rules[0].value, 100);
  assert.equal(settings.rules[0].cap, null);
});
