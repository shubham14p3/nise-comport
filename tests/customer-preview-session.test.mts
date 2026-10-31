import assert from "node:assert/strict";
import { test } from "node:test";
import { createPreviewGrant, PREVIEW_MS, readPreviewGrant } from "../src/lib/customer-preview-session.ts";

test("preview belongs to the initiating administrator and expires after 15 minutes", () => {
  const previous = process.env.INTERNAL_API_TOKEN;
  process.env.INTERNAL_API_TOKEN = "unit-test-internal-token-must-be-long-and-private";
  try {
    const now = 1_799_999_000_000;
    const user = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const token = createPreviewGrant("admin-id", user, now);
    assert.equal(readPreviewGrant(token, "admin-id", now + 100)?.target, user);
    assert.equal(readPreviewGrant(token, "another-admin", now + 100), null);
    assert.equal(readPreviewGrant(token, "admin-id", now + PREVIEW_MS), null);
    assert.equal(readPreviewGrant(token.slice(0,-2) + "ZZ", "admin-id", now + 100), null);
  } finally {
    if (previous === undefined) delete process.env.INTERNAL_API_TOKEN;
    else process.env.INTERNAL_API_TOKEN = previous;
  }
});
