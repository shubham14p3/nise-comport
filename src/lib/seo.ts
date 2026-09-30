import type { Metadata } from "next";
import { absoluteUrl, site } from "./site.ts";

type PageMetaOptions = {
  /** Share image path (1200x630 PNG/JPG). SVG does not work on WhatsApp, Facebook or LinkedIn. */
  image?: string;
  imageAlt?: string;
  /** Private or thin pages: keep out of search results but let crawlers follow links. */
  noindex?: boolean;
  /** Language alternates, e.g. { "hi-IN": "/hi/services/pan-card-jamshedpur" }. The current page is added automatically. */
  languages?: Record<string, string>;
  /** Language of this page. Defaults to en-IN. */
  locale?: "en-IN" | "hi-IN" | "bn-IN";
  keywords?: string[];
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

/**
 * Builds consistent metadata: title, description, canonical URL, hreflang, Open Graph and Twitter.
 * Titles that already contain the brand are used as-is; others get " | NISE COMPORT" from the layout template.
 */
export function pageMetadata(title: string, description: string, path: string, options: PageMetaOptions = {}): Metadata {
  const brandedTitle = title.includes(site.name) ? title : `${title} | ${site.name}`;
  const locale = options.locale ?? "en-IN";
  const image = options.image?.startsWith("http") ? options.image : `/api/og?title=${encodeURIComponent(title)}&locale=${encodeURIComponent(locale)}`;
  const languages = options.languages ? { [locale]: path, ...options.languages } : undefined;
  if (languages) languages["x-default"] = locale === "en-IN" ? path : options.languages?.["en-IN"] ?? path;
  const openGraph = {
    locale: locale.replace("-", "_"),
    ...(languages ? { alternateLocale: Object.keys(languages).filter((key) => key !== locale && key !== "x-default").map((key) => key.replace("-", "_")) } : {}),
    siteName: site.name,
    title: brandedTitle,
    description,
    url: absoluteUrl(path),
    images: [{ url: image, width: 1200, height: 630, alt: options.imageAlt ?? `${site.name} – ${title}` }],
  };
  return {
    title: title.includes(site.name) ? { absolute: title } : title,
    description,
    ...(options.keywords?.length ? { keywords: options.keywords } : {}),
    alternates: { canonical: path, ...(languages ? { languages } : {}) },
    openGraph: options.type === "article"
      ? { ...openGraph, type: "article", ...(options.publishedTime ? { publishedTime: options.publishedTime, modifiedTime: options.modifiedTime ?? options.publishedTime } : {}) }
      : { ...openGraph, type: "website" },
    twitter: { card: "summary_large_image", title: brandedTitle, description, images: [image] },
    ...(options.noindex ? { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } } : {}),
  };
}

/** Metadata for private pages (sign-in, profile, admin): never indexed, never followed. */
export function privateMetadata(title: string, description = "Private NISE COMPORT account page."): Metadata {
  return { title, description, robots: { index: false, follow: false, googleBot: { index: false, follow: false } } };
}
