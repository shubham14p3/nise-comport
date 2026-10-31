import assert from "node:assert/strict";
import { test } from "node:test";
import { customerPage } from "../src/lib/customer-pagination.ts";

test("customer pagination defaults to 20 rows and bounds untrusted input", () => {
  assert.deepEqual(customerPage(new URLSearchParams()), { page: 0, pageSize: 20, offset: 0 });
  assert.deepEqual(customerPage(new URLSearchParams("page=3&pageSize=10")), { page: 3, pageSize: 10, offset: 30 });
  for (const page of ["-1", "Infinity", "NaN", "garbage"]) assert.equal(customerPage(new URLSearchParams({ page })).page, 0);
  assert.equal(customerPage(new URLSearchParams("page=2.9&pageSize=1000000")).offset, 40);
  assert.equal(customerPage(new URLSearchParams("page=999999999&pageSize=50")).offset, 5000000);
});
