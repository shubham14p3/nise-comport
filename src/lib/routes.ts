/**
 * Every public, indexable URL on the site, with the date its content last changed.
 * Used by sitemap.xml, llms.txt, the IndexNow ping script and the content tests, so a page
 * can't be added to one list and forgotten in another.
 *
 * When you edit a page's content, update its date here (or the guide's updatedAt).
 */
import { articleDates, articles } from "./content.ts";
import { bengaliServices } from "./bengali.ts";
import { localGallery } from "./gallery.ts";
import { hindiServices } from "./hindi.ts";
import { panGuides } from "./pan-content.ts";
import { publishedServiceDetails, serviceCatalog } from "./services.ts";

export type PublicRoute = {
  path: string;
  lastModified: string;
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  images?: string[];
  /** hreflang alternates, e.g. { "hi-IN": "/hi/services/pan-card-jamshedpur" } */
  alternates?: Record<string, string>;
};

/** Date the site structure/content was last reviewed. */
export const SITE_CONTENT_DATE = "2026-09-30";

const hindiSlugs = new Set(hindiServices.map((service) => service.slug));
const bengaliSlugs = new Set(bengaliServices.map((service) => service.slug));

/** hreflang set for a service in the other languages that have it. */
function serviceAlternates(slug: string, except: "en" | "hi" | "bn") {
  const alternates: Record<string, string> = {};
  if (except !== "en") alternates["en-IN"] = `/services/${slug}`;
  if (except !== "hi" && hindiSlugs.has(slug)) alternates["hi-IN"] = `/hi/services/${slug}`;
  if (except !== "bn" && bengaliSlugs.has(slug)) alternates["bn-IN"] = `/bn/services/${slug}`;
  return Object.keys(alternates).length ? { alternates } : {};
}

export function publicRoutes(): PublicRoute[] {
  const routes: PublicRoute[] = [
    { path: "/", lastModified: SITE_CONTENT_DATE, priority: 1, changeFrequency: "weekly", alternates: { "hi-IN": "/hi", "bn-IN": "/bn" }, images: ["/images/gallery/pan-card.webp", "/images/gallery/track-live.webp"] },
    { path: "/services", lastModified: SITE_CONTENT_DATE, priority: 0.9, changeFrequency: "weekly" },
    { path: "/contact", lastModified: SITE_CONTENT_DATE, priority: 0.8, changeFrequency: "monthly" },
    { path: "/areas-we-serve", lastModified: SITE_CONTENT_DATE, priority: 0.7, changeFrequency: "monthly" },
    { path: "/pan", lastModified: SITE_CONTENT_DATE, priority: 0.8, changeFrequency: "monthly" },
    { path: "/insurance", lastModified: SITE_CONTENT_DATE, priority: 0.9, changeFrequency: "monthly" },
    { path: "/print", lastModified: SITE_CONTENT_DATE, priority: 0.7, changeFrequency: "monthly" },
    { path: "/blog", lastModified: SITE_CONTENT_DATE, priority: 0.8, changeFrequency: "weekly" },
    { path: "/faq", lastModified: SITE_CONTENT_DATE, priority: 0.6, changeFrequency: "monthly" },
    { path: "/about", lastModified: SITE_CONTENT_DATE, priority: 0.6, changeFrequency: "yearly" },
    { path: "/team", lastModified: SITE_CONTENT_DATE, priority: 0.5, changeFrequency: "yearly" },
    { path: "/gallery", lastModified: SITE_CONTENT_DATE, priority: 0.5, changeFrequency: "monthly", images: localGallery.map((item) => item.src) },
    { path: "/offers", lastModified: SITE_CONTENT_DATE, priority: 0.5, changeFrequency: "weekly" },
    { path: "/social", lastModified: SITE_CONTENT_DATE, priority: 0.4, changeFrequency: "monthly" },
    { path: "/privacy", lastModified: SITE_CONTENT_DATE, priority: 0.2, changeFrequency: "yearly" },
    { path: "/terms", lastModified: SITE_CONTENT_DATE, priority: 0.2, changeFrequency: "yearly" },
    { path: "/hi", lastModified: SITE_CONTENT_DATE, priority: 0.8, changeFrequency: "monthly", alternates: { "en-IN": "/", "bn-IN": "/bn" } },
    { path: "/bn", lastModified: SITE_CONTENT_DATE, priority: 0.8, changeFrequency: "monthly", alternates: { "en-IN": "/", "hi-IN": "/hi" } },
  ];
  for (const group of serviceCatalog) routes.push({ path: `/services/${group.slug}`, lastModified: SITE_CONTENT_DATE, priority: 0.8, changeFrequency: "monthly" });
  for (const service of publishedServiceDetails) {
    routes.push({ path: `/services/${service.slug}`, lastModified: SITE_CONTENT_DATE, priority: 0.8, changeFrequency: "monthly", ...serviceAlternates(service.slug, "en") });
  }
  for (const service of hindiServices) routes.push({ path: `/hi/services/${service.slug}`, lastModified: SITE_CONTENT_DATE, priority: 0.7, changeFrequency: "monthly", ...serviceAlternates(service.slug, "hi") });
  for (const service of bengaliServices) routes.push({ path: `/bn/services/${service.slug}`, lastModified: SITE_CONTENT_DATE, priority: 0.7, changeFrequency: "monthly", ...serviceAlternates(service.slug, "bn") });
  for (const guide of panGuides) routes.push({ path: `/pan/${guide.slug}`, lastModified: SITE_CONTENT_DATE, priority: 0.7, changeFrequency: "monthly" });
  for (const article of articles) {
    const { updatedAt } = articleDates(article);
    routes.push({ path: `/blog/${article.slug}`, lastModified: updatedAt, priority: 0.7, changeFrequency: "monthly", images: [article.image] });
  }
  return routes;
}
