import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SiteHeader from "@/components/site-header";
import Breadcrumbs from "@/components/breadcrumbs";

export type LegalSection = { id: string; title: string; body: ReactNode };

/** Shared layout for Terms, Privacy and Refund pages: contents list, numbered sections, sister-policy links. */
export default function LegalPage({ path, crumb, eyebrow, title, em, updated, intro, sections }: {
  path: string; crumb: string; eyebrow: string; title: string; em: string; updated: string; intro: ReactNode; sections: LegalSection[];
}) {
  return <main className="content-page"><SiteHeader/>
    <article className="container legal-content">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: crumb, path }]}/>
      <Link href="/" className="back-small"><ArrowLeft size={14}/> Home</Link>
      <span className="eyebrow eyebrow-muted">{eyebrow}</span>
      <h1>{title} <em>{em}</em></h1>
      <p className="legal-updated">Effective date: {updated}</p>
      <div className="legal-intro">{intro}</div>
      <nav className="legal-toc" aria-label="Contents"><b>In this policy</b><ol>{sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ol></nav>
      {sections.map((section, index) => <section key={section.id} id={section.id} className="legal-section"><h2>{index + 1}. {section.title}</h2>{section.body}</section>)}
      <p className="legal-updated">Read together with our <Link href="/terms">Terms and Conditions</Link>, <Link href="/privacy">Privacy Policy</Link>, <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link> and <Link href="/pricing">Pricing</Link>.</p>
    </article>
  </main>;
}
