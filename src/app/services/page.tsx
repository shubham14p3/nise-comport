import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Banknote, BookOpenCheck, FileText, MapPin, Printer, ShieldCheck, Plane, Landmark } from "lucide-react";
import BrandWordmark from "@/components/brand-wordmark";
import { pageMetadata } from "@/lib/seo";
import { serviceCatalog, servicesInCategory } from "@/lib/services";

export const metadata: Metadata = pageMetadata("Digital & CSC Services in Jamshedpur", "Browse local PAN, Aadhaar guidance, banking, insurance, Jharkhand certificates, education forms, printing, travel and digital services in Kharangajhar, Jamshedpur.", "/services");
const icons = [Landmark, Banknote, ShieldCheck, BookOpenCheck, Banknote, FileText, Printer, Plane];

export default function ServicesPage() {
  return <main className="content-page"><header className="content-nav"><div className="container content-nav-inner"><Link className="brand" href="/"><BrandWordmark/></Link><div><Link href="/login">Sign in</Link><Link className="button button-dark" href="/print">Print &amp; scan <Printer size={14}/></Link></div></div></header>
    <section className="content-hero"><div className="container"><span className="eyebrow eyebrow-muted">ONE LOCAL DESK, MANY WAYS TO HELP</span><h1>Local digital services<br/><em>with a human touch.</em></h1><p>Browse detailed service pages, check what to prepare and send an enquiry before you visit. Serving Kharangajhar, Telco, Jamshedpur and nearby Jharkhand communities.</p><div className="content-location"><MapPin size={15}/> Shop No 3, Ground Floor, Singh Building, Hanuman Mandir Road, Kharangajhar, Telco, Jamshedpur</div></div></section>
    <section className="container catalog-grid">{serviceCatalog.map((service, index) => { const Icon = icons[index]; const children = servicesInCategory(service.slug); return <article className="catalog-card category-card" key={service.slug}><span className="service-icon"><Icon size={20}/></span><span className="catalog-index">0{index + 1}</span><h2>{service.title}</h2><p>{service.description}</p><div className="category-card-links">{children.map(item => <Link key={item.slug} href={`/services/${item.slug}`}>{item.title}<ArrowUpRight size={13}/></Link>)}</div><div className="catalog-tags">{service.keywords.slice(0, 2).map(keyword => <span key={keyword}>{keyword}</span>)}</div><Link href={`/services/${service.slug}`} aria-label={`View all ${service.title}`}><ArrowUpRight size={17}/></Link></article>; })}</section>
    <section className="container provider-note"><ShieldCheck size={18}/><p><b>Independent service facilitator.</b> We help customers use official and partner services; we do not make government, banking or insurance decisions. Official and third-party fees are separate from our service charge.</p></section>
  </main>;
}
