import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, CircleCheck, ExternalLink, MapPin, Phone, ShieldCheck } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import FaqSection from "@/components/faq-section";
import FloatingStart from "@/components/floating-start";
import JsonLd from "@/components/json-ld";
import { CategoryIcon, WhatsAppIcon } from "@/components/icons";
import OfferCard from "@/components/offer-card";
import SiteBanners from "@/components/site-banners";
import { resolveService, servicesInCategoryAll } from "@/lib/site-content";
import { articlesForService } from "@/lib/content";
import { categoryMetaFor } from "@/lib/categories";
import { posterFor } from "@/lib/gallery";
import { findHindiService } from "@/lib/hindi";
import { offersFor } from "@/lib/offers";
import { getLivePromos } from "@/lib/promotions";
import { liveOfferCodes } from "@/lib/promo-view";
import { translatedSlugs } from "@/lib/translated-slugs";
import { SITE_CONTENT_DATE } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { serviceEditorial } from "@/lib/service-editorial";
import { FACILITATOR_NOTE } from "@/lib/motor-insurance";
import { categoryFor, findService, isServiceDetail, publishedServiceDetails, requestHrefFor, serviceCatalog, serviceSeoDescription, serviceSeoTitle, shortServiceName } from "@/lib/services";
import { site, whatsappLink } from "@/lib/site";
import { itemListLd, serviceLd } from "@/lib/structured-data";

// Services added in Admin → Site content are rendered on first visit.
export const dynamicParams = true;
export const revalidate = 3600;

/** Motor-insurance pages send people to the full quote form. */
const MOTOR_LINKS: Record<string, string> = {
  insurance: "/insurance#quote",
  "bike-insurance": "/insurance?vehicle=bike#quote",
  "car-insurance": "/insurance?vehicle=car#quote",
};

export function generateStaticParams() { return [...serviceCatalog, ...publishedServiceDetails].map((service) => ({ slug: service.slug })); }

const genericFaqs = [
  { question: "How do I get started?", answer: "Send a request on this page, call or WhatsApp us. We confirm availability, the documents you need and any service charge before starting." },
  { question: "Who makes the final decision?", answer: "The relevant government authority, bank, insurer, institution or service provider controls eligibility, processing and final decisions." },
];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await resolveService(slug);
  if (!service) return {};
  const hindi = findHindiService(slug);
  const detail = isServiceDetail(service);
  return pageMetadata(serviceSeoTitle(service), serviceSeoDescription(service), `/services/${service.slug}`, {
    keywords: [...service.keywords, "NISE COMPORT", "Kharangajhar", "Telco", "Jamshedpur", "Jharkhand"],
    image: detail && findService(slug) ? `/og/services/${service.slug}.png` : undefined,
    imageAlt: `${service.title} – NISE COMPORT, Telco, Jamshedpur`,
    ...(hindi ? { languages: { "hi-IN": `/hi/services/${service.slug}`, ...(translatedSlugs.bn.includes(service.slug) ? { "bn-IN": `/bn/services/${service.slug}` } : {}) } } : {}),
  });
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await resolveService(slug);
  if (!service) {
    if (findService(slug)) console.warn(`[services] "${slug}" is hidden in Admin → Site content, so its page shows 404.`);
    notFound();
  }
  const detail = isServiceDetail(service) ? service : null;
  // Services added in the admin area without details yet: show the page, but as "coming soon".
  const comingSoon = Boolean(detail && !detail.highlights?.length && !detail.documents?.length && !detail.steps?.length);
  const category = detail ? categoryFor(detail) : undefined;
  const editorial = detail ? serviceEditorial[detail.slug] : undefined;
  const children = detail ? [] : await servicesInCategoryAll(service.slug);
  const siblings = detail ? (await servicesInCategoryAll(detail.categorySlug)).filter((item) => item.slug !== detail.slug).slice(0, 4) : [];
  const guides = articlesForService(service.slug).slice(0, 4);
  const hindi = findHindiService(service.slug);
  const title = service.title;
  const faqs = detail ? [...detail.faqs, ...(editorial?.faqs ?? [])] : genericFaqs;
  const officialLinks = [...(detail?.officialLinks ?? []), ...(editorial?.officialLinks ?? [])].filter((link, index, list) => list.findIndex((item) => item.href === link.href) === index);
  const path = `/services/${service.slug}`;
  const crumbs = [{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, ...(category ? [{ name: category.title, path: `/services/${category.slug}` }] : []), { name: title, path }];
  const checklist = detail?.documents?.length ? `\n\nPlease confirm whether I should prepare these documents:\n${detail.documents.map((item, index) => `${index + 1}. ${item}`).join("\n")}` : "";
  const enquiry = whatsappLink(`Hi NISE COMPORT, I need help with ${title}.${checklist}\n\nI can attach the relevant documents here after you confirm what is safe and necessary to share.`);

  const categorySlug = detail ? detail.categorySlug : service.slug;
  const meta = categoryMetaFor(categorySlug);
  const startHref = requestHrefFor(service.slug);
  const motor = MOTOR_LINKS[service.slug];
  const offers = offersFor(categorySlug, new Date(), liveOfferCodes(await getLivePromos())).slice(0, 2);
  const bengali = translatedSlugs.bn.includes(service.slug);
  const reviewed = new Date(`${SITE_CONTENT_DATE}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  return <main className="page"><SiteHeader/>
    <JsonLd data={[serviceLd({ name: title, description: service.description, path, serviceType: serviceSeoTitle(service), category: category?.title }), children.length ? itemListLd(title, children.map((item) => ({ name: item.title, path: `/services/${item.slug}` }))) : null]}/>
    <section className={`page-hero page-hero--service tone-${meta?.tone ?? "blue"}`}>
      <div className="page-hero__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/></div>
      <div className="container page-hero__split">
        <div>
          <Breadcrumbs items={crumbs}/>
          {meta && <Link className="cat-chip" href={`/services?category=${meta.slug}`}><CategoryIcon icon={meta.icon} size={16}/>{meta.short.en}</Link>}
          <h1>{title}</h1>
          <p className="page-hero__lead">{service.description}</p>
          {editorial?.audience && <p className="page-hero__audience"><b>For:</b> {editorial.audience}</p>}
          <div className="page-hero__ctas">
            {motor ? <Link className="btn btn--primary btn--lg" href={motor}>Get insurance quotes <ArrowRight size={18}/></Link>
              : !comingSoon && <Link className="btn btn--primary btn--lg" href={detail ? startHref : `/request?category=${service.slug}`}>Start in 4 steps <ArrowRight size={18}/></Link>}
            <a className="btn btn--wa btn--lg" href={enquiry} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18}/> WhatsApp</a>
            <a className="btn btn--glass btn--lg" href={`tel:${site.phones.primary.e164}`}><Phone size={18}/> Call</a>
          </div>
          {comingSoon && <p className="coming-soon"><b>Coming soon online.</b> Full details for this service are being added. Call or WhatsApp us and we’ll help you today.</p>}
          {categorySlug === "insurance" && <p className="page-hero__audience"><b>Please note:</b> {FACILITATOR_NOTE}</p>}
          <p className="page-hero__meta"><MapPin size={16}/> {site.address.oneLine}{hindi && <> · <Link href={`/hi/services/${service.slug}`} hrefLang="hi-IN" lang="hi">हिन्दी में पढ़ें</Link></>}{bengali && <> · <Link href={`/bn/services/${service.slug}`} hrefLang="bn-IN" lang="bn">বাংলায় পড়ুন</Link></>}</p>
        </div>
        <div className="page-hero__art"><Image src={posterFor(service.slug, categorySlug)} alt={editorial?.imageAlt ?? `${title} illustration`} width={1200} height={900} priority sizes="(max-width: 900px) 100vw, 44vw"/></div>
      </div>
    </section>

    {detail ? <div className="container detail">
      <div className="detail__main">
        <section className="detail__block">
          <span className="eyebrow">HOW WE HELP</span>
          <h2>What we can do for you</h2>
          <ul className="tick-grid">{detail.highlights.map((item) => <li key={item}><CircleCheck size={20}/>{item}</li>)}</ul>
        </section>
        <section className="detail__block">
          <span className="eyebrow">CHECKLIST</span>
          <h2>Documents to prepare</h2>
          <p className="muted">Requirements vary by applicant. Use this as a starting list; we confirm the latest before you visit.</p>
          <ul className="doc-list">{detail.documents.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ul>
        </section>
        {editorial?.beforeYouStart?.length ? <section className="detail__block">
          <span className="eyebrow">BEFORE YOU VISIT</span>
          <h2>A little prep, a lot less running around</h2>
          <div className="prep-grid">{editorial.beforeYouStart.map((item, index) => <article key={item}><span>0{index + 1}</span><p>{item}</p></article>)}</div>
        </section> : null}
        <section className="detail__block">
          <span className="eyebrow">THE PROCESS</span>
          <h2>What happens next</h2>
          <ol className="timeline timeline--big">{detail.steps.map((step) => <li key={step}><b>{step}</b></li>)}</ol>
        </section>
        {officialLinks.length ? <section className="detail__block">
          <span className="eyebrow">OFFICIAL SOURCES</span>
          <h2>Check the latest rules</h2>
          <p className="muted">Official sites set the current documents, appointments and fees. We help you navigate them.</p>
          <div className="link-list">{officialLinks.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer external"><span>{link.label}</span><ExternalLink size={18}/></a>)}</div>
        </section> : null}
        <p className="fine">Page reviewed: {reviewed}</p>
      </div>
      <aside className="detail__aside">
        <div className="start-card">
          <span className="eyebrow">READY WHEN YOU ARE</span>
          <h3>Start {shortServiceName(title)}</h3>
          <ol className="mini-steps"><li>Pick service</li><li>Your details</li><li>Visit time</li><li>Send</li></ol>
          <Link className="btn btn--primary btn--block" href={startHref}>Start in 4 steps <ArrowRight size={18}/></Link>
          <a className="btn btn--wa btn--block" href={enquiry} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18}/> Ask on WhatsApp</a>
          <p className="fine"><ShieldCheck size={15}/> Fees explained before we start.</p>
        </div>
        <SiteBanners placement="service-page" category={categorySlug}/>
        {offers.map((offer) => <OfferCard key={offer.id} offer={offer} variant="rail"/>)}
      </aside>
    </div> : <section className="section section--flush">
      <div className="container">
        <div className="section-head section-head--left"><span className="eyebrow">IN THIS CATEGORY</span><h2>Choose the help you need</h2><p>Each service has its own checklist and a 4-step request.</p></div>
        <div className="svc-grid">{children.map((item) => <article key={item.slug} className={`svc-card tone-${meta?.tone ?? "blue"}`}>
          <div className="svc-card__top"><span className="svc-card__icon">{meta && <CategoryIcon icon={meta.icon} size={22}/>}</span></div>
          <h3><Link href={`/services/${item.slug}`}>{shortServiceName(item.title)}</Link></h3>
          <p>{item.description}</p>
          <div className="svc-card__actions"><Link className="btn btn--primary btn--sm" href={requestHrefFor(item.slug)}>Start <ArrowRight size={16}/></Link><Link className="btn btn--ghost btn--sm" href={`/services/${item.slug}`}>Details</Link></div>
        </article>)}</div>
      </div>
    </section>}

    {guides.length ? <section className="section section--tint">
      <div className="container">
        <div className="section-head section-head--left"><span className="eyebrow">READ BEFORE YOU COME</span><h2>Related guides</h2></div>
        <div className="guide-grid">{guides.map((guide) => <article key={guide.slug} className="guide-card"><div className="guide-card__body"><span className="chip">{guide.category}</span><h3><Link href={`/blog/${guide.slug}`}>{guide.title}</Link></h3><p>{guide.excerpt}</p><Link className="text-link" href={`/blog/${guide.slug}`} aria-label={`Read: ${guide.title}`}>Read guide <ArrowRight size={16}/></Link></div></article>)}</div>
      </div>
    </section> : null}
    <FaqSection faqs={faqs}/>
    {siblings.length ? <section className="section section--flush">
      <div className="container">
        <div className="section-head section-head--left"><span className="eyebrow">ALSO IN {category?.title.toUpperCase()}</span></div>
        <div className="link-cloud">{siblings.map((item) => <Link key={item.slug} href={`/services/${item.slug}`}>{shortServiceName(item.title)} <ArrowUpRight size={15}/></Link>)}</div>
      </div>
    </section> : null}
    <section className="section section--flush">
      <div className="container"><div className="note-card"><ShieldCheck size={22}/><p>NISE COMPORT is an independent service facilitator, not a government authority, bank or insurer. The applicant is responsible for accurate information. Approval, issuance, processing times and decisions rest with the relevant authority or provider. Our service charge is separate from any official or third-party fee.</p></div></div>
    </section>
    {!comingSoon && <FloatingStart href={motor ?? (detail ? startHref : `/request?category=${service.slug}`)} label={motor ? "Get quotes" : "Start now"}/>}
  </main>;
}
