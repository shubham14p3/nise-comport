import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import JsonLd from "@/components/json-ld";
import { articleDates, articles } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { itemListLd } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata(
  "Local Guides: PAN, Aadhaar, Certificates & More",
  "Plain-language guides for Jamshedpur residents: PAN, Aadhaar updates, Jharkhand certificates, voter ID, scholarships, driving licence, AEPS safety and printing.",
  "/blog",
);

const byNewest = [...articles].sort((a, b) => articleDates(b).updatedAt.localeCompare(articleDates(a).updatedAt));
const categories = [...new Set(byNewest.map((article) => article.category))];

export default function BlogPage() {
  return <main className="content-page"><SiteHeader/>
    <section className="content-hero"><div className="container"><Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Guides", path: "/blog" }]}/><span className="eyebrow eyebrow-muted">LOCAL KNOW-HOW, WITHOUT THE GUESSWORK</span><h1>Helpful guides for<br/><em>Jamshedpur residents.</em></h1><p>Prepare for common digital, government and document services with plain-language checklists from your Kharangajhar service desk. Each guide links to the official source.</p><nav className="guide-categories" aria-label="Guide topics">{categories.map((category) => <a key={category} href={`#${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{category}</a>)}</nav></div></section>
    {categories.map((category) => <section className="container guide-category" key={category} id={category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}>
      <h2>{category}</h2>
      <div className="editorial-grid">{byNewest.filter((article) => article.category === category).map(article => { const { updatedAt } = articleDates(article); return <article className="editorial-card" key={article.slug}><Link href={`/blog/${article.slug}`} tabIndex={-1} aria-hidden="true"><Image src={article.image} alt="" width={700} height={450} sizes="(max-width: 700px) 100vw, 33vw"/></Link><div><span>{article.category} · Updated <time dateTime={updatedAt}>{new Date(`${updatedAt}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</time></span><h3><Link href={`/blog/${article.slug}`}>{article.title}</Link></h3><p>{article.excerpt}</p><Link className="arrow-link" href={`/blog/${article.slug}`} aria-label={`Read the guide: ${article.title}`}>Read the guide <ArrowUpRight size={15}/></Link></div></article>; })}</div>
    </section>)}
    <section className="container provider-note"><p>Guides are general preparation information, not a promise of eligibility or approval. Always confirm current official requirements and fees. <a href="/blog/feed.xml" type="application/rss+xml">RSS feed</a></p></section>
    <JsonLd data={itemListLd("NISE COMPORT local guides", byNewest.map((article) => ({ name: article.title, path: `/blog/${article.slug}` })))}/>
  </main>;
}
