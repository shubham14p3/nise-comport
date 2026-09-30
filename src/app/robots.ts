import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Crawl everything public. Private areas send "noindex" headers instead of being blocked here,
 * because a blocked URL can still be indexed from links (Google can't see the noindex).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
