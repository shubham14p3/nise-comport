import { test } from "node:test";
import assert from "node:assert/strict";
import { RATE_RULES, rateKey, secondsUntilWindowEnds, windowStartFor } from "../src/lib/rate-limit-core.ts";

test("fixed windows line up on every server", () => {
  const now = Date.parse("2026-09-30T10:07:30Z");
  assert.equal(windowStartFor(now, 60).toISOString(), "2026-09-30T10:07:00.000Z");
  assert.equal(windowStartFor(now, 3600).toISOString(), "2026-09-30T10:00:00.000Z");
  assert.equal(secondsUntilWindowEnds(now, 60), 30);
  assert.equal(secondsUntilWindowEnds(now, 900), 450);
});

test("rules with the same name but different windows get different keys", () => {
  const a = rateKey(RATE_RULES.otpSendPerEmailMinute, "abc");
  const b = rateKey(RATE_RULES.otpSendPerEmailHour, "abc");
  assert.notEqual(a, b);
  assert.ok(RATE_RULES.passwordFailuresPerEmail15m.limit >= 3 && RATE_RULES.passwordFailuresPerEmail15m.limit <= 10);
  assert.equal(RATE_RULES.otpSendPerEmailMinute.limit, 1);
});
