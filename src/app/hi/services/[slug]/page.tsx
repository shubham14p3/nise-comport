import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, MapPin, Phone, ShieldCheck } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import FaqSection from "@/components/faq-section";
import JsonLd from "@/components/json-ld";
import SiteHeader from "@/components/site-header";
import { findHindiService, hindiServices } from "@/lib/hindi";
import { pageMetadata } from "@/lib/seo";
import { findService } from "@/lib/services";
import { site, whatsappLink } from "@/lib/site";
import { serviceLd } from "@/lib/structured-data";

export const dynamicParams = false;
export function generateStaticParams() { return hindiServices.filter((service) => findService(service.slug)).map((service) => ({ slug: service.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = findHindiService(slug);
  if (!service || !findService(slug)) return {};
  return pageMetadata(service.seoTitle, service.description, `/hi/services/${service.slug}`, { locale: "hi-IN", languages: { "en-IN": `/services/${service.slug}` }, image: `/og/hi/services/${service.slug}.png` });
}

export default async function HindiServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = findHindiService(slug);
  const english = findService(slug);
  if (!service || !english) notFound();
  const path = `/hi/services/${service.slug}`;
  const enquiry = whatsappLink(`नमस्ते निसे कॉमपोर्ट, मुझे "${service.title}" के बारे में मदद चाहिए।`);
  return <main className="content-page" lang="hi-IN"><SiteHeader/>
    <JsonLd data={serviceLd({ name: service.title, description: service.description, path, inLanguage: "hi-IN" })}/>
    <section className="content-hero detail-hero"><div className="container">
      <Breadcrumbs label="ब्रेडक्रंब" items={[{ name: "होम", path: "/hi" }, { name: service.title, path }]}/>
      <span className="eyebrow eyebrow-muted">स्थानीय मदद · खरंगाझार, टेल्को, जमशेदपुर</span>
      <h1>{service.title}</h1>
      <p>{service.description}</p>
      <div className="content-location"><MapPin size={15}/> {site.address.hindi}</div>
      <div className="service-hero-actions"><a className="button button-green" href={`tel:${site.phones.primary.e164}`}><Phone size={15}/> कॉल करें</a><a className="button button-outline" href={enquiry} target="_blank" rel="noopener noreferrer">व्हाट्सऐप पर पूछें</a><Link className="button button-outline" href={`/services/${service.slug}#request-form`}>ऑनलाइन अनुरोध भेजें</Link></div>
      <p className="language-switch"><Link href={`/services/${service.slug}`} hrefLang="en-IN" lang="en">Read this page in English →</Link></p>
    </div></section>
    <section className="container detail-body"><div>
      <span className="eyebrow eyebrow-muted">हम कैसे मदद करते हैं</span><h2>सेवा की जानकारी</h2>
      <ul>{service.highlights.map((item) => <li key={item}><Check size={15}/>{item}</li>)}</ul>
      <h2 className="service-content-heading">साथ लाने वाले दस्तावेज़</h2>
      <p>ज़रूरी दस्तावेज़ आवेदक और सेवा के अनुसार बदल सकते हैं। आधिकारिक वेबसाइट पर नवीनतम सूची ज़रूर देखें।</p>
      <ul>{service.documents.map((item) => <li key={item}><Check size={15}/>{item}</li>)}</ul>
    </div><aside><span><MapPin size={17}/></span><h3>पहले पूछ लें</h3><p>आने से पहले कॉल या व्हाट्सऐप करें, ताकि एक ही बार में काम पूरा हो।</p><a href={enquiry} target="_blank" rel="noopener noreferrer">व्हाट्सऐप <ArrowRight size={14}/></a><a href={site.mapsUrl} target="_blank" rel="noopener noreferrer">रास्ता देखें <ArrowRight size={14}/></a></aside></section>
    <section className="container service-steps"><span className="eyebrow eyebrow-muted">प्रक्रिया</span><h2>आगे क्या होगा</h2><ol className="service-step-grid">{service.steps.map((step, index) => <li key={step}><span>0{index + 1}</span><p>{step}</p></li>)}</ol></section>
    <FaqSection faqs={service.faqs} eyebrow="सवाल-जवाब" title="अक्सर पूछे जाने वाले सवाल" lang="hi-IN"/>
    <section className="container provider-note"><ShieldCheck size={18}/><p>निसे कॉमपोर्ट एक स्वतंत्र CSC / प्रज्ञा केंद्र है, सरकारी कार्यालय नहीं। आवेदन पर अंतिम निर्णय संबंधित विभाग या संस्था का होता है। सरकारी शुल्क और हमारा सेवा शुल्क अलग-अलग हैं।</p></section>
  </main>;
}
