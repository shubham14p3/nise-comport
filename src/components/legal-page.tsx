import { Fragment } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SiteHeader from "@/components/site-header";
import Breadcrumbs from "@/components/breadcrumbs";
import type { LegalBlock, LegalInline } from "@/lib/legal-markup";
import { loadLegalPage, type LegalSlug } from "@/lib/legal-pages";

function Inline({ parts }: { parts: LegalInline[] }) {
  return <>{parts.map((part, index) => {
    const content = part.bold ? <b>{part.text}</b> : part.text;
    if (!part.href) return <Fragment key={index}>{content}</Fragment>;
    return part.href.startsWith("/") ? <Link key={index} href={part.href}>{content}</Link> : <a key={index} href={part.href} rel="noopener noreferrer">{content}</a>;
  })}</>;
}

function Blocks({ blocks }: { blocks: LegalBlock[] }) {
  return <>{blocks.map((block, index) => {
    if (block.kind === "h3") return <h3 key={index}>{block.text}</h3>;
    if (block.kind === "ul") return <ul key={index}>{block.items.map((item, i) => <li key={i}><span><Inline parts={item}/></span></li>)}</ul>;
    return <p key={index}>{block.lines.map((line, i) => <Fragment key={i}>{i > 0 && <br/>}<Inline parts={line}/></Fragment>)}</p>;
  })}</>;
}

/** Terms, Privacy and Refund pages. The text comes from Admin → Legal pages (or the built-in text). */
export default async function LegalPage({ slug, path, crumb, eyebrow, title, em }: { slug: LegalSlug; path: string; crumb: string; eyebrow: string; title: string; em: string }) {
  const { doc, updated } = await loadLegalPage(slug);
  return <main className="content-page"><SiteHeader/>
    <article className="container legal-content">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: crumb, path }]}/>
      <Link href="/" className="back-small"><ArrowLeft size={14}/> Home</Link>
      <span className="eyebrow eyebrow-muted">{eyebrow}</span>
      <h1>{title} <em>{em}</em></h1>
      <p className="legal-updated">Effective date: {updated}</p>
      {doc.intro.length > 0 && <div className="legal-intro"><Blocks blocks={doc.intro}/></div>}
      <nav className="legal-toc" aria-label="Contents"><b>In this policy</b><ol>{doc.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ol></nav>
      {doc.sections.map((section, index) => <section key={section.id} id={section.id} className="legal-section"><h2>{index + 1}. {section.title}</h2><Blocks blocks={section.blocks}/></section>)}
      <p className="legal-updated">Read together with our <Link href="/terms">Terms and Conditions</Link>, <Link href="/privacy">Privacy Policy</Link>, <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link> and <Link href="/pricing">Pricing</Link>.</p>
    </article>
  </main>;
}
