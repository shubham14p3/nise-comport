import type { MetadataRoute } from "next";
import { publicRoutes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";
import { allServices } from "@/lib/site-content";
import { publishedServiceDetails } from "@/lib/services";

/**
 * sitemap.xml built from the single list of public routes, with real "last changed" dates
 * (not today's date on every URL, which search engines learn to ignore), images and hreflang.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Services added in the admin area are listed too; services hidden there are left out.
  const services = await allServices();
  const shown = new Set(services.map((service) => service.slug));
  const builtIn = new Set(publishedServiceDetails.map((service) => service.slug));
  const added = services.filter((service) => !builtIn.has(service.slug)).map((service) => ({ url: absoluteUrl(`/services/${service.slug}`), lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 }));
  return [...publicRoutes().filter((route) => { const slug = route.path.match(/^\/services\/([^/]+)$/)?.[1]; return !slug || !builtIn.has(slug) || shown.has(slug); }).map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(`${route.lastModified}T00:00:00+05:30`),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    ...(route.images?.length ? { images: route.images.map((image) => absoluteUrl(image)) } : {}),
    ...(route.alternates ? { alternates: { languages: Object.fromEntries(Object.entries({ [route.path.startsWith("/hi") ? "hi-IN" : route.path.startsWith("/bn") ? "bn-IN" : "en-IN"]: route.path, ...route.alternates }).map(([language, path]) => [language, absoluteUrl(path)])) } } : {}),
  })), ...added];
}
