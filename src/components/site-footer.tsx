import Link from "next/link";
import { ArrowUpRight, Clock3, Mail, MapPin, Phone } from "lucide-react";
import BrandWordmark from "@/components/brand-wordmark";
import { CategoryIcon, WhatsAppIcon } from "@/components/icons";
import { categoryMeta } from "@/lib/categories";
import { summarizeHours } from "@/lib/hours";
import { serviceCatalog } from "@/lib/services";
import { site, whatsappLink } from "@/lib/site";

const YEAR = new Date().getFullYear();

const popularServices = [
  { href: "/services/pan-card", label: "PAN card apply & correction" },
  { href: "/services/aadhaar", label: "Aadhaar update help" },
  { href: "/services/income-caste-residence-certificate", label: "Income, caste & residence certificates" },
  { href: "/services/aeps-money-transfer", label: "AEPS & money transfer" },
  { href: "/services/bike-insurance", label: "Bike insurance" },
  { href: "/services/printing-scanning", label: "Online printing & photocopy" },
  { href: "/services/jeevan-pramaan", label: "Jeevan Pramaan life certificate" },
];

/**
 * Shared footer on every page: the same name, address and phone (NAP) as the Google Business
 * Profile, plus links to the most important pages so every page passes link value to them.
 */
export default function SiteFooter() {
  const hours = summarizeHours(site.openingHours);
  return <footer className="site-footer">
    <div className="footer-glow" aria-hidden="true"/>
    <div className="container footer-main">
      <div className="footer-brand">
        <Link className="brand brand--on-dark" href="/" aria-label={`${site.name} home`}><BrandWordmark/></Link>
        <p>Your neighbourhood CSC &amp; Pragya Kendra in Kharangajhar, Telco. Sarkari &amp; digital kaam, sorted with a human touch.</p>
        <div className="footer-cta">
          <a className="btn btn--wa btn--sm" href={whatsappLink("Hello NISE COMPORT, I need help with a service.")} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={17}/> WhatsApp</a>
          <a className="btn btn--glass btn--sm" href={`tel:${site.phones.primary.e164}`}><Phone size={16}/> Call</a>
        </div>
        <div className="footer-langs" aria-label="Languages">
          <Link href="/" hrefLang="en-IN" lang="en">English</Link>
          <Link href="/hi" hrefLang="hi-IN" lang="hi">हिन्दी</Link>
          <Link href="/bn" hrefLang="bn-IN" lang="bn">বাংলা</Link>
        </div>
      </div>
      <nav className="footer-col" aria-label="Service categories">
        <strong>Services</strong>
        {serviceCatalog.map((group) => {
          const meta = categoryMeta.find((item) => item.slug === group.slug);
          return <Link key={group.slug} href={`/services/${group.slug}`}>{meta && <span className={`mini-icon tone-${meta.tone}`}><CategoryIcon icon={meta.icon} size={14}/></span>}{meta?.short.en ?? group.title}</Link>;
        })}
      </nav>
      <nav className="footer-col" aria-label="Popular services">
        <strong>Popular</strong>
        {popularServices.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        <Link href="/services">All services →</Link>
      </nav>
      <nav className="footer-col" aria-label="Help and account">
        <strong>Help</strong>
        <Link href="/request">Start a request</Link>
        <Link href="/profile#requests">Track a request</Link>
        <Link href="/offers">Offers</Link>
        <Link href="/gallery">Gallery</Link>
        <Link href="/blog">Local guides</Link>
        <Link href="/pan">PAN help centre</Link>
        <Link href="/faq">FAQs</Link>
        <Link href="/about">About us</Link>
        <Link href="/team">Our team</Link>
        <Link href="/areas-we-serve">Areas we serve</Link>
      </nav>
      <div className="footer-col footer-visit">
        <strong>Visit us</strong>
        <address>
          <p><MapPin size={16} aria-hidden="true"/><span><b>{site.name}</b><br/>{site.address.lines.map((line) => <span key={line}>{line}<br/></span>)}</span></p>
        </address>
        <p><Clock3 size={16} aria-hidden="true"/><span>{hours.length ? hours.join(" · ") : "Mon–Sat · call before visiting for today’s timings"}</span></p>
        <p><Phone size={16} aria-hidden="true"/><span><a href={`tel:${site.phones.primary.e164}`}>{site.phones.primary.display}</a><br/><a href={`tel:${site.phones.secondary.e164}`}>{site.phones.secondary.display}</a><br/><a href={`tel:${site.phones.landline.e164}`}>{site.phones.landline.display}</a></span></p>
        <p><Mail size={16} aria-hidden="true"/><a href={`mailto:${site.email}`}>{site.email}</a></p>
        <a className="footer-directions" href={site.mapsUrl} target="_blank" rel="noopener noreferrer">Get directions <ArrowUpRight size={15} aria-hidden="true"/></a>
        {site.reviewUrl && <a className="footer-directions" href={site.reviewUrl} target="_blank" rel="noopener noreferrer">Review us on Google <ArrowUpRight size={15} aria-hidden="true"/></a>}
      </div>
    </div>
    <div className="container footer-bottom">
      <p>NISE COMPORT is an independent CSC / Pragya Kendra service centre, not a government office, bank or insurer. Official and third-party fees are separate from our service charge; final approvals rest with the relevant authority.</p>
      <div className="footer-bottom__row"><span>© {YEAR} {site.name}. All rights reserved.</span><span><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link></span></div>
    </div>
  </footer>;
}
