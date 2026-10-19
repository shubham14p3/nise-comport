import assert from "node:assert/strict";
import test from "node:test";
import { LEGAL_DEFAULTS } from "../src/lib/legal-defaults.ts";
import { LEGAL_HI } from "../src/lib/translations/legal-hi.ts";
import { LEGAL_BN } from "../src/lib/translations/legal-bn.ts";

const sections = (text: string) => (text.match(/^## /gm) ?? []).length;
const placeholders = (text: string) => [...new Set(text.match(/\{\{\w+\}\}/g) ?? [])].sort();
const links = (text: string) => [...text.matchAll(/\]\((\/[^)]*)\)/g)].map((m) => m[1]).sort();

for (const [name, table] of [["Hindi", LEGAL_HI], ["Bengali", LEGAL_BN]] as const) {
  test(`${name} policy text mirrors the English structure`, () => {
    for (const slug of Object.keys(LEGAL_DEFAULTS)) {
      assert.ok(table[slug], `${name} ${slug} missing`);
      assert.equal(sections(table[slug]), sections(LEGAL_DEFAULTS[slug as keyof typeof LEGAL_DEFAULTS]), `${name} ${slug} section count`);
      assert.deepEqual(placeholders(table[slug]), placeholders(LEGAL_DEFAULTS[slug as keyof typeof LEGAL_DEFAULTS]), `${name} ${slug} placeholders`);
      assert.deepEqual(links(table[slug]), links(LEGAL_DEFAULTS[slug as keyof typeof LEGAL_DEFAULTS]), `${name} ${slug} links`);
    }
  });
}
