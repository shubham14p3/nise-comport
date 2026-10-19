import test from "node:test";
import assert from "node:assert/strict";
import { parseLegal, fillPlaceholders } from "../src/lib/legal-markup.ts";
import { LEGAL_DEFAULTS } from "../src/lib/legal-defaults.ts";

const values = { site: "NISE COMPORT", domain: "nisecomport.com", email: "info@nisecomport.com", phone: "+91 1", address: "Addr", date: "October 2026" };

test("placeholders are filled", () => assert.equal(fillPlaceholders("{{site}} {{ domain }}", values), "NISE COMPORT nisecomport.com"));
test("unsafe links are not turned into links", () => {
  const doc = parseLegal("[x](javascript:alert(1))\n\n## T\n\ntext", values);
  assert.ok(!JSON.stringify(doc).includes("javascript"));
});
test("built-in pages parse into numbered sections with no leftover placeholders", () => {
  for (const [slug, text] of Object.entries(LEGAL_DEFAULTS)) {
    const doc = parseLegal(text, values);
    assert.ok(doc.sections.length >= 8, slug);
    assert.ok(!JSON.stringify(doc).includes("{{"), slug);
    assert.equal(new Set(doc.sections.map((section) => section.id)).size, doc.sections.length);
  }
});
