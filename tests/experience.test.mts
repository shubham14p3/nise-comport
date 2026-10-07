import { test } from "node:test";
import assert from "node:assert/strict";
import { bengaliHome, bengaliServices } from "../src/lib/bengali.ts";
import { categoryMeta } from "../src/lib/categories.ts";
import { localGallery, posterFor } from "../src/lib/gallery.ts";
import { hindiServices } from "../src/lib/hindi.ts";
import { summarizeHours } from "../src/lib/hours.ts";
import { basePath, dictionaries, fill, isAppPath, localeFromPath, localizedHref } from "../src/lib/i18n.ts";
import { findOffer, indiaDate, isOfferLive, offerAppliesTo, offers, offersFor } from "../src/lib/offers.ts";
import { publicRoutes } from "../src/lib/routes.ts";
import { serviceCatalog } from "../src/lib/services.ts";
import { translatedSlugs } from "../src/lib/translated-slugs.ts";
import { existsSync } from "node:fs";

/** Every key path in an object, e.g. "nav.services", "chat.topics.pan.label". */
function keyPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) return [`${prefix}[${value.length}]`];
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, child]) => keyPaths(child, prefix ? `${prefix}.${key}` : key));
  return [prefix];
}

test("Hindi and Bengali interface text covers every English key", () => {
  const english = keyPaths(dictionaries.en).sort();
  assert.deepEqual(keyPaths(dictionaries.hi).sort(), english);
  assert.deepEqual(keyPaths(dictionaries.bn).sort(), english);
  for (const locale of ["en", "hi", "bn"] as const) {
    for (const path of keyPaths(dictionaries[locale])) {
      const value = path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key.replace(/\[\d+\]$/, "")], dictionaries[locale]);
      if (typeof value === "string") assert.ok(value.trim().length > 0, `${locale}.${path} is empty`);
    }
  }
  assert.equal(fill("Step {n} of {total}", { n: 2, total: 4 }), "Step 2 of 4");
});

test("language menu keeps people on the same service when a translation exists", () => {
  assert.equal(localeFromPath("/hi/services/pan-card"), "hi");
  assert.equal(localeFromPath("/bn"), "bn");
  assert.equal(localeFromPath("/blog"), "en");
  assert.equal(basePath("/bn/services/x"), "/services/x");
  assert.equal(localizedHref("/services/pan-card", "bn", translatedSlugs), "/bn/services/pan-card");
  assert.equal(localizedHref("/hi/services/pan-card", "en", translatedSlugs), "/services/pan-card");
  assert.equal(localizedHref("/services/car-insurance", "hi", translatedSlugs), "/hi");
  assert.equal(localizedHref("/", "hi", translatedSlugs), "/hi");
  assert.equal(localizedHref("/bn", "en", translatedSlugs), "/");
  // App screens (sign-in, profile, step flows) switch text in place instead of navigating.
  assert.equal(localizedHref("/login", "bn", translatedSlugs), null);
  assert.ok(isAppPath("/profile") && isAppPath("/request") && isAppPath("/pan/request"));
  assert.ok(!isAppPath("/pan") && !isAppPath("/"));
});

test("translated slug list matches the Hindi and Bengali content", () => {
  assert.deepEqual([...translatedSlugs.hi].sort(), hindiServices.map((service) => service.slug).sort());
  assert.deepEqual([...translatedSlugs.bn].sort(), bengaliServices.map((service) => service.slug).sort());
  for (const [index, service] of hindiServices.entries()) {
    const bengali = bengaliServices[index];
    assert.equal(bengali.slug, service.slug);
    assert.equal(bengali.documents.length, service.documents.length, `${service.slug} documents`);
    assert.equal(bengali.steps.length, service.steps.length, `${service.slug} steps`);
    assert.ok(bengali.seoTitle.length <= 70, `${service.slug} Bengali title too long`);
  }
  assert.ok(bengaliHome.faqs.length >= 3);
});

test("Bengali pages are in the sitemap with hreflang to English and Hindi", () => {
  const routes = publicRoutes();
  const paths = new Set(routes.map((route) => route.path));
  assert.ok(paths.has("/bn"));
  for (const service of bengaliServices) assert.ok(paths.has(`/bn/services/${service.slug}`), service.slug);
  const pan = routes.find((route) => route.path === "/services/pan-card");
  assert.deepEqual(pan?.alternates, { "hi-IN": "/hi/services/pan-card", "bn-IN": "/bn/services/pan-card" });
  const home = routes.find((route) => route.path === "/");
  assert.equal(home?.alternates?.["bn-IN"], "/bn");
});

test("offers switch on and off by date and apply only where they should", () => {
  const insurance = findOffer("first-insurance-100");
  assert.ok(insurance);
  assert.equal(indiaDate(new Date("2026-12-31T18:00:00Z")), "2026-12-31");
  assert.equal(indiaDate(new Date("2026-12-31T18:31:00Z")), "2027-01-01");
  assert.equal(isOfferLive(insurance, new Date("2026-12-31T12:00:00Z")), true);
  assert.equal(isOfferLive(insurance, new Date("2027-01-01T00:00:00Z")), false, "ends at midnight India time");
  assert.equal(isOfferLive({ ...insurance, active: false }, new Date("2026-10-01T00:00:00Z")), false);
  assert.ok(offerAppliesTo(insurance, "insurance"));
  assert.ok(!offerAppliesTo(insurance, "banking"));
  const forInsurance = offersFor("insurance", new Date("2026-10-01T00:00:00Z"));
  assert.equal(forInsurance[0]?.id, "first-insurance-100", "category offer comes first");
  assert.ok(!offersFor("banking", new Date("2026-10-01T00:00:00Z")).some((offer) => offer.id === "first-insurance-100"));
  for (const offer of offers) {
    assert.match(offer.id, /^[a-z0-9-]+$/);
    for (const locale of ["en", "hi", "bn"] as const) assert.ok(offer.title[locale] && offer.ticker[locale] && offer.terms[locale], `${offer.id} ${locale}`);
    if (offer.categories !== "all") for (const category of offer.categories) assert.ok(category === "print" || serviceCatalog.some((group) => group.slug === category), `${offer.id} category ${category}`);
    // Insurance offers must never be described as a premium discount.
    if (offer.categories !== "all" && offer.categories.includes("insurance")) assert.match(offer.terms.en, /service charge/i);
  }
});

test("every category has visuals, and gallery images exist", () => {
  assert.deepEqual(categoryMeta.map((meta) => meta.slug).sort(), serviceCatalog.map((group) => group.slug).sort());
  for (const item of localGallery) assert.ok(existsSync(`public${item.src}`), item.src);
  for (const group of serviceCatalog) assert.ok(existsSync(`public${posterFor(group.slug)}`), group.slug);
});

test("no opening hours configured means no hours text (never 'closed all week')", () => {
  assert.deepEqual(summarizeHours([]), []);
  assert.deepEqual(summarizeHours([], "bn"), []);
});
