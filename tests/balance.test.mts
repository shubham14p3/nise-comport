import test from "node:test";
import assert from "node:assert/strict";
import { balanceDiscount } from "../src/lib/promo-scope.ts";

test("₹50 balance, 20% per order: ₹100 order takes ₹20", () => {
  assert.equal(balanceDiscount(50, 100, 20, null), 20);
  assert.equal(balanceDiscount(30, 100, 20, null), 20);
  assert.equal(balanceDiscount(10, 100, 20, null), 10);
});
test("never more than the balance, the bill or the rupee cap", () => {
  assert.equal(balanceDiscount(0, 100, 20, null), 0);
  assert.equal(balanceDiscount(50, 500, 50, 15), 15);
  assert.equal(balanceDiscount(50, 40, 100, null), 40);
});
