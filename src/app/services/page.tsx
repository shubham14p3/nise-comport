import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Banknote, BookOpenCheck, FileText, MapPin, Printer, ShieldCheck, Plane, Landmark } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import JsonLd from "@/components/json-ld";
import { pageMetadata } from "@/lib/seo";
import { serviceCatalog, servicesInCategory, publishedServiceDetails, serviceSeoTitle } from "@/lib/services";
import { site } from "@/lib/site";
import { itemListLd } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata(
  "All CSC & Digital Services in Jamshedpur",
  "PAN, Aadhaar guidance, Jharkhand certificates, AEPS banking, insurance, student forms, bill payments, printing and travel help at NISE COMPORT, Kharangajhar, Telco.",
  "/services",
);
const icons = [Banknote, Landmark, ShieldCheck, BookOpenCheck, Banknote, FileText, Printer, Plane];

export default function ServicesPage() {
  return <main className="content-page"><SiteHeader/>
    <section className="content-hero"><div className="container"><Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]}/><span className="eyebrow eyebrow-muted">ONE LOCAL DESK, MANY WAYS TO HELP</span><h1>CSC &amp; digital services<br/><em>in Telco, Jamshedpur.</em></h1><p>Browse {publishedServiceDetails.length} detailed service pages, check what to prepare and send an enquiry before you visit. Serving Kharangajhar, Telco, Jamshedpur and nearby Jharkhand communities.</p><div className="content-location"><MapPin size={15}/> {site.address.oneLine}</div></div></section>
    <section className="container catalog-grid">{serviceCatalog.map((service, index) => { const Icon = icons[index] ?? FileText; const children = servicesInCategory(service.slug); return <article className="catalog-card category-card" key={service.slug}><span className="service-icon"><Icon size={20}/></span><span className="catalog-index">{String(index + 1).padStart(2, "0")}</span><h2><Link href={`/services/${service.slug}`}>{service.title}</Link></h2><p>{service.description}</p><div className="category-card-links">{children.map(item => <Link key={item.slug} href={`/services/${item.slug}`}>{item.title}<ArrowUpRight size={13}/></Link>)}</div><div className="catalog-tags">{service.keywords.slice(0, 2).map(keyword => <span key={keyword}>{keyword}</span>)}</div><Link href={`/services/${service.slug}`} aria-label={`View all ${service.title}`}><ArrowUpRight size={17}/></Link></article>; })}</section>
    <section className="container provider-note"><ShieldCheck size={18}/><p><b>Independent service facilitator.</b> We help customers use official and partner services; we do not make government, banking or insurance decisions. Official and third-party fees are separate from our service charge. <Link href="/hi">हिन्दी में सेवाएँ देखें</Link></p></section>
    <JsonLd data={itemListLd("NISE COMPORT services", publishedServiceDetails.map((service) => ({ name: serviceSeoTitle(service), path: `/services/${service.slug}` })))}/>
  </main>;
}
