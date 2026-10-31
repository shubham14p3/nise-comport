import SiteHeader from "@/components/site-header";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import FaqFinder, { type FinderFaq } from "@/components/faq-finder";
import JsonLd from "@/components/json-ld";
import { bengaliServices } from "@/lib/bengali";
import { categoryMeta } from "@/lib/categories";
import { GENERAL_TOPICS, generalFaqs } from "@/lib/faq-data";
import { hindiServices } from "@/lib/hindi";
import { LOCALE_META, type Locale } from "@/lib/i18n";
import { serviceName } from "@/lib/i18n-forms";
import { panGuides } from "@/lib/pan-content";
import { serviceEditorial } from "@/lib/service-editorial";
import { shortServiceName } from "@/lib/services";
import { allServices } from "@/lib/site-content";
import { faqLd } from "@/lib/structured-data";
import { GENERAL_TOPICS_TEXT, generalFaqsBn, generalFaqsHi } from "@/lib/translations/faq-general";
import { lp, tr } from "@/lib/tr";

export async function FaqView({ lang }: { lang: Locale }) {
  const t = tr(lang);
  const services = await allServices();
  const localServices = new Map((lang === "hi" ? hindiServices : lang === "bn" ? bengaliServices : []).map((service) => [service.slug, service]));
  const generalLocal = lang === "hi" ? generalFaqsHi : generalFaqsBn;
  const topicName = (topic: string) => (lang === "en" ? topic : GENERAL_TOPICS_TEXT[topic]?.[lang] ?? topic);
  const topicOf = (categorySlug: string) => {
    const meta = categoryMeta.find((item) => item.slug === categorySlug);
    return meta ? meta.short[lang] : t("Other services", "अन्य सेवाएँ", "অন্যান্য পরিষেবা");
  };
  const seen = new Set<string>();
  const faqs: FinderFaq[] = [];
  const add = (faq: FinderFaq) => {
    const key = faq.question.trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    faqs.push(faq);
  };

  generalFaqs.forEach((faq, index) => {
    const local = lang === "en" ? faq : generalLocal[index];
    add({ id: `g-${index}`, topic: topicName(faq.topic), question: local?.question ?? faq.question, answer: local?.answer ?? faq.answer });
  });
  for (const service of services) {
    const local = localServices.get(service.slug);
    // In Hindi and Bengali only the translated service answers are shown, so the page never mixes languages.
    if (lang !== "en" && !local) continue;
    const topic = topicOf(service.categorySlug);
    const href = lp(lang, `/services/${service.slug}`);
    const shortTitle = lang === "en" ? service.title.replace(/\s+in\s+Jamshedpur.*$/i, "").replace(/\s*\(.*$/, "") : serviceName(service.slug, shortServiceName(service.title), lang);
    const entries = lang === "en" ? [...(service.faqs ?? []), ...(serviceEditorial[service.slug]?.faqs ?? [])] : local!.faqs;
    entries.forEach((faq, index) => add({ id: `s-${service.slug}-${index}`, topic, question: faq.question, answer: faq.answer, serviceTitle: shortTitle, serviceHref: href }));
    if (lang === "en" && service.slug === "pan-card") {
      for (const guide of panGuides) guide.faqs.forEach((faq, index) =>
        add({ id: `pan-${guide.slug}-${index}`, topic, question: faq.q, answer: faq.a, serviceTitle: `PAN guide: ${guide.title}`, serviceHref: `/pan/${guide.slug}` }));
    }
  }

  const generalNames = GENERAL_TOPICS.map(topicName) as string[];
  const serviceTopics = [...new Set(faqs.map((faq) => faq.topic).filter((name) => !generalNames.includes(name)))];
  const topics = [...generalNames, ...serviceTopics];
  const home = lang === "en" ? "/" : `/${lang}`;

  return <main className="content-page" lang={LOCALE_META[lang].htmlLang}><SiteHeader/>
    <section className="content-hero"><div className="container">
      <Breadcrumbs label={t("Breadcrumb", "ब्रेडक्रंब", "ব্রেডক্রাম্ব")} items={[{ name: t("Home", "होम", "হোম"), path: home }, { name: t("FAQs", "सवाल-जवाब", "প্রশ্নোত্তর"), path: lp(lang, "/faq") }]}/>
      <Link prefetch={false} href={home} className="back-small"><ArrowLeft size={14}/> {t("Home", "होम", "হোম")}</Link>
      <span className="eyebrow eyebrow-muted">{t("GOOD QUESTIONS, CLEAR ANSWERS", "अच्छे सवाल, साफ़ जवाब", "ভালো প্রশ্ন, স্পষ্ট উত্তর")}</span>
      <h1>{t("Frequently asked", "अक्सर पूछे जाने वाले", "প্রায়ই জিজ্ঞাসিত")}<br/><em>{t("questions.", "सवाल।", "প্রশ্ন।")}</em></h1>
      <p>{t("Search any question, or pick a topic or service. Can’t find yours? ", "कोई भी सवाल खोजिए, या कोई विषय या सेवा चुनिए। आपका सवाल नहीं मिला? ", "যেকোনো প্রশ্ন খুঁজুন, বা কোনও বিষয় বা পরিষেবা বাছুন। আপনারটা পেলেন না? ")}<Link prefetch={false} href={lp(lang, "/contact")}>{t("Ask the service desk", "सर्विस डेस्क से पूछिए", "সার্ভিস ডেস্ককে জিজ্ঞাসা করুন")}</Link>.</p>
    </div></section>
    <section className="container"><FaqFinder faqs={faqs} topics={topics} lang={lang}/></section>
    <JsonLd data={faqLd(faqs.slice(0, 60).map((faq) => ({ question: faq.question, answer: faq.answer })))}/>
  </main>;
}
