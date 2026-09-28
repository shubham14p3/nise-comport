import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, MapPin, ShieldCheck } from "lucide-react";
import { serviceCatalog, serviceDetails, findService, servicesInCategory } from "@/lib/services";
import { pageMetadata } from "@/lib/seo";
import { serviceEditorial } from "@/lib/service-editorial";
import RequestServiceForm from "@/components/request-service-form";

export function generateStaticParams() { return [...serviceCatalog, ...serviceDetails].map((service) => ({ slug: service.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = findService(slug);
  if (!service) return {};
  return { ...pageMetadata(`${service.title} in Jamshedpur`, `${service.description} Visit NISE COMPORT in Kharangajhar, Telco, Jamshedpur, Jharkhand.`, `/services/${service.slug}`), keywords: [...service.keywords, "NISE COMPORT", "Kharangajhar", "Telco", "Jharkhand"] };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = findService(slug);
  if (!service) notFound();
  const detail = "categorySlug" in service ? service : null;
  const editorial = detail ? serviceEditorial[detail.slug] : undefined;
  const children = detail ? [] : servicesInCategory(service.slug);
  const title = service.title;
  const faqs = detail ? [...detail.faqs, ...(editorial?.faqs ?? [])] : [{ question: "How do I get started?", answer: "Contact us or submit a service request. We will confirm availability, documents and service charges before proceeding." }, { question: "Who makes the final decision?", answer: "The relevant government authority, bank, insurer, institution or service provider controls eligibility, processing and final decisions." }];
  const structuredData = { "@context": "https://schema.org", "@type": "Service", name: title, serviceType: title, description: service.description, areaServed: ["Kharangajhar", "Telco", "Jamshedpur", "Jharkhand"], provider: { "@type": "LocalBusiness", name: "NISE COMPORT", url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://nisecomport.com", telephone: "+91-97712-19893" } };

  return <main className="content-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}/><SiteHeader/>
    <section className="content-hero detail-hero"><div className="container"><Link href="/services" className="back-small"><ArrowLeft size={14}/> All services</Link><div className="service-detail-hero-grid"><div><span className="eyebrow eyebrow-muted">LOCAL HELP · KHARANGAJHAR, JAMSHEDPUR</span><h1>{title}<br/><em>with clear local guidance.</em></h1><p>{service.description}</p>{editorial?.audience&&<p className="service-audience"><b>This page is for</b> {editorial.audience}</p>}<div className="content-location"><MapPin size={15}/> Shop No 3, Singh Building, Kharangajhar, Telco</div><div className="service-hero-actions"><a className="button button-green" href="#request-form">Ask about this service <ArrowRight size={15}/></a><a className="button button-outline" href={`https://wa.me/919771219893?text=${encodeURIComponent(`Hi NISE COMPORT, I need help with ${title}.`)}`} target="_blank" rel="noreferrer">WhatsApp enquiry</a></div></div>{editorial?.image&&<div className="service-detail-image"><Image src={editorial.image} alt={editorial.imageAlt} width={720} height={520} priority/></div>}</div></div></section>
    {detail ? <>
      <section className="container detail-body"><div><span className="eyebrow eyebrow-muted">SERVICE OVERVIEW</span><h2>How we can help</h2><p>We provide practical application and document assistance. We explain the steps and any service charge before you decide to proceed.</p><ul>{detail.highlights.map(item=><li key={item}><Check size={15}/>{item}</li>)}</ul><h2 className="service-content-heading">What to prepare</h2><p>Requirements can vary by applicant and service type. Use this as a starting checklist and confirm the latest instructions with the official provider.</p><ul>{detail.documents.map(item=><li key={item}><Check size={15}/>{item}</li>)}</ul></div><aside><span><MapPin size={17}/></span><h3>Start with a quick enquiry</h3><p>Tell us what you need. Our team will check availability and explain your next step.</p><a href={`https://wa.me/919771219893?text=${encodeURIComponent(`Hi NISE COMPORT, I need help with ${title}.`)}`} target="_blank" rel="noreferrer">Ask on WhatsApp <ArrowRight size={14}/></a></aside></section>
      {editorial?.beforeYouStart?.length ? <section className="container service-prep-section"><div className="service-prep-heading"><div><span className="eyebrow eyebrow-muted">BEFORE YOU VISIT</span><h2>A little preparation<br/><em>makes it easier.</em></h2></div><p>Bring only what is needed for your request. We will confirm current requirements before you travel or share sensitive information.</p></div><div className="service-prep-grid">{editorial.beforeYouStart.map((item,index)=><article key={item}><span>0{index+1}</span><p>{item}</p></article>)}</div></section>:null}
      <section className="container service-steps"><span className="eyebrow eyebrow-muted">A TRANSPARENT PROCESS</span><h2>What happens next</h2><div className="service-step-grid">{detail.steps.map((step,index)=><article key={step}><span>0{index+1}</span><p>{step}</p></article>)}</div></section>
      {editorial?.officialLinks?.length ? <section className="container official-links-section"><span className="eyebrow eyebrow-muted">CHECK THE LATEST REQUIREMENTS</span><h2>Official information</h2><p>Use the official source for current rules, documents, appointments and fees. NISE COMPORT can help you navigate the process.</p><div>{editorial.officialLinks.map(link=><a key={link.href} href={link.href} target="_blank" rel="noreferrer"><span>{link.label}</span><ArrowRight size={16}/></a>)}</div></section>:null}
    </> : <section className="container category-service-list"><div className="section-heading"><div><span className="eyebrow eyebrow-muted">EXPLORE THIS SERVICE AREA</span><h2>Choose the help<br/><em>you need.</em></h2></div><p>Each service has its own checklist and next steps. Select a page to learn more before sending an enquiry.</p></div><div className="catalog-grid">{children.map((item,index)=><article className="catalog-card" key={item.slug}><span className="catalog-index">{String(index+1).padStart(2,"0")}</span><h2>{item.title}</h2><p>{item.description}</p><div className="catalog-tags">{item.keywords.slice(0,2).map(word=><span key={word}>{word}</span>)}</div><Link href={`/services/${item.slug}`} aria-label={`Read about ${item.title}`}><ArrowRight size={17}/></Link></article>)}</div></section>}
    <section className="container service-faq"><span className="eyebrow eyebrow-muted">QUESTIONS CUSTOMERS ASK</span><h2>Frequently asked questions</h2><div>{faqs.map((faq)=><details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>
    <section className="container request-section-wrap" id="request-form"><RequestServiceForm slug={service.slug} title={title}/></section>
    <section className="container provider-note"><ShieldCheck size={18}/><p>NISE COMPORT is an independent service facilitator, not a government authority, bank or insurer. The applicant is responsible for accurate information. Approval, issuance, processing times and decisions rest with the relevant authority or provider. Our service charge is separate from any official or third-party fee.</p></section>
  </main>;
}
