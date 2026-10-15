import { articleDates, articles } from "@/lib/content";
import { escapeXml } from "@/lib/xml";
import { absoluteUrl, site } from "@/lib/site";

export const dynamic = "force-static";

/** RSS feed of the local guides, so feed readers and aggregators pick up new guides. */
export function GET() {
  const items = [...articles].sort((a, b) => articleDates(b).updatedAt.localeCompare(articleDates(a).updatedAt));
  const newest = items[0] ? articleDates(items[0]).updatedAt : "2026-09-30";
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${escapeXml(`${site.name} local guides`)}</title>
<link>${absoluteUrl("/blog")}</link>
<atom:link href="${absoluteUrl("/blog/feed.xml")}" rel="self" type="application/rss+xml"/>
<description>${escapeXml("Practical guides for PAN, Aadhaar, Jharkhand certificates, banking and more from our Telco, Jamshedpur service desk.")}</description>
<language>en-in</language>
<lastBuildDate>${new Date(`${newest}T00:00:00+05:30`).toUTCString()}</lastBuildDate>
${items.map((article) => { const { publishedAt } = articleDates(article); return `<item>
<title>${escapeXml(article.title)}</title>
<link>${absoluteUrl(`/blog/${article.slug}`)}</link>
<guid isPermaLink="true">${absoluteUrl(`/blog/${article.slug}`)}</guid>
<pubDate>${new Date(`${publishedAt}T00:00:00+05:30`).toUTCString()}</pubDate>
<category>${escapeXml(article.category)}</category>
<description>${escapeXml(article.excerpt)}</description>
</item>`; }).join("\n")}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
