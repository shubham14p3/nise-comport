import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView, localArticle } from "@/components/views/blog-view";
import { articleDates, articles, findArticle } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { langFromParam, languageAlternates } from "@/lib/tr";

export const dynamicParams = false;
export function generateStaticParams() { return ["hi", "bn"].flatMap((lang) => articles.map((item) => ({ lang, slug: item.slug }))); }

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang: raw, slug } = await params;
  const lang = langFromParam(raw);
  const item = findArticle(slug);
  if (!lang || !item) return {};
  const local = localArticle(item, lang);
  const { publishedAt, updatedAt } = articleDates(item);
  return pageMetadata(local.seoTitle ?? local.title, local.excerpt, `/${lang}/blog/${item.slug}`, {
    type: "article", publishedTime: publishedAt, modifiedTime: updatedAt, image: `/og/guides/${item.slug}.png`, imageAlt: local.title,
    locale: lang === "hi" ? "hi-IN" : "bn-IN", languages: languageAlternates(`/blog/${item.slug}`),
  });
}

export default async function LocalizedArticlePage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: raw, slug } = await params;
  const lang = langFromParam(raw);
  if (!lang || !findArticle(slug)) notFound();
  return <ArticleView lang={lang} slug={slug}/>;
}
