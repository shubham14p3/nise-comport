import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CircleCheck, Clock3, MapPin, Phone, ShieldCheck } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import CategoryGrid from "@/components/category-grid";
import FaqSection from "@/components/faq-section";
import { WhatsAppIcon } from "@/components/icons";
import OfferCard from "@/components/offer-card";
import OpenStatus from "@/components/open-status";
import SiteHeader from "@/components/site-header";
import { posterFor } from "@/lib/gallery";
import { summarizeHours } from "@/lib/hours";
import { dict } from "@/lib/i18n";
import { liveOffers, offersFor } from "@/lib/offers";
import { findService, isServiceDetail, requestHrefFor } from "@/lib/services";
import { site, whatsappLink } from "@/lib/site";

type Lang = "hi" | "bn";
type Home = { eyebrow: string; h1: string; lead: string; trust: string[]; faqs: { question: string; answer: string }[] };
type Service = { slug: string; title: string; description: string; highlights: string[]; documents: string[]; steps: string[]; faqs: { question: string; answer: string }[] };

const L = {
  hi: {
    htmlLang: "hi-IN", home: "होम", crumbs: "ब्रेडक्रंब", tagline: "सरकारी और डिजिटल काम, एक ही जगह।", address: site.address.hindi,
    categories: "आज किस काम में मदद चाहिए?", categoriesSub: "श्रेणी चुनें, हर सेवा की जानकारी और 4 आसान चरणों वाला अनुरोध वहीं मिलेगा।", count: "सेवाएँ",
    translated: "हिन्दी में सेवा जानकारी", translatedSub: "दस्तावेज़ों की सूची, प्रक्रिया और सवाल-जवाब – अपनी भाषा में।",
    offers: "ऑफ़र जो काम और आसान बना दें", offersSub: "ऑफ़र हमारे सेवा शुल्क पर लागू होते हैं, सरकारी शुल्क पर नहीं।",
    visit: "हमसे मिलें", english: "Read in English →", faqEyebrow: "अक्सर पूछे जाने वाले सवाल", faqTitle: "आने से पहले जानें",
    kicker: "स्थानीय मदद · खरंगाझार, टेल्को, जमशेदपुर", help: "हम कैसे मदद करते हैं", docs: "साथ लाने वाले दस्तावेज़",
    docsNote: "ज़रूरी दस्तावेज़ आवेदक और सेवा के अनुसार बदल सकते हैं। आधिकारिक वेबसाइट पर नवीनतम सूची ज़रूर देखें।",
    next: "आगे क्या होगा", faq: "सवाल-जवाब", faqLong: "अक्सर पूछे जाने वाले सवाल", start: "4 आसान चरणों में शुरू करें", ask: "व्हाट्सऐप पर पूछें", call: "कॉल करें", read: "जानकारी देखें",
    disclaimer: "NISE COMPORT एक स्वतंत्र CSC / प्रज्ञा केंद्र है, सरकारी कार्यालय नहीं। आवेदन पर अंतिम निर्णय संबंधित विभाग या संस्था का होता है। सरकारी शुल्क और हमारा सेवा शुल्क अलग-अलग हैं।",
    wa: (title: string) => `नमस्ते NISE COMPORT, मुझे "${title}" के बारे में मदद चाहिए।`, waHome: "नमस्ते NISE COMPORT, मुझे एक सेवा के बारे में जानकारी चाहिए।",
    ready: "तैयार हैं?", steps: ["सेवा चुनें", "जानकारी दें", "समय चुनें", "भेजें"],
  },
  bn: {
    htmlLang: "bn-IN", home: "হোম", crumbs: "ব্রেডক্রাম্ব", tagline: "সরকারি ও ডিজিটাল কাজ, এক জায়গায়।", address: site.address.bengali,
    categories: "আজ কোন কাজে সাহায্য দরকার?", categoriesSub: "একটি বিভাগ বাছুন, প্রতিটি পরিষেবার তথ্য আর 4টি সহজ ধাপের অনুরোধ সেখানেই পাবেন।", count: "পরিষেবা",
    translated: "বাংলায় পরিষেবার তথ্য", translatedSub: "কাগজপত্রের তালিকা, প্রক্রিয়া আর প্রশ্নোত্তর – নিজের ভাষায়।",
    offers: "যে অফারে কাজ আরও সহজ", offersSub: "অফার আমাদের সার্ভিস চার্জে প্রযোজ্য, সরকারি ফি-তে নয়।",
    visit: "আমাদের কাছে আসুন", english: "Read in English →", faqEyebrow: "প্রায়ই জিজ্ঞাসিত প্রশ্ন", faqTitle: "আসার আগে জেনে নিন",
    kicker: "স্থানীয় সাহায্য · খরংগাঝাড়, টেলকো, জামশেদপুর", help: "আমরা কীভাবে সাহায্য করি", docs: "যে কাগজপত্র আনবেন",
    docsNote: "প্রয়োজনীয় কাগজপত্র আবেদনকারী ও পরিষেবা অনুযায়ী বদলাতে পারে। সরকারি ওয়েবসাইটে সর্বশেষ তালিকা দেখে নিন।",
    next: "এরপর কী হবে", faq: "প্রশ্নোত্তর", faqLong: "প্রায়ই জিজ্ঞাসিত প্রশ্ন", start: "4টি সহজ ধাপে শুরু করুন", ask: "হোয়াটসঅ্যাপে জিজ্ঞেস করুন", call: "কল করুন", read: "বিস্তারিত দেখুন",
    disclaimer: "NISE COMPORT একটি স্বাধীন CSC / প্রজ্ঞা কেন্দ্র, সরকারি অফিস নয়। আবেদনের চূড়ান্ত সিদ্ধান্ত সংশ্লিষ্ট দপ্তর বা সংস্থার। সরকারি ফি ও আমাদের সার্ভিস চার্জ আলাদা।",
    wa: (title: string) => `নমস্কার NISE COMPORT, "${title}" নিয়ে আমার সাহায্য দরকার।`, waHome: "নমস্কার NISE COMPORT, একটি পরিষেবা নিয়ে আমার তথ্য দরকার।",
    ready: "তৈরি?", steps: ["পরিষেবা বাছুন", "তথ্য দিন", "সময় বাছুন", "পাঠান"],
  },
} as const;

/** Home page for /hi and /bn with the same look as the English home. */
export function LocalizedHome({ lang, home, services }: { lang: Lang; home: Home; services: Service[] }) {
  const l = L[lang];
  const t = dict(lang);
  const hours = summarizeHours(site.openingHours, lang);
  const offers = liveOffers();
  return <main className="page home" lang={l.htmlLang}><SiteHeader/>
    <section className="hero hero--compact">
      <div className="hero__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/><span className="blob blob--3"/><span className="hero__grid"/></div>
      <div className="container hero__layout hero__layout--single">
        <div className="hero__copy">
          <Breadcrumbs label={l.crumbs} items={[{ name: l.home, path: `/${lang}` }]}/>
          <span className="pill pill--glass"><i className="live-dot"/>{home.eyebrow}</span>
          <h1 className="hero__title"><span className="hero__kicker">{home.h1}</span><span className="grad-text">{l.tagline}</span></h1>
          <p className="hero__lead">{home.lead}</p>
          <div className="hero__ctas">
            <Link href="/request" className="btn btn--primary btn--lg">{t.nav.startRequest}<ArrowRight size={20}/></Link>
            <a href={whatsappLink(l.waHome)} className="btn btn--glass btn--lg" target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={20}/>{t.nav.whatsapp}</a>
            <a href={`tel:${site.phones.primary.e164}`} className="btn btn--glass btn--lg"><Phone size={18}/>{l.call}</a>
          </div>
          <ul className="hero__trust">{home.trust.map((item) => <li key={item}><CircleCheck size={18}/>{item}</li>)}</ul>
          <p className="hero__lang"><Link href="/" hrefLang="en-IN" lang="en">{l.english}</Link></p>
        </div>
      </div>
    </section>
    <section className="section">
      <div className="container">
        <div className="section-head"><h2>{l.categories}</h2><p>{l.categoriesSub}</p></div>
        <CategoryGrid locale={lang} countLabel={l.count}/>
      </div>
    </section>
    <section className="section section--tint">
      <div className="container">
        <div className="section-head"><h2>{l.translated}</h2><p>{l.translatedSub}</p></div>
        <div className="svc-grid">{services.filter((service) => findService(service.slug)).map((service) => {
          return <article key={service.slug} className="svc-card tone-blue">
            <h3><Link href={`/${lang}/services/${service.slug}`}>{service.title}</Link></h3>
            <p>{service.description}</p>
            <div className="svc-card__actions"><Link className="btn btn--primary btn--sm" href={requestHrefFor(service.slug)}>{t.nav.startRequest}<ArrowRight size={16}/></Link><Link className="btn btn--ghost btn--sm" href={`/${lang}/services/${service.slug}`}>{l.read}</Link></div>
          </article>;
        })}</div>
      </div>
    </section>
    {offers.length > 0 && <section className="section section--night offers-band">
      <div className="offers-band__glow" aria-hidden="true"/>
      <div className="container">
        <div className="section-head section-head--light"><span className="badge badge--live"><i/>{t.ticker.live}</span><h2>{l.offers}</h2><p>{l.offersSub}</p></div>
        <div className="offer-grid">{offers.map((offer) => <OfferCard key={offer.id} offer={offer} locale={lang}/>)}</div>
      </div>
    </section>}
    <FaqSection faqs={home.faqs} eyebrow={l.faqEyebrow} title={l.faqTitle} lang={l.htmlLang}/>
    <VisitCard lang={lang} hours={hours}/>
  </main>;
}

function VisitCard({ lang, hours }: { lang: Lang; hours: string[] }) {
  const l = L[lang];
  const t = dict(lang);
  return <section className="section">
    <div className="container"><div className="visit-card">
      <div className="visit-card__glow" aria-hidden="true"/>
      <div className="visit-card__copy">
        <h2>{l.visit}</h2>
        <p className="visit-card__address"><MapPin size={20}/> {l.address}</p>
        <p className="visit-card__hours"><Clock3 size={20}/> <span><OpenStatus rules={site.openingHours} language={lang}/> {hours.length ? hours.join(" · ") : t.footer.hoursFallback}</span></p>
        <div className="visit-card__ctas">
          <a className="btn btn--light" href={site.mapsUrl} target="_blank" rel="noopener noreferrer"><MapPin size={18}/>{t.footer.directions}</a>
          <a className="btn btn--wa" href={whatsappLink(l.waHome)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18}/>{t.nav.whatsapp}</a>
          <a className="btn btn--glass" href={`tel:${site.phones.primary.e164}`}><Phone size={18}/> {site.phones.primary.display}</a>
        </div>
      </div>
    </div></div>
  </section>;
}

/** Translated service page for /hi/services/[slug] and /bn/services/[slug]. */
export function LocalizedService({ lang, service }: { lang: Lang; service: Service }) {
  const l = L[lang];
  const t = dict(lang);
  const english = findService(service.slug);
  const category = english && isServiceDetail(english) ? english.categorySlug : undefined;
  const path = `/${lang}/services/${service.slug}`;
  const enquiry = whatsappLink(l.wa(service.title));
  const offers = offersFor(category).slice(0, 2);
  return <main className="page" lang={l.htmlLang}><SiteHeader/>
    <section className="page-hero page-hero--service">
      <div className="page-hero__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/></div>
      <div className="container page-hero__split">
        <div>
          <Breadcrumbs label={l.crumbs} items={[{ name: l.home, path: `/${lang}` }, { name: service.title, path }]}/>
          <span className="pill pill--glass"><i className="live-dot"/>{l.kicker}</span>
          <h1>{service.title}</h1>
          <p className="page-hero__lead">{service.description}</p>
          <div className="page-hero__ctas">
            <Link className="btn btn--primary btn--lg" href={requestHrefFor(service.slug)}>{l.start}<ArrowRight size={18}/></Link>
            <a className="btn btn--wa btn--lg" href={enquiry} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18}/>{l.ask}</a>
            <a className="btn btn--glass btn--lg" href={`tel:${site.phones.primary.e164}`}><Phone size={18}/>{l.call}</a>
          </div>
          <p className="page-hero__meta"><MapPin size={16}/> {l.address} · <Link href={`/services/${service.slug}`} hrefLang="en-IN" lang="en">{l.english}</Link></p>
        </div>
        <div className="page-hero__art"><Image src={posterFor(service.slug, category)} alt="" width={1200} height={900} priority sizes="(max-width: 900px) 100vw, 44vw"/></div>
      </div>
    </section>
    <div className="container detail">
      <div className="detail__main">
        <section className="detail__block"><h2>{l.help}</h2><ul className="tick-grid">{service.highlights.map((item) => <li key={item}><CircleCheck size={20}/>{item}</li>)}</ul></section>
        <section className="detail__block"><h2>{l.docs}</h2><p className="muted">{l.docsNote}</p><ul className="doc-list">{service.documents.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ul></section>
        <section className="detail__block"><h2>{l.next}</h2><ol className="timeline timeline--big">{service.steps.map((step) => <li key={step}><b>{step}</b></li>)}</ol></section>
      </div>
      <aside className="detail__aside">
        <div className="start-card">
          <h3>{l.ready}</h3>
          <ol className="mini-steps">{l.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          <Link className="btn btn--primary btn--block" href={requestHrefFor(service.slug)}>{l.start}<ArrowRight size={18}/></Link>
          <a className="btn btn--wa btn--block" href={enquiry} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18}/>{l.ask}</a>
        </div>
        {offers.map((offer) => <OfferCard key={offer.id} offer={offer} locale={lang} variant="rail"/>)}
        <p className="fine">{t.footer.disclaimer}</p>
      </aside>
    </div>
    <FaqSection faqs={service.faqs} eyebrow={l.faq} title={l.faqLong} lang={l.htmlLang}/>
    <section className="section section--flush"><div className="container"><div className="note-card"><ShieldCheck size={22}/><p>{l.disclaimer}</p></div></div></section>
  </main>;
}
