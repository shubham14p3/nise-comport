import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { articles } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
export const metadata: Metadata = pageMetadata("Jamshedpur Service Guides | NISE COMPORT", "Practical guides for PAN, Aadhaar, Jharkhand certificates, voter services, insurance, student forms and printing in Jamshedpur.", "/blog");
export default function BlogPage() { return <main className="content-page"><SiteHeader/><section className="content-hero"><div className="container"><span className="eyebrow eyebrow-muted">LOCAL KNOW-HOW, WITHOUT THE GUESSWORK</span><h1>Helpful guides for<br/><em>Jamshedpur residents.</em></h1><p>Prepare for common digital, government and document services with plain-language checklists from your Kharangajhar service desk.</p></div></section><section className="container editorial-grid">{articles.map(article=><article className="editorial-card" key={article.slug}><Link href={`/blog/${article.slug}`}><Image src={article.image} alt="" width={700} height={450}/></Link><div><span>{article.category} · Jamshedpur</span><h2><Link href={`/blog/${article.slug}`}>{article.title}</Link></h2><p>{article.excerpt}</p><Link className="arrow-link" href={`/blog/${article.slug}`}>Read the guide <ArrowUpRight size={15}/></Link></div></article>)}</section><section className="container provider-note"><p>Guides are general preparation information, not a promise of eligibility or approval. Always confirm current official requirements and fees.</p></section></main>; }
