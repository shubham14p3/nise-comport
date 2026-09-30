#!/usr/bin/env node
/**
 * Post-deploy SEO smoke test.
 * Usage: SITE_URL=http://localhost:3000 npm run seo:check
 */
const site = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const canonicalBase = (process.env.CANONICAL_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://www.nisecomport.com").replace(/\/$/, "");
let failures = 0;
const fail = (url, message) => { failures++; console.log(`✗ ${url}: ${message}`); };

const sitemap = await fetch(`${site}/sitemap.xml`).then((response) => response.text());
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
console.log(`Checking ${paths.length} public pages on ${site}…`);

const titles = new Map();
for (const path of paths) {
  const response = await fetch(site + path, { redirect: "manual" });
  const html = await response.text();
  if (response.status !== 200) { fail(path, `HTTP ${response.status}`); continue; }

  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "";
  const description = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? "";
  const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1] ?? "";
  const h1s = (html.match(/<h1[\s>]/g) ?? []).length;

  if (!title) fail(path, "missing <title>");
  else if (title.length > 70) fail(path, `title is ${title.length} characters`);

  if (titles.has(title)) fail(path, `duplicate title (also on ${titles.get(title)})`);
  else titles.set(title, path);

  if (!description) fail(path, "missing meta description");
  else if (description.length > 170) fail(path, `description is ${description.length} characters`);

  if (canonical !== canonicalBase + (path === "/" ? "" : path) && canonical !== `${canonicalBase}${path}`) {
    fail(path, `canonical is "${canonical}"`);
  }

  if (h1s !== 1) fail(path, `${h1s} <h1> elements`);
  if (/<meta name="robots" content="[^"]*noindex/.test(html)) fail(path, "page is noindex but listed in the sitemap");

  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); } catch { fail(path, "invalid JSON-LD"); }
  }
}

for (const path of ["/login", "/signup", "/forgot-password", "/profile", "/admin", "/pan/request"]) {
  const response = await fetch(site + path, { redirect: "manual" });
  const header = response.headers.get("x-robots-tag") ?? "";
  const html = response.status === 200 ? await response.text() : "";
  if (!header.includes("noindex") && !/<meta name="robots" content="[^"]*noindex/.test(html)) {
    fail(path, "private page is indexable");
  }
}

const notFound = await fetch(`${site}/this-page-does-not-exist-${Date.now()}`);
if (notFound.status !== 404) fail("/404", `unknown URLs return ${notFound.status}, not 404`);

console.log(failures ? `\n${failures} problem(s) found.` : "\nAll SEO checks passed.");
process.exit(failures ? 1 : 0);
