import assert from "node:assert/strict";
import test from "node:test";
import { articles } from "../src/lib/content.ts";
import { blogHi1 } from "../src/lib/translations/blog-hi-1.ts";
import { blogHi10 } from "../src/lib/translations/blog-hi-10.ts";
import { blogHi14 } from "../src/lib/translations/blog-hi-14.ts";
import { blogHi18 } from "../src/lib/translations/blog-hi-18.ts";
import { blogHi22 } from "../src/lib/translations/blog-hi-22.ts";
import { blogBn1 } from "../src/lib/translations/blog-bn-1.ts";
import { blogBn10 } from "../src/lib/translations/blog-bn-10.ts";
import { blogBn14 } from "../src/lib/translations/blog-bn-14.ts";
import { blogBn18 } from "../src/lib/translations/blog-bn-18.ts";
import { blogBn22 } from "../src/lib/translations/blog-bn-22.ts";

const hi = { ...blogHi1, ...blogHi10, ...blogHi14, ...blogHi18, ...blogHi22 };
const bn = { ...blogBn1, ...blogBn10, ...blogBn14, ...blogBn18, ...blogBn22 };

for (const [name, table, script] of [["Hindi", hi, /[ऀ-ॿ]/], ["Bengali", bn, /[ঀ-৿]/]] as const) {
  test(`${name} blog text covers every guide with the same structure`, () => {
    for (const a of articles) {
      const t = (table as Record<string, any>)[a.slug];
      assert.ok(t, `${name} ${a.slug} missing`);
      assert.equal(t.paragraphs.length, a.paragraphs.length, `${a.slug} paragraphs`);
      assert.equal(t.checklist.length, a.checklist.length, `${a.slug} checklist`);
      assert.equal((t.sections ?? []).length, (a.sections ?? []).length, `${a.slug} sections`);
      assert.equal((t.faqs ?? []).length, (a.faqs ?? []).length, `${a.slug} faqs`);
      assert.ok(script.test(t.title) && script.test(t.excerpt), `${a.slug} title/excerpt not in ${name}`);
    }
    for (const slug of Object.keys(table)) assert.ok(articles.some((a) => a.slug === slug), `${name} has unknown slug ${slug}`);
  });
}
