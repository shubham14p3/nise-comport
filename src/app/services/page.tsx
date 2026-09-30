import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import JsonLd from "@/components/json-ld";
import ServiceBrowser from "@/components/service-browser";
import { pageMetadata } from "@/lib/seo";
import { publishedServiceDetails, requestHrefFor, serviceCatalog, serviceSeoTitle, shortServiceName } from "@/lib/services";
import { site } from "@/lib/site";
import { itemListLd } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata(
  "All CSC & Digital Services in Jamshedpur",
  "PAN, Aadhaar guidance, Jharkhand certificates, AEPS banking, insurance, student forms, bill payments, printing and travel help at NISE COMPORT, Kharangajhar, Telco.",
  "/services",
  { languages: { "hi-IN": "/hi", "bn-IN": "/bn" } },
);

export default function ServicesPage() {
  const services = publishedServiceDetails.map((service) => ({
    slug: service.slug, title: service.title, name: shortServiceName(service.title), description: service.description,
    category: service.categorySlug, keywords: service.keywords, requestHref: requestHrefFor(service.slug),
  }));
  return <main className="page"><SiteHeader/>
    <section className="page-hero page-hero--compact">
      <div className="page-hero__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/></div>
      <div className="container">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]}/>
        <h1>All services, <span className="grad-text">one counter.</span></h1>
        <p className="page-hero__lead">{publishedServiceDetails.length} services across {serviceCatalog.length} categories in Kharangajhar, Telco, Jamshedpur. Search, pick one and start a request in 4 quick steps.</p>
        <p className="page-hero__meta"><MapPin size={16}/> {site.address.oneLine}</p>
      </div>
    </section>
    <section className="section section--flush">
      <div className="container"><ServiceBrowser services={services}/></div>
    </section>
    <section className="section section--tint">
      <div className="container">
        <div className="section-head section-head--left"><span className="eyebrow">BROWSE BY CATEGORY</span><h2>Category guides</h2></div>
        <div className="link-cloud">{serviceCatalog.map((group) => <Link key={group.slug} href={`/services/${group.slug}`}>{group.title}<ArrowRight size={16}/></Link>)}</div>
        <div className="note-card"><ShieldCheck size={22}/><p><b>Independent service facilitator.</b> We help customers use official and partner services; we do not make government, banking or insurance decisions. Official and third-party fees are separate from our service charge. <Link href="/hi">हिन्दी में सेवाएँ</Link> · <Link href="/bn">বাংলায় পরিষেবা</Link></p></div>
      </div>
    </section>
    <JsonLd data={itemListLd("NISE COMPORT services", publishedServiceDetails.map((service) => ({ name: serviceSeoTitle(service), path: `/services/${service.slug}` })))}/>
  </main>;
}
