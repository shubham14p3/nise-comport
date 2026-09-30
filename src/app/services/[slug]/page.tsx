import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, MapPin, Phone, ShieldCheck } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import FaqSection from "@/components/faq-section";
import JsonLd from "@/components/json-ld";
import RequestServiceForm from "@/components/request-service-form";
import { articlesForService } from "@/lib/content";
import { findHindiService } from "@/lib/hindi";
import { SITE_CONTENT_DATE } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { serviceEditorial } from "@/lib/service-editorial";
import { categoryFor, findService, isServiceDetail, publishedServiceDetails, serviceCatalog, serviceSeoDescription, serviceSeoTitle, servicesInCategory } from "@/lib/services";
import { site, whatsappLink } from "@/lib/site";
import { itemListLd, serviceLd } from "@/lib/structured-data";

export const dynamicParams = false;

export function generateStaticParams() { return [...serviceCatalog, ...publishedServiceDetails].map((service) => ({ slug: service.slug })); }

const genericFaqs = [
  { question: "How do I get started?", answer: "Send a request on this page, call or WhatsApp us. We confirm availability, the documents you need and any service charge before starting." },
  { question: "Who makes the final decision?", answer: "The relevant government authority, bank, insurer, institution or service provider controls eligibility, processing and final decisions." },
];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = findService(slug);
  if (!service) return {};
  const hindi = findHindiService(slug);
  const detail = isServiceDetail(service);
  return pageMetadata(serviceSeoTitle(service), serviceSeoDescription(service), `/services/${service.slug}`, {
    keywords: [...service.keywords, "NISE COMPORT", "Kharangajhar", "Telco", "Jamshedpur", "Jharkhand"],
    image: detail ? `/og/services/${service.slug}.png` : undefined,
    imageAlt: `${service.title} – NISE COMPORT, Telco, Jamshedpur`,
    ...(hindi ? { languages: { "hi-IN": `/hi/services/${service.slug}` } } : {}),
  });
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = findService(slug);
  if (!service) notFound();
  const detail = isServiceDetail(service) ? service : null;
  const category = detail ? categoryFor(detail) : undefined;
  const editorial = detail ? serviceEditorial[detail.slug] : undefined;
  const children = detail ? [] : servicesInCategory(service.slug);
  const siblings = detail ? servicesInCategory(detail.categorySlug).filter((item) => item.slug !== detail.slug).slice(0, 4) : [];
  const guides = articlesForService(service.slug).slice(0, 4);
  const hindi = findHindiService(service.slug);
  const title = service.title;
  const faqs = detail ? [...detail.faqs, ...(editorial?.faqs ?? [])] : genericFaqs;
  const officialLinks = [...(detail?.officialLinks ?? []), ...(editorial?.officialLinks ?? [])].filter((link, index, list) => list.findIndex((item) => item.href === link.href) === index);
  const path = `/services/${service.slug}`;
  const crumbs = [{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, ...(category ? [{ name: category.title, path: `/services/${category.slug}` }] : []), { name: title, path }];
  const checklist = detail?.documents?.length ? `\n\nPlease confirm whether I should prepare these documents:\n${detail.documents.map((item, index) => `${index + 1}. ${item}`).join("\n")}` : "";
  const enquiry = whatsappLink(`Hi NISE COMPORT, I need help with ${title}.${checklist}\n\nI can attach the relevant documents here after you confirm what is safe and necessary to share.`);

  return <main className="content-page"><SiteHeader/>
    <JsonLd data={[serviceLd({ name: title, description: service.description, path, serviceType: serviceSeoTitle(service), category: category?.title }), children.length ? itemListLd(title, children.map((item) => ({ name: item.title, path: `/services/${item.slug}` }))) : null]}/>
    <section className="content-hero detail-hero"><div className="container"><Breadcrumbs items={crumbs}/><Link href={category ? `/services/${category.slug}` : "/services"} className="back-small"><ArrowLeft size={14}/> {category ? category.title : "All services"}</Link><div className="service-detail-hero-grid"><div><span className="eyebrow eyebrow-muted">LOCAL HELP · KHARANGAJHAR, TELCO, JAMSHEDPUR</span><h1>{title}<br/><em>with clear local guidance.</em></h1><p>{service.description}</p>{editorial?.audience && <p className="service-audience"><b>This page is for</b> {editorial.audience}</p>}<div className="content-location"><MapPin size={15}/> {site.address.oneLine}</div><div className="service-hero-actions"><a className="button button-green" href="#request-form">Ask about this service <ArrowRight size={15}/></a><a className="button button-outline" href={enquiry} target="_blank" rel="noopener noreferrer">WhatsApp enquiry</a><a className="button button-outline" href={`tel:${site.phones.primary.e164}`}><Phone size={14}/> Call</a></div>{hindi && <p className="language-switch"><Link href={`/hi/services/${service.slug}`} hrefLang="hi-IN" lang="hi">यह पेज हिन्दी में पढ़ें →</Link></p>}<p className="page-reviewed">Page reviewed: {new Date(`${SITE_CONTENT_DATE}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</p></div>{editorial?.image && <div className="service-detail-image"><Image src={editorial.image} alt={editorial.imageAlt} width={720} height={520} priority sizes="(max-width: 900px) 100vw, 45vw"/></div>}</div></div></section>
    {detail ? <>
      <section className="container detail-body"><div><span className="eyebrow eyebrow-muted">SERVICE OVERVIEW</span><h2>How we can help with {detail.title.replace(/ in Jamshedpur$/i, "").toLowerCase()}</h2><p>We provide practical application and document assistance. We explain the steps and any service charge before you decide to proceed.</p><ul>{detail.highlights.map(item => <li key={item}><Check size={15}/>{item}</li>)}</ul><h2 className="service-content-heading">Documents to prepare</h2><p>Requirements can vary by applicant and service type. Use this as a starting checklist and confirm the latest instructions with the official provider.</p><ul>{detail.documents.map(item => <li key={item}><Check size={15}/>{item}</li>)}</ul></div><aside><span><MapPin size={17}/></span><h3>Start with a quick enquiry</h3><p>Tell us what you need. Our team will check availability and explain your next step.</p><a href={enquiry} target="_blank" rel="noopener noreferrer">Ask on WhatsApp <ArrowRight size={14}/></a><a href={`tel:${site.phones.primary.e164}`}>Call {site.phones.primary.display} <ArrowRight size={14}/></a><a href={site.mapsUrl} target="_blank" rel="noopener noreferrer">Get directions <ArrowRight size={14}/></a></aside></section>
      {editorial?.beforeYouStart?.length ? <section className="container service-prep-section"><div className="service-prep-heading"><div><span className="eyebrow eyebrow-muted">BEFORE YOU VISIT</span><h2>A little preparation<br/><em>makes it easier.</em></h2></div><p>Bring only what is needed for your request. We will confirm current requirements before you travel or share sensitive information.</p></div><div className="service-prep-grid">{editorial.beforeYouStart.map((item, index) => <article key={item}><span>0{index + 1}</span><p>{item}</p></article>)}</div></section> : null}
      <section className="container service-steps"><span className="eyebrow eyebrow-muted">A TRANSPARENT PROCESS</span><h2>What happens next</h2><ol className="service-step-grid">{detail.steps.map((step, index) => <li key={step}><span>0{index + 1}</span><p>{step}</p></li>)}</ol></section>
      {officialLinks.length ? <section className="container official-links-section"><span className="eyebrow eyebrow-muted">CHECK THE LATEST REQUIREMENTS</span><h2>Official information</h2><p>Use the official source for current rules, documents, appointments and fees. NISE COMPORT can help you navigate the process.</p><div>{officialLinks.map(link => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer external"><span>{link.label}</span><ArrowRight size={16}/></a>)}</div></section> : null}
    </> : <section className="container category-service-list"><div className="section-heading"><div><span className="eyebrow eyebrow-muted">EXPLORE THIS SERVICE AREA</span><h2>Choose the help<br/><em>you need.</em></h2></div><p>Each service has its own checklist and next steps. Select a page to learn more before sending an enquiry.</p></div><div className="catalog-grid">{children.map((item, index) => <article className="catalog-card" key={item.slug}><span className="catalog-index">{String(index + 1).padStart(2, "0")}</span><h2><Link href={`/services/${item.slug}`}>{item.title}</Link></h2><p>{item.description}</p><div className="catalog-tags">{item.keywords.slice(0, 2).map(word => <span key={word}>{word}</span>)}</div><Link href={`/services/${item.slug}`} aria-label={`Read about ${item.title}`}><ArrowRight size={17}/></Link></article>)}</div></section>}
    {guides.length ? <section className="container related-guides"><span className="eyebrow eyebrow-muted">READ BEFORE YOU COME</span><h2>Related guides</h2><div className="guide-teasers">{guides.map((guide) => <article key={guide.slug}><span>{guide.category}</span><h3><Link href={`/blog/${guide.slug}`}>{guide.title}</Link></h3><p>{guide.excerpt}</p></article>)}</div></section> : null}
    <FaqSection faqs={faqs}/>
    <section className="container request-section-wrap" id="request-form">{service.slug === "pan-card-jamshedpur" ? <div className="pan-card"><h2>PAN guides and common request form</h2><p>Choose new PAN, correction, reprint, minor or business assistance. Review documents and track an official application.</p><Link className="button button-green" href="/pan/request">Prepare a PAN request</Link> <Link href="/pan">Open the complete PAN guide</Link></div> : <RequestServiceForm slug={service.slug} title={title}/>}</section>
    {siblings.length ? <section className="container related-services"><span className="eyebrow eyebrow-muted">ALSO IN {category?.title.toUpperCase()}</span><div className="related-links">{siblings.map((item) => <Link key={item.slug} href={`/services/${item.slug}`}>{item.title} <ArrowUpRight size={13}/></Link>)}</div></section> : null}
    <section className="container provider-note"><ShieldCheck size={18}/><p>NISE COMPORT is an independent service facilitator, not a government authority, bank or insurer. The applicant is responsible for accurate information. Approval, issuance, processing times and decisions rest with the relevant authority or provider. Our service charge is separate from any official or third-party fee.</p></section>
  </main>;
}
