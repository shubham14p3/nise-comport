import Link from "next/link";
import { ArrowUpRight, Phone } from "lucide-react";
import SiteHeader from "@/components/site-header";
import { site } from "@/lib/site";

const shortcuts = [
  { href: "/services", label: "All services" },
  { href: "/services/pan-card-jamshedpur", label: "PAN card help" },
  { href: "/services/aadhaar-assistance-jamshedpur", label: "Aadhaar update help" },
  { href: "/services/jharkhand-certificates-jamshedpur", label: "Income, caste & residence certificates" },
  { href: "/print", label: "Online printing" },
  { href: "/blog", label: "Local guides" },
  { href: "/contact", label: "Contact & directions" },
];

/** Friendly 404 that still returns HTTP 404 (Next adds noindex automatically), so search engines drop dead URLs. */
export default function NotFound() {
  return <main className="content-page"><SiteHeader/>
    <section className="content-hero"><div className="container">
      <span className="eyebrow eyebrow-muted">404 · PAGE NOT FOUND</span>
      <h1>We couldn’t find<br/><em>that page.</em></h1>
      <p>The link may be old or mistyped. Try one of these, or call us on <a href={`tel:${site.phones.primary.e164}`}><Phone size={13}/> {site.phones.primary.display}</a>.</p>
      <div className="related-links">{shortcuts.map((item) => <Link key={item.href} href={item.href}>{item.label} <ArrowUpRight size={13}/></Link>)}</div>
      <p className="language-switch"><Link href="/hi" lang="hi">हिन्दी में देखें</Link></p>
    </div></section>
  </main>;
}
