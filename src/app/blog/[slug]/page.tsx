import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/views/blog-view";
import { articleDates, articles, findArticle } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { languageAlternates } from "@/lib/tr";

export const dynamicParams = false;
export function generateStaticParams() { return articles.map(item => ({ slug: item.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = findArticle(slug);
  if (!item) return {};
  const { publishedAt, updatedAt } = articleDates(item);
  return pageMetadata(item.seoTitle ?? item.title, item.excerpt, `/blog/${item.slug}`, { type: "article", publishedTime: publishedAt, modifiedTime: updatedAt, image: `/og/guides/${item.slug}.png`, imageAlt: item.title, languages: languageAlternates(`/blog/${item.slug}`) });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!findArticle(slug)) notFound();
  return <ArticleView lang="en" slug={slug}/>;
}
