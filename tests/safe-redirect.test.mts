import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNextPath } from "../src/lib/safe-redirect.ts";

test("same-site paths are kept, including query and hash", () => {
  assert.equal(safeNextPath("/pan/request?type=minor"), "/pan/request?type=minor");
  assert.equal(safeNextPath("/services/pan-card#request-form"), "/services/pan-card#request-form");
  assert.equal(safeNextPath("%2Fprofile%3Fsection%3Drequests"), "/profile?section=requests");
});

test("open redirects and unsafe targets fall back to /profile", () => {
  for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "evil.com", "/%2F%2Fevil.com", "/api/auth/session", "/login", "/signup?next=/x", "/forgot-password", "", null, undefined, "/%E0%A4%A", "/a\u0000b"]) {
    assert.equal(safeNextPath(bad as string), "/profile", String(bad));
  }
  assert.equal(safeNextPath("//evil.com", "/"), "/");
});
