import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, MapPin, Phone } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import FaqSection from "@/components/faq-section";
import JsonLd from "@/components/json-ld";
import OpenStatus from "@/components/open-status";
import SiteHeader from "@/components/site-header";
import { hindiHome, hindiServices } from "@/lib/hindi";
import { summarizeHours } from "@/lib/hours";
import { pageMetadata } from "@/lib/seo";
import { site, whatsappLink } from "@/lib/site";
import { itemListLd, webPageLd } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata(hindiHome.seoTitle, hindiHome.description, "/hi", { locale: "hi-IN", languages: { "en-IN": "/" }, image: "/og/hi.png", keywords: ["प्रज्ञा केंद्र जमशेदपुर", "सीएससी सेंटर टेल्को", "पैन कार्ड जमशेदपुर", "आधार अपडेट जमशेदपुर", "आय प्रमाण पत्र झारखंड", "जाति प्रमाण पत्र जमशेदपुर"] });

export default function HindiHomePage() {
  const hours = summarizeHours(site.openingHours, "hi");
  return <main className="content-page" lang="hi-IN"><SiteHeader/>
    <JsonLd data={[webPageLd({ name: hindiHome.h1, description: hindiHome.description, path: "/hi", inLanguage: "hi-IN" }), itemListLd("निसे कॉमपोर्ट सेवाएँ", hindiServices.map((service) => ({ name: service.title, path: `/hi/services/${service.slug}` })))]}/>
    <section className="content-hero"><div className="container">
      <Breadcrumbs label="ब्रेडक्रंब" items={[{ name: "होम", path: "/hi" }]}/>
      <span className="eyebrow eyebrow-muted">{hindiHome.eyebrow}</span>
      <h1>{hindiHome.h1}</h1>
      <p>{hindiHome.lead}</p>
      <div className="content-location"><MapPin size={15}/> {site.address.hindi}</div>
      <div className="service-hero-actions"><a className="button button-green" href={`tel:${site.phones.primary.e164}`}><Phone size={15}/> कॉल करें {site.phones.primary.display}</a><a className="button button-outline" href={whatsappLink("नमस्ते निसे कॉमपोर्ट, मुझे एक सेवा के बारे में जानकारी चाहिए।")} target="_blank" rel="noopener noreferrer">व्हाट्सऐप करें</a><a className="button button-outline" href={site.mapsUrl} target="_blank" rel="noopener noreferrer">रास्ता देखें</a></div>
      <p><OpenStatus rules={site.openingHours} language="hi"/> {hours.length ? hours.join(" · ") : "सोमवार–शनिवार · आने से पहले समय के लिए कॉल करें"}</p>
      <p className="language-switch"><Link href="/" hrefLang="en-IN" lang="en">Read this page in English →</Link></p>
    </div></section>
    <section className="container catalog-grid">{hindiServices.map((service, index) => <article className="catalog-card" key={service.slug}><span className="catalog-index">{String(index + 1).padStart(2, "0")}</span><h2><Link href={`/hi/services/${service.slug}`}>{service.title}</Link></h2><p>{service.description}</p><Link href={`/hi/services/${service.slug}`} aria-label={`${service.title} – और पढ़ें`}><ArrowRight size={17}/></Link></article>)}</section>
    <section className="container provider-note"><Check size={18}/><p>{hindiHome.trust.join(" · ")}. <Link href="/services">सभी सेवाएँ (अंग्रेज़ी में) <ArrowUpRight size={13}/></Link></p></section>
    <FaqSection faqs={hindiHome.faqs} eyebrow="अक्सर पूछे जाने वाले सवाल" title="आने से पहले जानें" lang="hi-IN"/>
  </main>;
}
