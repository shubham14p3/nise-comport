import { isAppPath, type Locale } from "./i18n.ts";
import { translatedSlugs } from "./translated-slugs.ts";
import { CATEGORY_TEXT } from "./translations/categories.ts";

/**
 * Inline translations. `const t = tr(lc); t("Hello", "नमस्ते", "নমস্কার")` returns the text for the
 * page language, so the English, Hindi and Bengali wording of a sentence sit side by side.
 */
export function tr(locale: Locale) {
  return (en: string, hi: string, bn: string) => (locale === "hi" ? hi : locale === "bn" ? bn : en);
}

/** Pick one of three values (for lists and objects) by language. */
export function pick<T>(locale: Locale, values: { en: T; hi: T; bn: T }): T {
  return values[locale];
}

/** Paths that are not language-prefixed: app screens, APIs and files. */
function isUnprefixed(path: string) {
  return isAppPath(path) || /^\/(api|media|images|_next|desk|mail-x7q2|pay|review|track|offers)(\/|$)/.test(path);
}

/**
 * Content pages that exist in /hi and /bn. Add a page here when its translation is live; links and the
 * language menu send visitors to the translated page only when it is listed (otherwise they stay on English).
 */
export const LOCALIZED_PAGES: string[] = ["/", "/services", "/about", "/faq", "/pricing", "/contact", "/team", "/areas-we-serve", "/insurance", "/terms", "/privacy", "/refund-policy"];
export const LOCALIZED_SECTIONS: string[] = ["/blog"];

export function hasTranslation(locale: Locale, path: string) {
  if (locale === "en") return true;
  if (LOCALIZED_PAGES.includes(path)) return true;
  const service = /^\/services\/([^/]+)$/.exec(path)?.[1];
  if (service) return translatedSlugs[locale].includes(service) || service in CATEGORY_TEXT;
  return LOCALIZED_SECTIONS.some((section) => path === section || path.startsWith(`${section}/`));
}

/** Link target in the page language: /about → /hi/about for Hindi; app screens and external links are left alone. */
export function lp(locale: Locale, href: string) {
  if (locale === "en" || !href.startsWith("/") || href.startsWith("//")) return href;
  const path = href.split(/[?#]/)[0] || "/";
  if (isUnprefixed(path) || !hasTranslation(locale, path)) return href;
  if (path === "/") return `/${locale}${href.slice(1)}`;
  return `/${locale}${href}`;
}

export const LANG_PARAMS = [{ lang: "hi" }, { lang: "bn" }];
export function langFromParam(value: string): "hi" | "bn" | null {
  return value === "hi" || value === "bn" ? value : null;
}

/** Language alternates for a content page path, for hreflang tags. */
export function languageAlternates(path: string) {
  const suffix = path === "/" ? "" : path;
  return { "en-IN": path, "hi-IN": `/hi${suffix}`, "bn-IN": `/bn${suffix}` } as const;
}
