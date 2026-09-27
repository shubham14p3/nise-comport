import test from "node:test";
import assert from "node:assert/strict";
import { blackWhiteCost, countSelectedPages, couponDiscount } from "../src/lib/print-pricing.ts";

test("black-and-white price uses the applicable total-order tier", () => {
  assert.equal(blackWhiteCost(0), 0);
  assert.equal(blackWhiteCost(10), 50);
  assert.equal(blackWhiteCost(11), 33);
  assert.equal(blackWhiteCost(50), 150);
  assert.equal(blackWhiteCost(51), 102);
});

test("page selection counts exact numbers and ranges", () => {
  assert.equal(countSelectedPages("all", 8), 8);
  assert.equal(countSelectedPages("1-3, 5", 8), 4);
  assert.equal(countSelectedPages(" 2 - 4 ", 8), 3);
});

test("page selection rejects duplicate, malformed, and out-of-bounds pages", () => {
  assert.throws(() => countSelectedPages("1-3, 3", 8), /more than once/);
  assert.throws(() => countSelectedPages("1,x", 8), /page numbers or ranges/);
  assert.throws(() => countSelectedPages("1-9", 8), /between 1 and 8/);
  assert.throws(() => countSelectedPages("4-2", 8), /between 1 and 8/);
});

test("coupon amounts are rounded and cannot exceed the subtotal", () => {
  assert.equal(couponDiscount("percent", 10, 99), 9.9);
  assert.equal(couponDiscount("fixed", 200, 99), 99);
  assert.equal(couponDiscount("fixed", -5, 99), 0);
});
