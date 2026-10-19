import test from "node:test";
import assert from "node:assert/strict";
import { loyaltyKindForText, loyaltyReward } from "../src/lib/loyalty-core.ts";

test("insurance and certificates earn a flat ₹50", () => {
  assert.equal(loyaltyReward(loyaltyKindForText("bike-insurance"))?.amount, 50);
  assert.equal(loyaltyReward(loyaltyKindForText("income-caste-residence-certificate"))?.amount, 50);
  assert.equal(loyaltyReward(loyaltyKindForText("Residential certificate"))?.amount, 50);
});
test("printing earns 20% of the total, capped", () => {
  assert.equal(loyaltyReward("print", 50)?.amount, 10);
  assert.equal(loyaltyReward("print", 33.5)?.amount, 6.7);
  assert.equal(loyaltyReward("print", 2000)?.amount, 100);
  assert.equal(loyaltyReward("print", 0), null);
});
test("other services earn nothing", () => {
  assert.equal(loyaltyKindForText("PAN card correction"), null);
  assert.equal(loyaltyReward(null), null);
});
