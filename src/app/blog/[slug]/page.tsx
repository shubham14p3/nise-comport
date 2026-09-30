import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import FaqSection from "@/components/faq-section";
import JsonLd from "@/components/json-ld";
import { articleDates, articles, findArticle, GUIDE_AUTHOR, GUIDE_AUTHOR_ROLE } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { findService } from "@/lib/services";
import { site, whatsappLink } from "@/lib/site";
import { articleLd } from "@/lib/structured-data";

export const dynamicParams = false;
export function generateStaticParams() { return articles.map(item => ({ slug: item.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = findArticle(slug);
  if (!item) return {};
  const { publishedAt, updatedAt } = articleDates(item);
  return pageMetadata(item.seoTitle ?? item.title, item.excerpt, `/blog/${item.slug}`, { type: "article", publishedTime: publishedAt, modifiedTime: updatedAt, image: `/og/guides/${item.slug}.png`, imageAlt: item.title });
}

const formatDate = (value: string) => new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = findArticle(slug);
  if (!item) notFound();
  const { publishedAt, updatedAt } = articleDates(item);
  const service = findService(item.serviceSlug);
  const related = articles.filter((article) => article.slug !== item.slug && (article.serviceSlug === item.serviceSlug || article.category === item.category)).slice(0, 3);
  const path = `/blog/${item.slug}`;
  return <main className="content-page"><SiteHeader/>
    <JsonLd data={articleLd({ title: item.title, description: item.excerpt, path, image: item.image, publishedAt, updatedAt, author: GUIDE_AUTHOR, section: item.category })}/>
    <article className="container article-page">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Guides", path: "/blog" }, { name: item.title, path }]}/>
      <Link className="back-small" href="/blog"><ArrowLeft size={14}/> All local guides</Link>
      <span className="eyebrow eyebrow-muted">{item.category.toUpperCase()} · JAMSHEDPUR</span>
      <h1>{item.title}</h1>
      <p className="article-excerpt">{item.excerpt}</p>
      <p className="article-meta">By <b>{GUIDE_AUTHOR}</b>, {GUIDE_AUTHOR_ROLE} · Published <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>{updatedAt !== publishedAt ? <> · Updated <time dateTime={updatedAt}>{formatDate(updatedAt)}</time></> : null}</p>
      <Image className="article-cover" src={item.image} alt={item.imageAlt ?? item.title} width={1200} height={720} priority sizes="(max-width: 900px) 100vw, 800px"/>
      <div className="article-layout"><div>
        {item.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        {item.sections?.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section>)}
        <h2>Before you start</h2>
        <ul>{item.checklist.map(point => <li key={point}><Check size={16}/>{point}</li>)}</ul>
        {item.officialLinks?.length ? <><h2>Official sources</h2><ul className="official-link-list">{item.officialLinks.map((link) => <li key={link.href}><a href={link.href} target="_blank" rel="noopener noreferrer external">{link.label} <ArrowUpRight size={13}/></a></li>)}</ul></> : null}
        <p className="article-disclaimer">Requirements can change. The responsible government department, insurer, institution or service provider decides eligibility, fees, processing and final outcomes. NISE COMPORT is an independent CSC / Pragya Kendra service centre, not a government office.</p>
      </div><aside><strong>Need help with this?</strong><p>Talk to the NISE COMPORT team in Kharangajhar, Telco, Jamshedpur. Call {site.phones.primary.display}.</p>{service && <Link className="button button-green" href={`/services/${service.slug}`}>{service.title} <ArrowUpRight size={15}/></Link>}<a href={whatsappLink(`Hi NISE COMPORT, I read your guide "${item.title}" and need help.`)} className="article-whatsapp" target="_blank" rel="noopener noreferrer">Ask on WhatsApp</a><a href={site.mapsUrl} className="article-whatsapp" target="_blank" rel="noopener noreferrer">Get directions</a></aside></div>
    </article>
    {item.faqs?.length ? <FaqSection faqs={item.faqs}/> : null}
    {related.length ? <section className="container related-guides"><span className="eyebrow eyebrow-muted">KEEP READING</span><h2>Related guides</h2><div className="guide-teasers">{related.map((guide) => <article key={guide.slug}><span>{guide.category}</span><h3><Link href={`/blog/${guide.slug}`}>{guide.title}</Link></h3><p>{guide.excerpt}</p><Link className="arrow-link" href={`/blog/${guide.slug}`} aria-label={`Read: ${guide.title}`}>Read guide <ArrowRight size={14}/></Link></article>)}</div></section> : null}
  </main>;
}
