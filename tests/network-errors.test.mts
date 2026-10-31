import assert from "node:assert/strict";
import { test } from "node:test";
import { messageForStatus } from "../src/lib/net-messages.ts";

test("bad encrypted request does not imply that the user's clock is wrong", () => {
  for (const status of [400, 403, 404]) {
    const result = messageForStatus(status);
    assert.equal(result.code, "secure_failed");
    assert.match(result.message, /secure connection/i);
  }
});

test("hosting outages and timeouts are distinguishable from offline", () => {
  assert.equal(messageForStatus(503).code, "unavailable");
  assert.equal(messageForStatus(504).code, "timeout");
  assert.equal(messageForStatus(0).code, "offline");
});
