import type { Metadata } from "next";
import { pageMetadata } from "./seo.ts";
import { languageAlternates } from "./tr.ts";

type Text = { hi: string; bn: string };

/** Metadata for a /hi or /bn content page: its own title, description, canonical, and links to the other languages. */
export function localizedMetadata(lang: "hi" | "bn", path: string, title: Text, description: Text, keywords?: { hi?: string[]; bn?: string[] }): Metadata {
  return pageMetadata(title[lang], description[lang], `/${lang}${path}`, {
    locale: lang === "hi" ? "hi-IN" : "bn-IN",
    languages: languageAlternates(path),
    keywords: keywords?.[lang],
  });
}
