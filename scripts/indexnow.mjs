#!/usr/bin/env node
/**
 * Tells IndexNow search engines (Bing, Yandex, Seznam, Naver…) that pages changed.
 * Usage (after deploying):  INDEXNOW_KEY=your-key SITE_URL=https://www.nisecomport.com npm run seo:indexnow
 * The same INDEXNOW_KEY must be set on the server so /indexnow-key.txt returns it.
 */
const site = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://www.nisecomport.com").replace(/\/$/, "");
const key = process.env.INDEXNOW_KEY;
if (!key) { console.error("Set INDEXNOW_KEY first."); process.exit(1); }

const sitemap = await fetch(`${site}/sitemap.xml`).then((response) => { if (!response.ok) throw new Error(`sitemap.xml returned ${response.status}`); return response.text(); });
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).filter((url) => url.startsWith(site));
const keyCheck = await fetch(`${site}/indexnow-key.txt`).then((response) => response.text()).catch(() => "");
if (keyCheck.trim() !== key) { console.error(`${site}/indexnow-key.txt does not return INDEXNOW_KEY. Set it on the server and redeploy.`); process.exit(1); }

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/indexnow-key.txt`, urlList: urls.slice(0, 10000) }),
});
console.log(`IndexNow: submitted ${urls.length} URLs → HTTP ${response.status}`);
if (response.status >= 400) process.exit(1);
