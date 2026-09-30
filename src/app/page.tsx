import SiteHeader from "@/components/site-header";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, BadgeCheck, ClipboardCheck, Clock3, FileSearch, Languages, LockKeyhole, MapPin, MessageCircle, Phone, ReceiptText, Send, ShieldCheck, Star, Truck } from "lucide-react";
import CategoryGrid from "@/components/category-grid";
import FaqSection from "@/components/faq-section";
import HeroSearch from "@/components/hero-search";
import HeroVisual from "@/components/hero-visual";
import { WhatsAppIcon } from "@/components/icons";
import JsonLd from "@/components/json-ld";
import OfferCard from "@/components/offer-card";
import OpenStatus from "@/components/open-status";
import { articles } from "@/lib/content";
import { localGallery } from "@/lib/gallery";
import { getPlaceSummary } from "@/lib/google-places";
import { summarizeHours } from "@/lib/hours";
import { liveOffers } from "@/lib/offers";
import { getLivePromos } from "@/lib/promotions";
import { liveOfferCodes } from "@/lib/promo-view";
import { pageMetadata } from "@/lib/seo";
import { publishedServiceDetails } from "@/lib/services";
import { site, whatsappLink } from "@/lib/site";
import { webPageLd } from "@/lib/structured-data";

export const revalidate = 43200;

export const metadata: Metadata = {
  ...pageMetadata(
    "NISE COMPORT | CSC & Pragya Kendra in Telco, Jamshedpur",
    "PAN card, Aadhaar update help, income/caste/residence certificates, AEPS banking, insurance, online forms, bills and printing at NISE COMPORT, Kharangajhar, Telco, Jamshedpur.",
    "/",
    { languages: { "hi-IN": "/hi", "bn-IN": "/bn" }, keywords: ["CSC centre Jamshedpur", "Pragya Kendra Telco", "Pragya Kendra Kharangajhar", "PAN card Jamshedpur", "Aadhaar update Jamshedpur", "income certificate Jamshedpur", "caste certificate Jharkhand", "AEPS Telco", "bike insurance Jamshedpur", "online form filling Jamshedpur", "printing Telco", "प्रज्ञा केंद्र जमशेदपुर", "सीएससी सेंटर टेल्को", "জামশেদপুর প্রজ্ঞা কেন্দ্র"] },
  ),
};

const popular = [
  { label: "PAN card", href: "/services/pan-card-jamshedpur" },
  { label: "Income certificate", href: "/services/jharkhand-certificates-jamshedpur" },
  { label: "Bike insurance", href: "/services/bike-insurance-jamshedpur" },
  { label: "AEPS", href: "/services/banking-aeps-money-transfer" },
  { label: "Print", href: "/print" },
];

const steps = [
  { icon: FileSearch, title: "Pick your service", text: "Choose from 8 categories or just search." },
  { icon: Send, title: "Share a few details", text: "Takes 2 minutes. No OTPs, no PINs." },
  { icon: ClipboardCheck, title: "We confirm everything", text: "Documents, fees and timing, upfront." },
  { icon: BadgeCheck, title: "Get it done & track it", text: "Live status in your account." },
];

const homeFaqs = [
  { question: "Where is NISE COMPORT in Jamshedpur?", answer: `${site.address.oneLine}. Tap “Get directions” to open the route in Google Maps.` },
  { question: "Is NISE COMPORT a government office?", answer: "No. NISE COMPORT is an independent CSC / Pragya Kendra service centre. We help you use official and partner services; the relevant department, bank or provider makes the final decision." },
  { question: "Are government fees included in your charge?", answer: "No. Official or third-party fees are separate from our service charge. We explain both before any work starts and give you a receipt." },
  { question: "Can I track my request online?", answer: "Yes. Create a free account, send a request in four quick steps and follow its status and reference number in your account. We also update you by email, phone or WhatsApp." },
  { question: "Do you help in Hindi and Bengali?", answer: "Yes. The website works in English, हिन्दी and বাংলা, and our team is happy to help you in the language you’re comfortable with." },
];

export default async function HomePage() {
  const hours = summarizeHours(site.openingHours);
  // Three festival / match codes ending soonest, then the standing offers.
  const offers = [...liveOfferCodes(await getLivePromos()).slice(0, 3), ...liveOffers()];
  const place = await getPlaceSummary();
  const galleryPreview = [
    ...(place?.photos.slice(0, 3).map((photo) => ({ key: `g${photo.index}`, src: `/api/gallery/photo/${photo.index}`, alt: `Photo of NISE COMPORT by ${photo.author}`, title: `Photo · ${photo.author}`, google: true })) ?? []),
    ...localGallery.slice(0, 6).map((item) => ({ key: item.src, src: item.src, alt: item.alt, title: item.title, google: false })),
  ].slice(0, 6);

  return <>
    <SiteHeader/>
    <JsonLd data={webPageLd({ name: "NISE COMPORT – CSC & Pragya Kendra in Telco, Jamshedpur", description: site.description, path: "/" })}/>
    <main className="home">
      <section className="hero">
        <div className="hero__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/><span className="blob blob--3"/><span className="hero__grid"/></div>
        <div className="container hero__layout">
          <div className="hero__copy">
            <span className="pill pill--glass"><i className="live-dot"/> Kharangajhar · Telco · Jamshedpur</span>
            <h1 className="hero__title"><span className="hero__kicker">CSC &amp; Pragya Kendra in Telco, Jamshedpur</span>Sarkari &amp; digital kaam, <span className="grad-text">sorted in one visit.</span></h1>
            <p className="hero__lead">PAN, Aadhaar help, certificates, AEPS banking, insurance, bills, forms and printing. Start online in 4 quick steps, track it live, and walk in only when you need to.</p>
            <HeroSearch popular={popular}/>
            <div className="hero__ctas">
              <Link href="/request" className="btn btn--primary btn--lg">Start a request <ArrowRight size={20}/></Link>
              <a href={whatsappLink("Hi NISE COMPORT, I need help with a service.")} className="btn btn--glass btn--lg" target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={20}/> Chat on WhatsApp</a>
            </div>
            <ul className="hero__trust">
              <li><BadgeCheck size={18}/> Clear fees upfront</li>
              <li><Clock3 size={18}/> Live request tracking</li>
              <li><Languages size={18}/> English · हिन्दी · বাংলা</li>
            </ul>
            {place?.rating ? <a className="rating-chip" href={place.mapsUri ?? site.mapsUrl} target="_blank" rel="noopener noreferrer"><Star size={16} fill="currentColor"/> <b>{place.rating.toFixed(1)}</b> on Google · {place.ratingCount} reviews</a> : null}
          </div>
          <HeroVisual offer={offers.find((offer) => offer.badge === "LIVE")}/>
        </div>
        <div className="container hero__stats">
          <div><strong>{publishedServiceDetails.length}+</strong><span>services under one roof</span></div>
          <div><strong>8</strong><span>categories, from PAN to travel</span></div>
          <div><strong>3</strong><span>languages on the website</span></div>
          <div><strong><OpenStatus rules={site.openingHours}/>{!site.openingHours.length && "Mon–Sat"}</strong><span>{hours[0] ?? "Walk in or call first"}</span></div>
        </div>
      </section>

      <section className="section" id="services">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">WHAT DO YOU NEED TODAY?</span>
            <h2>Everything for your <span className="grad-text">documents, money &amp; more.</span></h2>
            <p>Pick a category to see every service inside it, with documents to prepare and a 4-step request.</p>
          </div>
          <CategoryGrid/>
          <div className="section-foot"><Link className="btn btn--ghost" href="/services">Browse all {publishedServiceDetails.length} services <ArrowRight size={18}/></Link></div>
        </div>
      </section>

      {offers.length > 0 && <section className="section section--night offers-band" id="offers">
        <div className="offers-band__glow" aria-hidden="true"/>
        <div className="container">
          <div className="section-head section-head--light">
            <span className="badge badge--live"><i/>LIVE OFFERS</span>
            <h2>Deals that make it <span className="grad-text grad-text--warm">even easier.</span></h2>
            <p>Claim them right inside your request. Offers apply to our service charge, never to government fees.</p>
          </div>
          <div className="offer-grid">{offers.map((offer) => <OfferCard key={offer.id} offer={offer}/>)}</div>
          <div className="section-foot"><Link className="btn btn--glass" href="/offers">See all offers <ArrowRight size={18}/></Link></div>
        </div>
      </section>}

      <section className="section section--tint" id="how-it-works">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">HOW IT WORKS</span>
            <h2>Four steps. <span className="grad-text">Zero confusion.</span></h2>
            <p>Start on your phone, finish at our counter (or doorstep). We tell you everything before we begin.</p>
          </div>
          <ol className="steps-row">{steps.map(({ icon: Icon, title, text }, index) => <li key={title} className="step-card" style={{ animationDelay: `${index * 80}ms` }}>
            <span className="step-card__num">0{index + 1}</span>
            <span className="step-card__icon"><Icon size={26}/></span>
            <h3>{title}</h3><p>{text}</p>
          </li>)}</ol>
          <div className="section-foot"><Link className="btn btn--primary" href="/request">Try it now <ArrowRight size={18}/></Link></div>
        </div>
      </section>

      <section className="section" id="why">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">WHY PEOPLE PICK US</span>
            <h2>A counter that <span className="grad-text">actually explains things.</span></h2>
          </div>
          <div className="bento">
            <article className="bento__item bento__item--wide tone-blue"><ReceiptText size={28}/><h3>Clear fees, before we start</h3><p>You see our service charge and any government or provider fee separately, and you get a receipt. No surprises at the counter.</p><div className="fee-demo" aria-hidden="true"><span>Official fee<b>as per portal</b></span><span>Our service charge<b>told upfront</b></span></div></article>
            <article className="bento__item tone-green"><Clock3 size={28}/><h3>Track it live</h3><p>Every request gets a reference number and status updates in your account.</p></article>
            <article className="bento__item tone-violet"><Languages size={28}/><h3>Your language</h3><p>English, हिन्दी or বাংলা, on the site and at the counter.</p></article>
            <article className="bento__item tone-pink"><LockKeyhole size={28}/><h3>Private by design</h3><p>Encrypted connections. We never ask for your OTP, PIN or password.</p></article>
            <article className="bento__item tone-cyan"><Truck size={28}/><h3>Pickup, delivery or doorstep</h3><p>Collect prints from our Kharangajhar counter, ask for delivery, or request doorstep help nearby.</p><Link className="text-link" href="/print">Print from your phone <ArrowRight size={16}/></Link></article>
          </div>
        </div>
      </section>

      <section className="section section--tint" id="gallery">
        <div className="container">
          <div className="section-head section-head--split">
            <div><span className="eyebrow">GALLERY</span><h2>A peek at <span className="grad-text">our desk &amp; services.</span></h2></div>
            <Link className="btn btn--ghost" href="/gallery">Open gallery <ArrowUpRight size={18}/></Link>
          </div>
          <div className="gallery-strip">{galleryPreview.map((item) => <Link key={item.key} href="/gallery" className="gallery-strip__item">
            <Image src={item.src} alt={item.alt} width={600} height={450} sizes="(max-width: 700px) 80vw, 33vw" unoptimized={item.google}/>
            <span>{item.title}</span>
          </Link>)}</div>
        </div>
      </section>

      <section className="section" id="guides">
        <div className="container">
          <div className="section-head section-head--split">
            <div><span className="eyebrow">LOCAL GUIDES</span><h2>Know what to bring <span className="grad-text">before you visit.</span></h2></div>
            <Link className="btn btn--ghost" href="/blog">All guides <ArrowUpRight size={18}/></Link>
          </div>
          <div className="guide-grid">{articles.slice(0, 3).map((article) => <article key={article.slug} className="guide-card">
            <Link href={`/blog/${article.slug}`} className="guide-card__media" tabIndex={-1} aria-hidden="true"><Image src={article.image} alt="" width={420} height={260} sizes="(max-width: 700px) 100vw, 33vw"/></Link>
            <div className="guide-card__body"><span className="chip">{article.category}</span><h3><Link href={`/blog/${article.slug}`}>{article.title}</Link></h3><p>{article.excerpt}</p><Link className="text-link" href={`/blog/${article.slug}`} aria-label={`Read: ${article.title}`}>Read guide <ArrowRight size={16}/></Link></div>
          </article>)}</div>
        </div>
      </section>

      <FaqSection faqs={homeFaqs} eyebrow="GOOD TO KNOW" title="Questions people ask before visiting"/>

      <section className="section" id="visit">
        <div className="container">
          <div className="visit-card">
            <div className="visit-card__glow" aria-hidden="true"/>
            <div className="visit-card__copy">
              <span className="eyebrow eyebrow--light">VISIT US</span>
              <h2>Let’s get it <span className="grad-text grad-text--warm">sorted.</span></h2>
              <p className="visit-card__address"><MapPin size={20}/> {site.address.oneLine}</p>
              <p className="visit-card__hours"><Clock3 size={20}/> <span><OpenStatus rules={site.openingHours}/> {hours.length ? hours.join(" · ") : "Mon–Sat · call before visiting"}</span></p>
              <div className="visit-card__ctas">
                <a className="btn btn--light" href={site.mapsUrl} target="_blank" rel="noopener noreferrer"><MapPin size={18}/> Get directions</a>
                <a className="btn btn--wa" href={whatsappLink("Hi NISE COMPORT, I need help with a service.")} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18}/> WhatsApp</a>
                <a className="btn btn--glass" href={`tel:${site.phones.primary.e164}`}><Phone size={18}/> {site.phones.primary.display}</a>
              </div>
            </div>
            <div className="visit-card__side" aria-hidden="true">
              <div className="map-art"><span className="map-art__road map-art__road--1"/><span className="map-art__road map-art__road--2"/><span className="map-art__road map-art__road--3"/><span className="map-art__pin"><MapPin size={28}/></span><span className="map-art__label">NISE COMPORT</span></div>
              <div className="visit-card__chips"><span><ShieldCheck size={16}/> Independent CSC</span><span><MessageCircle size={16}/> Replies on WhatsApp</span></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </>;
}
