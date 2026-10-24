import Link from "next/link";
import { ArrowRight, MapPin, Phone, ShieldCheck } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import { CategoryIcon, WhatsAppIcon } from "@/components/icons";
import JsonLd from "@/components/json-ld";
import ServiceBrowser from "@/components/service-browser";
import SiteHeader from "@/components/site-header";
import { bengaliServices } from "@/lib/bengali";
import { categoryMeta, categoryMetaFor } from "@/lib/categories";
import { hindiServices } from "@/lib/hindi";
import { LOCALE_META, type Locale } from "@/lib/i18n";
import { serviceName } from "@/lib/i18n-forms";
import { requestHrefFor, serviceCatalog, shortServiceName } from "@/lib/services";
import { allServices, servicesInCategoryAll } from "@/lib/site-content";
import { site, whatsappLink } from "@/lib/site";
import { itemListLd } from "@/lib/structured-data";
import { categoryText } from "@/lib/translations/categories";
import { tr } from "@/lib/tr";

type Lang = Exclude<Locale, "en">;

function translatedMap(lang: Lang) {
  return new Map((lang === "hi" ? hindiServices : bengaliServices).map((service) => [service.slug, service]));
}

/** /hi/services and /bn/services: the searchable list of every service, in the page language. */
export async function LocalizedServicesIndex({ lang }: { lang: Lang }) {
  const t = tr(lang);
  const all = await allServices();
  const translated = translatedMap(lang);
  const services = all.map((service) => {
    const local = translated.get(service.slug);
    return {
      slug: service.slug, title: local?.title ?? service.title, name: serviceName(service.slug, shortServiceName(service.title), lang),
      description: local?.description ?? service.description, category: service.categorySlug, keywords: service.keywords, requestHref: requestHrefFor(service.slug),
      href: local ? `/${lang}/services/${service.slug}` : `/services/${service.slug}`,
    };
  });
  return <main className="page" lang={LOCALE_META[lang].htmlLang}><SiteHeader/>
    <section className="page-hero page-hero--compact">
      <div className="page-hero__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/></div>
      <div className="container">
        <Breadcrumbs label={t("Breadcrumb", "ब्रेडक्रंब", "ব্রেডক্রাম্ব")} items={[{ name: t("Home", "होम", "হোম"), path: `/${lang}` }, { name: t("Services", "सेवाएँ", "পরিষেবা"), path: `/${lang}/services` }]}/>
        <h1>{t("All services, ", "सभी सेवाएँ, ", "সব পরিষেবা, ")}<span className="grad-text">{t("one counter.", "एक ही काउंटर।", "একই কাউন্টারে।")}</span></h1>
        <p className="page-hero__lead">{lang === "hi"
          ? `खरंगाझार, टेल्को, जमशेदपुर में ${serviceCatalog.length} श्रेणियों में ${all.length} सेवाएँ। खोजिए, एक चुनिए और 4 आसान चरणों में अनुरोध शुरू कीजिए।`
          : `খরংগাঝাড়, টেলকো, জামশেদপুরে ${serviceCatalog.length}টি বিভাগে ${all.length}টি পরিষেবা। খুঁজুন, একটি বাছুন এবং 4টি সহজ ধাপে অনুরোধ শুরু করুন।`}</p>
        <p className="page-hero__meta"><MapPin size={16}/> {lang === "hi" ? site.address.hindi : site.address.bengali}</p>
      </div>
    </section>
    <section className="section section--flush">
      <div className="container"><ServiceBrowser services={services} lang={lang}/></div>
    </section>
    <section className="section section--tint">
      <div className="container">
        <div className="section-head section-head--left"><span className="eyebrow">{t("BROWSE BY CATEGORY", "श्रेणी के अनुसार देखें", "বিভাগ অনুযায়ী দেখুন")}</span><h2>{t("Category guides", "श्रेणी मार्गदर्शिकाएँ", "বিভাগ নির্দেশিকা")}</h2></div>
        <div className="link-cloud">{serviceCatalog.map((group) => <Link prefetch={false} key={group.slug} href={`/${lang}/services/${group.slug}`}>{categoryText(group.slug, group, lang).title}<ArrowRight size={16}/></Link>)}</div>
        <div className="note-card"><ShieldCheck size={22}/><p><b>{t("Independent service facilitator.", "स्वतंत्र सेवा सहायक।", "স্বাধীন পরিষেবা সহায়ক।")}</b> {t("We help customers use official and partner services; we do not make government, banking or insurance decisions. Official and third-party fees are separate from our service charge.", "हम ग्राहकों को आधिकारिक और साझेदार सेवाओं का उपयोग करने में मदद करते हैं; सरकार, बैंक या बीमा के फ़ैसले हम नहीं करते। आधिकारिक और तीसरे पक्ष के शुल्क हमारे सेवा शुल्क से अलग हैं।", "আমরা গ্রাহকদের সরকারি ও সহযোগী পরিষেবা ব্যবহারে সাহায্য করি; সরকার, ব্যাংক বা বিমার সিদ্ধান্ত আমরা নিই না। সরকারি ও তৃতীয় পক্ষের ফি আমাদের সার্ভিস চার্জ থেকে আলাদা।")} <Link prefetch={false} href="/services">{t("Read in English →", "अंग्रेज़ी में पढ़ें →", "ইংরেজিতে পড়ুন →")}</Link></p></div>
      </div>
    </section>
    <JsonLd data={itemListLd(t("NISE COMPORT services", "NISE COMPORT सेवाएँ", "NISE COMPORT পরিষেবা"), services.map((service) => ({ name: service.name, path: service.href })))}/>
  </main>;
}

/** /hi/services/<category> and /bn/services/<category>. */
export async function LocalizedCategory({ lang, slug }: { lang: Lang; slug: string }) {
  const t = tr(lang);
  const group = serviceCatalog.find((item) => item.slug === slug);
  if (!group) return null;
  const text = categoryText(slug, group, lang);
  const meta = categoryMetaFor(slug);
  const translated = translatedMap(lang);
  const children = await servicesInCategoryAll(slug);
  const enquiry = whatsappLink(t(`Hi NISE COMPORT, I need help with ${group.title}.`, `नमस्ते NISE COMPORT, मुझे "${text.title}" में मदद चाहिए।`, `নমস্কার NISE COMPORT, "${text.title}" নিয়ে আমার সাহায্য দরকার।`));
  return <main className="page" lang={LOCALE_META[lang].htmlLang}><SiteHeader/>
    <section className={`page-hero page-hero--service tone-${meta?.tone ?? "blue"}`}>
      <div className="page-hero__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/></div>
      <div className="container">
        <Breadcrumbs label={t("Breadcrumb", "ब्रेडक्रंब", "ব্রেডক্রাম্ব")} items={[{ name: t("Home", "होम", "হোম"), path: `/${lang}` }, { name: t("Services", "सेवाएँ", "পরিষেবা"), path: `/${lang}/services` }, { name: text.title, path: `/${lang}/services/${slug}` }]}/>
        {meta && <Link prefetch={false} className="cat-chip" href={`/${lang}/services`}><CategoryIcon icon={meta.icon} size={16}/>{meta.short[lang]}</Link>}
        <h1>{text.title}</h1>
        <p className="page-hero__lead">{text.description}</p>
        <div className="page-hero__ctas">
          <Link prefetch={false} className="btn btn--primary btn--lg" href={`/request?category=${slug}`}>{t("Start in 4 steps", "4 आसान चरणों में शुरू करें", "4টি সহজ ধাপে শুরু করুন")} <ArrowRight size={18}/></Link>
          <a className="btn btn--wa btn--lg" href={enquiry} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18}/> WhatsApp</a>
          <a className="btn btn--glass btn--lg" href={`tel:${site.phones.primary.e164}`}><Phone size={18}/> {t("Call", "कॉल करें", "কল করুন")}</a>
        </div>
      </div>
    </section>
    <section className="section">
      <div className="container">
        <div className="section-head section-head--left"><span className="eyebrow">{t("SERVICES IN THIS CATEGORY", "इस श्रेणी की सेवाएँ", "এই বিভাগের পরিষেবা")}</span><h2>{text.title}</h2></div>
        <div className="svc-grid">{children.map((service) => {
          const local = translated.get(service.slug);
          const href = local ? `/${lang}/services/${service.slug}` : `/services/${service.slug}`;
          return <article key={service.slug} className={`svc-card tone-${meta?.tone ?? "blue"}`}>
            <div className="svc-card__top"><span className="svc-card__icon">{meta && <CategoryIcon icon={meta.icon} size={22}/>}</span></div>
            <h3><Link prefetch={false} href={href}>{serviceName(service.slug, shortServiceName(service.title), lang)}</Link></h3>
            <p>{local?.description ?? service.description}</p>
            <div className="svc-card__actions"><Link prefetch={false} className="btn btn--primary btn--sm" href={requestHrefFor(service.slug)}>{t("Start", "शुरू करें", "শুরু করুন")} <ArrowRight size={16}/></Link><Link prefetch={false} className="btn btn--ghost btn--sm" href={href}>{t("Details", "जानकारी", "বিস্তারিত")}</Link></div>
          </article>;
        })}</div>
        <div className="note-card"><ShieldCheck size={22}/><p><b>{t("Independent service facilitator.", "स्वतंत्र सेवा सहायक।", "স্বাধীন পরিষেবা সহায়ক।")}</b> {t("Official and third-party fees are separate from our service charge.", "आधिकारिक और तीसरे पक्ष के शुल्क हमारे सेवा शुल्क से अलग हैं।", "সরকারি ও তৃতীয় পক্ষের ফি আমাদের সার্ভিস চার্জ থেকে আলাদা।")} <Link prefetch={false} href={`/services/${slug}`}>{t("Read in English →", "अंग्रेज़ी में पढ़ें →", "ইংরেজিতে পড়ুন →")}</Link></p></div>
      </div>
    </section>
    <JsonLd data={itemListLd(text.title, children.map((service) => ({ name: serviceName(service.slug, shortServiceName(service.title), lang), path: `/${lang}/services/${service.slug}` })))}/>
  </main>;
}
