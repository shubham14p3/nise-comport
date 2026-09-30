import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { articleDates, articles } from "../src/lib/content.ts";
import { hindiHome, hindiServices } from "../src/lib/hindi.ts";
import { legacyRedirects } from "../src/lib/legacy-redirects.ts";
import { panGuides } from "../src/lib/pan-content.ts";
import { publicRoutes } from "../src/lib/routes.ts";
import { serviceEditorial } from "../src/lib/service-editorial.ts";
import { allServiceItems, findService, publishedServiceDetails, serviceCatalog, serviceDetails, serviceSeoDescription, serviceSeoTitle } from "../src/lib/services.ts";
import { breadcrumbLd, faqLd, localBusinessLd, serializeJsonLd } from "../src/lib/structured-data.ts";
import { site } from "../src/lib/site.ts";

const BRAND = " | NISE COMPORT";
const routes = publicRoutes();
const routePaths = new Set(routes.map((route) => route.path));

test("every public URL is listed once", () => {
  assert.equal(routePaths.size, routes.length, "duplicate paths in routes.ts");
  assert.ok(routes.length >= 80, `expected 80+ indexable pages, got ${routes.length}`);
  for (const route of routes) {
    assert.match(route.path, /^\/[a-z0-9/-]*$/, route.path);
    assert.match(route.lastModified, /^\d{4}-\d{2}-\d{2}$/, route.path);
  }
});

test("slugs are unique across services and guides", () => {
  const serviceSlugs = allServiceItems.map((item) => item.slug);
  assert.equal(new Set(serviceSlugs).size, serviceSlugs.length);
  const guideSlugs = articles.map((item) => item.slug);
  assert.equal(new Set(guideSlugs).size, guideSlugs.length);
});

test("service search titles and descriptions fit in Google results", () => {
  const titles = new Set<string>();
  for (const service of allServiceItems) {
    const title = serviceSeoTitle(service) + BRAND;
    assert.ok(title.length <= 66, `${service.slug}: title is ${title.length} chars: ${title}`);
    assert.ok(!/jamshedpur.*jamshedpur/i.test(serviceSeoTitle(service)), `${service.slug}: repeats Jamshedpur`);
    assert.ok(!titles.has(title), `duplicate title ${title}`);
    titles.add(title);
    const description = serviceSeoDescription(service);
    assert.ok(description.length >= 70 && description.length <= 160, `${service.slug}: description is ${description.length} chars`);
  }
});

test("guide titles, dates and links are valid", () => {
  for (const article of articles) {
    const title = (article.seoTitle ?? article.title) + BRAND;
    assert.ok(title.length <= 70, `${article.slug}: title is ${title.length} chars`);
    assert.ok(article.excerpt.length >= 60 && article.excerpt.length <= 170, `${article.slug}: excerpt is ${article.excerpt.length} chars`);
    assert.ok(findService(article.serviceSlug), `${article.slug}: links to missing service ${article.serviceSlug}`);
    const { publishedAt, updatedAt } = articleDates(article);
    assert.ok(!Number.isNaN(Date.parse(publishedAt)) && updatedAt >= publishedAt, `${article.slug}: bad dates`);
    for (const link of article.officialLinks ?? []) assert.match(link.href, /^https:\/\//, `${article.slug}: ${link.href}`);
    assert.ok(existsSync(new URL(`../public${article.image}`, import.meta.url)), `${article.slug}: missing image ${article.image}`);
  }
});

test("social previews use a raster Open Graph endpoint", () => {
  assert.match(site.defaultOgImage, /^\/api\/og\?title=/);
  assert.ok(!site.defaultOgImage.endsWith(".svg"));
});

test("legacy redirects point at pages that exist", () => {
  const sources = new Set<string>();
  for (const redirect of legacyRedirects()) {
    assert.ok(!sources.has(redirect.source), `duplicate redirect ${redirect.source}`);
    sources.add(redirect.source);
    assert.ok(routePaths.has(redirect.destination), `${redirect.source} → ${redirect.destination} is not a public page`);
    assert.ok(!routePaths.has(redirect.source), `${redirect.source} is both a page and a redirect`);
  }
});

test("Hindi pages mirror existing English services and have reciprocal hreflang", () => {
  for (const service of hindiServices) {
    assert.ok(findService(service.slug), `Hindi page for missing service ${service.slug}`);
    assert.ok(/[ऀ-ॿ]/.test(service.title), `${service.slug}: title is not Hindi`);
    const english = routes.find((route) => route.path === `/services/${service.slug}`);
    const hindi = routes.find((route) => route.path === `/hi/services/${service.slug}`);
    assert.equal(english?.alternates?.["hi-IN"], `/hi/services/${service.slug}`);
    assert.equal(hindi?.alternates?.["en-IN"], `/services/${service.slug}`);
  }
  assert.ok(hindiHome.faqs.length >= 3);
});

test("service editorial, categories and PAN guides are consistent", () => {
  for (const slug of Object.keys(serviceEditorial)) assert.ok(serviceDetails.some((service) => service.slug === slug), `editorial for unknown service ${slug}`);
  for (const service of serviceDetails) assert.ok(serviceCatalog.some((group) => group.slug === service.categorySlug), `${service.slug}: unknown category`);
  for (const service of publishedServiceDetails) for (const link of service.officialLinks ?? []) assert.match(link.href, /^https:\/\//);
  assert.equal(new Set(panGuides.map((guide) => guide.slug)).size, panGuides.length);
});

test("no placeholder text reaches the site", () => {
  for (const file of ["../src/lib/services.ts", "../src/lib/content.ts", "../src/lib/hindi.ts", "../src/lib/site.ts", "../src/lib/areas.ts"]) {
    const text = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.ok(!/\{\{|TODO|lorem ipsum/i.test(text), `${file} contains placeholder text`);
  }
});

test("structured data is safe and well-formed", () => {
  const json = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
  assert.ok(!json.includes("</script>"));
  assert.deepEqual(JSON.parse(json), { name: "</script><script>alert(1)</script>" });
  const crumbs = breadcrumbLd([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]) as { itemListElement: { position: number; item: string }[] };
  assert.deepEqual(crumbs.itemListElement.map((item) => item.position), [1, 2]);
  assert.match(crumbs.itemListElement[1].item, /^https:\/\/.+\/services$/);
  assert.equal(faqLd([]), null);
  const business = localBusinessLd([{ name: "PAN", path: "/services/pan-card-jamshedpur" }]) as Record<string, unknown>;
  assert.equal((business.address as Record<string, string>).postalCode, "831004");
  assert.ok(!("openingHoursSpecification" in business) || Array.isArray(business.openingHoursSpecification));
});
