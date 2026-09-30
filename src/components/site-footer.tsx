import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import BrandWordmark from "@/components/brand-wordmark";
import { summarizeHours } from "@/lib/hours";
import { site, whatsappLink } from "@/lib/site";

const YEAR = new Date().getFullYear();

const popularServices = [
  { href: "/services/pan-card-jamshedpur", label: "PAN card apply & correction" },
  { href: "/services/aadhaar-assistance-jamshedpur", label: "Aadhaar update help" },
  { href: "/services/jharkhand-certificates-jamshedpur", label: "Income, caste & residence certificates" },
  { href: "/services/voter-id-services-jamshedpur", label: "Voter ID services" },
  { href: "/services/banking-aeps-money-transfer", label: "AEPS & money transfer" },
  { href: "/services/printing-scanning-jamshedpur", label: "Online printing & photocopy" },
  { href: "/services/jeevan-pramaan-life-certificate-jamshedpur", label: "Jeevan Pramaan life certificate" },
  { href: "/services", label: "All services" },
];

/**
 * Shared footer on every page: the same name, address and phone (NAP) as the Google Business
 * Profile, plus links to the most important pages so every page passes link value to them.
 */
export default function SiteFooter() {
  const hours = summarizeHours(site.openingHours);
  return <footer className="site-footer">
    <div className="container footer-main">
      <div className="footer-brand">
        <Link className="brand brand-footer" href="/" aria-label={`${site.name} home`}><BrandWordmark/></Link>
        <p>Independent CSC / Pragya Kendra service centre.<br/>Serving Kharangajhar, Telco and all of Jamshedpur, Jharkhand.</p>
        <p className="footer-hours"><Clock3 size={13} aria-hidden="true"/> {hours.length ? hours.join(" · ") : "Mon–Sat · Call before visiting for today’s timings"}</p>
        <p className="footer-language"><Link href="/hi" hrefLang="hi-IN" lang="hi">हिन्दी में देखें</Link></p>
      </div>
      <nav className="footer-links" aria-label="Popular services">
        <strong>Popular services</strong>
        {popularServices.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
      </nav>
      <nav className="footer-links" aria-label="Help and account">
        <strong>Help &amp; account</strong>
        <Link href="/blog">Local guides</Link>
        <Link href="/pan">PAN help centre</Link>
        <Link href="/areas-we-serve">Areas we serve</Link>
        <Link href="/faq">FAQs</Link>
        <Link href="/about">About us</Link>
        <Link href="/team">Our team</Link>
        <Link href="/login">Sign in</Link>
        <Link href="/signup">Create an account</Link>
        <Link href="/profile?section=requests">Track a request</Link>
      </nav>
      <div className="footer-contact">
        <strong>Visit or get in touch</strong>
        <address>
          <p><MapPin size={15} aria-hidden="true"/><span><b>{site.name}</b><br/>{site.address.lines.map((line) => <span key={line}>{line}<br/></span>)}</span></p>
        </address>
        <a href={`tel:${site.phones.primary.e164}`}>{site.phones.primary.display}</a>
        <a href={`tel:${site.phones.secondary.e164}`}>{site.phones.secondary.display}</a>
        <a href={`tel:${site.phones.landline.e164}`}>{site.phones.landline.display}</a>
        <a href={`mailto:${site.email}`}>{site.email}</a>
        <a href={whatsappLink("Hello NISE COMPORT, I need help with a service.")} target="_blank" rel="noopener noreferrer">WhatsApp us <ArrowUpRight size={14} aria-hidden="true"/></a>
        <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer">Get directions <ArrowUpRight size={14} aria-hidden="true"/></a>
        {site.reviewUrl && <a href={site.reviewUrl} target="_blank" rel="noopener noreferrer">Review us on Google <ArrowUpRight size={14} aria-hidden="true"/></a>}
      </div>
    </div>
    <div className="container footer-bottom">
      <span>© {YEAR} {site.name}. All rights reserved.</span>
      <span>Private CSC / Pragya Kendra outlet – not a government office. Final approvals rest with the relevant authority.</span>
      <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link></div>
    </div>
  </footer>;
}
