import assert from "node:assert/strict";
import { test } from "node:test";
import { internalApiHeaders, internalApiOrigin, isCrossSiteApiRequest } from "../src/lib/api-routing.ts";

test("production uses MilesWeb loopback, independent of public domain", () => {
  assert.equal(internalApiOrigin({ APP_ENV: "prod", NODE_ENV: "production" }), "http://127.0.0.1:3020");
  assert.equal(internalApiOrigin({ NODE_ENV: "production" }), "http://127.0.0.1:3020");
  assert.equal(internalApiOrigin({ APP_ENV: "prod", INTERNAL_API_PORT: "3100" }), "http://127.0.0.1:3100");
});

test("local mode uses localhost listener and supports port overrides", () => {
  assert.equal(internalApiOrigin({ APP_ENV: "local" }), "http://127.0.0.1:3000");
  assert.equal(internalApiOrigin({ NODE_ENV: "development" }), "http://127.0.0.1:3000");
  assert.equal(internalApiOrigin({ APP_ENV: "local", INTERNAL_API_PORT: "3005" }), "http://127.0.0.1:3005");
});

test("rejects unknown modes and invalid ports before requests are sent", () => {
  assert.throws(() => internalApiOrigin({ APP_ENV: "staging" }), /APP_ENV/);
  for (const port of ["0", "-1", "65536", "abc", "3000/evil", "03000", ""]) {
    // Blank port intentionally uses the default; all other invalid values fail.
    if (!port) continue;
    assert.throws(() => internalApiOrigin({ APP_ENV: "prod", INTERNAL_API_PORT: port }), /INTERNAL_API_PORT/, port);
  }
});

test("authenticated loopback calls pass CSRF without weakening browser checks", () => {
  const target = new URL("/api/auth/password", internalApiOrigin({ APP_ENV: "prod" }));
  const headers = internalApiHeaders("a".repeat(40), target);
  assert.equal(headers.get("origin"), "http://127.0.0.1:3020");
  assert.equal(headers.get("x-nise-internal"), "a".repeat(40));
  assert.equal(isCrossSiteApiRequest("127.0.0.1:3020", "nisecomport.aitapri.com", headers.get("origin"), null), false);

  // Original regression: sending the public browser origin to localhost was blocked.
  assert.equal(isCrossSiteApiRequest("127.0.0.1:3020", "nisecomport.aitapri.com", "https://nisecomport.aitapri.com", null), false);
  // Browsers from an unrelated origin remain blocked.
  assert.equal(isCrossSiteApiRequest("nisecomport.aitapri.com", "nisecomport.aitapri.com", "https://example.org", "cross-site"), true);
  assert.equal(isCrossSiteApiRequest("nisecomport.aitapri.com", "nisecomport.aitapri.com", "not-a-url", null), true);
  assert.equal(isCrossSiteApiRequest("nisecomport.aitapri.com", "nisecomport.aitapri.com", null, "cross-site"), true);
  assert.equal(isCrossSiteApiRequest("nisecomport.aitapri.com", "nisecomport.aitapri.com", "https://nisecomport.aitapri.com", "same-origin"), false);
});

test("local browser and loopback headers share the same origin", () => {
  const target = new URL("/api/auth/request-otp", internalApiOrigin({ APP_ENV: "local" }));
  const headers = internalApiHeaders("b".repeat(40), target);
  assert.equal(headers.get("origin"), target.origin);
  assert.equal(isCrossSiteApiRequest("127.0.0.1:3000", "localhost:3000", headers.get("origin"), null), false);
});
