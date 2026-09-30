import type { MetadataRoute } from "next";
import { publicRoutes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";

/**
 * sitemap.xml built from the single list of public routes, with real "last changed" dates
 * (not today's date on every URL, which search engines learn to ignore), images and hreflang.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes().map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(`${route.lastModified}T00:00:00+05:30`),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    ...(route.images?.length ? { images: route.images.map((image) => absoluteUrl(image)) } : {}),
    ...(route.alternates ? { alternates: { languages: Object.fromEntries(Object.entries({ [route.path.startsWith("/hi") ? "hi-IN" : route.path.startsWith("/bn") ? "bn-IN" : "en-IN"]: route.path, ...route.alternates }).map(([language, path]) => [language, absoluteUrl(path)])) } } : {}),
  }));
}
