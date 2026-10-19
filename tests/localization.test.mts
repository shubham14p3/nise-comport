import { test } from "node:test";
import assert from "node:assert/strict";
import { hindiServices } from "../src/lib/hindi.ts";
import { bengaliServices } from "../src/lib/bengali.ts";
import { translatedSlugs } from "../src/lib/translated-slugs.ts";
import { categoryMeta } from "../src/lib/categories.ts";
import { publishedServiceDetails, serviceCatalog } from "../src/lib/services.ts";
import { SERVICE_NAMES, STATUS_TEXT, WIZARD_EXTRA } from "../src/lib/i18n-forms.ts";

const FIELDS = ["title", "seoTitle", "description", "highlights", "documents", "steps", "faqs"] as const;

for (const [name, list, scripts] of [["Hindi", hindiServices, /[ऀ-ॿ]/], ["Bengali", bengaliServices, /[ঀ-৿]/]] as const) {
  test(`${name} service pages are complete and written in the right script`, () => {
    for (const service of list) {
      assert.ok(publishedServiceDetails.some((item) => item.slug === service.slug), `${service.slug} is not a published service`);
      for (const field of FIELDS) {
        const value = (service as Record<string, unknown>)[field];
        assert.ok(Array.isArray(value) ? value.length > 0 : typeof value === "string" && value.trim(), `${name} ${service.slug}: ${field} is empty`);
      }
      assert.ok(scripts.test(service.title), `${name} ${service.slug}: title is not in ${name}`);
      assert.ok(!/upload|अपलोड|আপলোড/i.test(`${service.description} ${service.steps.join(" ")}`) || service.slug !== "printing-scanning", `${service.slug} still mentions uploading`);
    }
  });
}

test("every translated slug has a Hindi and a Bengali page", () => {
  for (const slug of translatedSlugs.hi) assert.ok(hindiServices.some((item) => item.slug === slug), `no Hindi page for ${slug}`);
  for (const slug of translatedSlugs.bn) assert.ok(bengaliServices.some((item) => item.slug === slug), `no Bengali page for ${slug}`);
});

test("visible categories and services have Hindi and Bengali names", () => {
  for (const meta of categoryMeta) assert.ok(meta.short.hi && meta.short.bn && meta.line.hi && meta.line.bn, `${meta.slug} lacks a translation`);
  for (const group of serviceCatalog) assert.ok(categoryMeta.some((meta) => meta.slug === group.slug), `${group.slug} has no tile metadata`);
  for (const service of publishedServiceDetails) assert.ok(SERVICE_NAMES[service.slug]?.hi && SERVICE_NAMES[service.slug]?.bn, `${service.slug} needs Hindi/Bengali names`);
});

test("status labels and wizard texts exist in all three languages", () => {
  for (const [status, text] of Object.entries(STATUS_TEXT)) assert.ok(text.en && text.hi && text.bn, `status ${status}`);
  for (const [key, text] of Object.entries(WIZARD_EXTRA as Record<string, { en: string; hi: string; bn: string }>)) assert.ok(text.en && text.hi && text.bn, `wizard text ${key}`);
});

test("old and hidden service addresses never dead-end in Hindi or Bengali", async () => {
  const { legacyRedirects } = await import("../src/lib/legacy-redirects.ts");
  const { SERVICE_SLUG_RENAMES } = await import("../src/lib/slug-renames.ts");
  const redirects = legacyRedirects();
  for (const lang of ["hi", "bn"] as const) {
    for (const old of ["bill-payment-recharge", "ticket-booking", "fee-payments", "travel", "photo-print", "a4-a3-a2-printing"]) {
      assert.ok(redirects.some((item) => item.source === `/${lang}/services/${old}`) || redirects.some((item) => item.source === `/services/${old}`), `${lang}/${old}`);
    }
    for (const old of Object.keys(SERVICE_SLUG_RENAMES)) {
      const target = SERVICE_SLUG_RENAMES[old];
      if (!translatedSlugs[lang].includes(target)) assert.ok(redirects.some((item) => item.source === `/${lang}/services/${old}`), `${lang} ${old} has no redirect`);
    }
  }
});

test("network error messages exist in every language and map every kind of failure", async () => {
  const { messageForStatus } = await import("../src/lib/net-messages.ts");
  for (const status of [0, 400, 403, 404, 408, 413, 429, 500, 502, 503, 504, 418]) {
    const info = messageForStatus(status);
    assert.ok(info.message.length > 10 && info.code, `status ${status}`);
  }
  assert.equal(messageForStatus(0).code, "offline");
  assert.equal(messageForStatus(429).code, "rate_limited");
  assert.equal(messageForStatus(503).code, "unavailable");
});
