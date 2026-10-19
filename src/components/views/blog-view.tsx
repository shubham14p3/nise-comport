import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import FaqSection from "@/components/faq-section";
import JsonLd from "@/components/json-ld";
import OfficialLinks from "@/components/official-links";
import SiteHeader from "@/components/site-header";
import { articleDates, articles, findArticle, GUIDE_AUTHOR, GUIDE_AUTHOR_ROLE, type Article } from "@/lib/content";
import { LOCALE_META, type Locale } from "@/lib/i18n";
import { serviceName } from "@/lib/i18n-forms";
import { findService, shortServiceName } from "@/lib/services";
import { site, whatsappLink } from "@/lib/site";
import { articleLd, itemListLd } from "@/lib/structured-data";
import { lp, tr } from "@/lib/tr";
import { blogBn, blogHi, CATEGORY_LABELS } from "@/lib/translations/blog-tr";
import type { ArticleTr } from "@/lib/translations/blog-types";

const localeTag = (lang: Locale) => (lang === "hi" ? "hi-IN" : lang === "bn" ? "bn-IN" : "en-IN");
const dateText = (value: string, lang: Locale, month: "short" | "long") => new Date(`${value}T00:00:00Z`).toLocaleDateString(localeTag(lang), { day: "numeric", month, year: "numeric", timeZone: "UTC" });
const slugOf = (category: string) => category.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Translated text for a guide (English falls back to the source article). */
export function localArticle(article: Article, lang: Locale): ArticleTr {
  const local = lang === "hi" ? blogHi[article.slug] : lang === "bn" ? blogBn[article.slug] : undefined;
  return local ?? { title: article.title, excerpt: article.excerpt, seoTitle: article.seoTitle, imageAlt: article.imageAlt, paragraphs: article.paragraphs, checklist: article.checklist, sections: article.sections, faqs: article.faqs };
}

export const categoryName = (category: string, lang: Locale) => (lang === "en" ? category : CATEGORY_LABELS[category]?.[lang] ?? category);

export function BlogIndexView({ lang }: { lang: Locale }) {
  const t = tr(lang);
  const byNewest = [...articles].sort((a, b) => articleDates(b).updatedAt.localeCompare(articleDates(a).updatedAt));
  const categories = [...new Set(byNewest.map((article) => article.category))];
  const base = lp(lang, "/blog");
  return <main className="content-page" lang={LOCALE_META[lang].htmlLang}><SiteHeader/>
    <section className="content-hero"><div className="container">
      <Breadcrumbs items={[{ name: t("Home", "होम", "হোম"), path: lp(lang, "/") }, { name: t("Guides", "गाइड", "গাইড"), path: base }]}/>
      <span className="eyebrow eyebrow-muted">{t("LOCAL KNOW-HOW, WITHOUT THE GUESSWORK", "स्थानीय जानकारी, बिना अंदाज़े के", "স্থানীয় জ্ঞান, আন্দাজ ছাড়াই")}</span>
      <h1>{lang === "en" ? <>Helpful guides for<br/><em>Jamshedpur residents.</em></> : <>{t("", "जमशेदपुर के निवासियों के लिए", "জামশেদপুরের বাসিন্দাদের জন্য")}<br/><em>{t("", "उपयोगी गाइड।", "কাজের গাইড।")}</em></>}</h1>
      <p>{t("Prepare for common digital, government and document services with plain-language checklists from your Kharangajhar service desk. Each guide links to the official source.", "आम डिजिटल, सरकारी और दस्तावेज़ सेवाओं की तैयारी के लिए खरंगाझार सेवा डेस्क की सरल भाषा वाली चेकलिस्ट। हर गाइड आधिकारिक स्रोत से जुड़ी है।", "সাধারণ ডিজিটাল, সরকারি ও নথি পরিষেবার প্রস্তুতির জন্য খরংগাঝাড় সার্ভিস ডেস্কের সহজ ভাষার চেকলিস্ট। প্রতিটি গাইডে সরকারি উৎসের লিঙ্ক আছে।")}</p>
      <nav className="guide-categories" aria-label={t("Guide topics", "गाइड के विषय", "গাইডের বিষয়")}>{categories.map((category) => <a key={category} href={`#${slugOf(category)}`}>{categoryName(category, lang)}</a>)}</nav>
    </div></section>
    {categories.map((category) => <section className="container guide-category" key={category} id={slugOf(category)}>
      <h2>{categoryName(category, lang)}</h2>
      <div className="editorial-grid">{byNewest.filter((article) => article.category === category).map((article) => {
        const local = localArticle(article, lang);
        const { updatedAt } = articleDates(article);
        const href = lp(lang, `/blog/${article.slug}`);
        return <article className="editorial-card" key={article.slug}><Link href={href} tabIndex={-1} aria-hidden="true"><Image src={article.image} alt="" width={700} height={450} sizes="(max-width: 700px) 100vw, 33vw"/></Link><div>
          <span>{categoryName(article.category, lang)} · {t("Updated", "अपडेट", "আপডেট")} <time dateTime={updatedAt}>{dateText(updatedAt, lang, "short")}</time></span>
          <h3><Link href={href}>{local.title}</Link></h3><p>{local.excerpt}</p>
          <Link className="arrow-link" href={href} aria-label={`${t("Read the guide", "गाइड पढ़ें", "গাইড পড়ুন")}: ${local.title}`}>{t("Read the guide", "गाइड पढ़ें", "গাইড পড়ুন")} <ArrowUpRight size={15}/></Link>
        </div></article>;
      })}</div>
    </section>)}
    <section className="container provider-note"><p>{t("Guides are general preparation information, not a promise of eligibility or approval. Always confirm current official requirements and fees.", "गाइड सामान्य तैयारी की जानकारी हैं, पात्रता या मंज़ूरी का वादा नहीं। मौजूदा सरकारी आवश्यकताएँ और शुल्क हमेशा पक्के कर लें।", "গাইডগুলি সাধারণ প্রস্তুতির তথ্য, যোগ্যতা বা অনুমোদনের প্রতিশ্রুতি নয়। বর্তমান সরকারি শর্ত ও ফি সবসময় নিশ্চিত করুন।")} {lang === "en" ? <a href="/blog/feed.xml" type="application/rss+xml">RSS feed</a> : null}</p></section>
    <JsonLd data={itemListLd(t("NISE COMPORT local guides", "NISE COMPORT के स्थानीय गाइड", "NISE COMPORT-এর স্থানীয় গাইড"), byNewest.map((article) => ({ name: localArticle(article, lang).title, path: lp(lang, `/blog/${article.slug}`) })))}/>
  </main>;
}

export function ArticleView({ lang, slug }: { lang: Locale; slug: string }) {
  const item = findArticle(slug);
  if (!item) return null;
  const t = tr(lang);
  const local = localArticle(item, lang);
  const { publishedAt, updatedAt } = articleDates(item);
  const service = findService(item.serviceSlug);
  const related = articles.filter((article) => article.slug !== item.slug && (article.serviceSlug === item.serviceSlug || article.category === item.category)).slice(0, 3);
  const path = lp(lang, `/blog/${item.slug}`);
  const home = lp(lang, "/");
  const index = lp(lang, "/blog");
  const serviceTitle = service ? (lang === "en" ? service.title : serviceName(service.slug, service.title, lang)) : null;
  return <main className="content-page" lang={LOCALE_META[lang].htmlLang}><SiteHeader/>
    <JsonLd data={articleLd({ title: local.title, description: local.excerpt, path, image: item.image, publishedAt, updatedAt, author: GUIDE_AUTHOR, section: categoryName(item.category, lang), inLanguage: localeTag(lang) })}/>
    <article className="container article-page">
      <Breadcrumbs items={[{ name: t("Home", "होम", "হোম"), path: home }, { name: t("Guides", "गाइड", "গাইড"), path: index }, { name: local.title, path }]}/>
      <Link className="back-small" href={index}><ArrowLeft size={14}/> {t("All local guides", "सभी स्थानीय गाइड", "সব স্থানীয় গাইড")}</Link>
      <span className="eyebrow eyebrow-muted">{lang === "en" ? `${item.category.toUpperCase()} · JAMSHEDPUR` : `${categoryName(item.category, lang)} · ${t("", "जमशेदपुर", "জামশেদপুর")}`}</span>
      <h1>{local.title}</h1>
      <p className="article-excerpt">{local.excerpt}</p>
      <p className="article-meta">{t("By", "लेखक:", "লেখক:")} <b>{GUIDE_AUTHOR}</b>, {GUIDE_AUTHOR_ROLE} · {t("Published", "प्रकाशित", "প্রকাশিত")} <time dateTime={publishedAt}>{dateText(publishedAt, lang, "long")}</time>{updatedAt !== publishedAt ? <> · {t("Updated", "अपडेट", "আপডেট")} <time dateTime={updatedAt}>{dateText(updatedAt, lang, "long")}</time></> : null}</p>
      <Image className="article-cover" src={item.image} alt={local.imageAlt ?? local.title} width={1200} height={720} priority sizes="(max-width: 900px) 100vw, 800px"/>
      <div className="article-layout"><div>
        {local.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        {local.sections?.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</section>)}
        <h2>{t("Before you start", "शुरू करने से पहले", "শুরু করার আগে")}</h2>
        <ul>{local.checklist.map((point) => <li key={point}><Check size={16}/>{point}</li>)}</ul>
        {item.officialLinks?.length ? <><h2>{t("Official sources", "आधिकारिक स्रोत", "সরকারি উৎস")}</h2><OfficialLinks variant="list" links={item.officialLinks} service={{ slug: service?.slug ?? item.serviceSlug, title: service ? shortServiceName(service.title) : item.title, documents: service && "documents" in service ? service.documents ?? [] : [] }}/></> : null}
        <p className="article-disclaimer">{t("Requirements can change. The responsible government department, insurer, institution or service provider decides eligibility, fees, processing and final outcomes. NISE COMPORT is an independent CSC / Pragya Kendra service centre, not a government office.", "आवश्यकताएँ बदल सकती हैं। पात्रता, शुल्क, प्रक्रिया और अंतिम नतीजे संबंधित सरकारी विभाग, बीमा कंपनी, संस्थान या सेवा प्रदाता तय करते हैं। NISE COMPORT एक स्वतंत्र CSC / प्रज्ञा केंद्र सेवा केंद्र है, सरकारी कार्यालय नहीं।", "শর্ত বদলাতে পারে। যোগ্যতা, ফি, প্রক্রিয়া ও চূড়ান্ত ফল সংশ্লিষ্ট সরকারি বিভাগ, বিমা কোম্পানি, প্রতিষ্ঠান বা পরিষেবা প্রদানকারী ঠিক করে। NISE COMPORT একটি স্বাধীন CSC / প্রজ্ঞা কেন্দ্র সেবা কেন্দ্র, সরকারি অফিস নয়।")}</p>
      </div><aside><strong>{t("Need help with this?", "इसमें मदद चाहिए?", "এ বিষয়ে সাহায্য লাগবে?")}</strong><p>{t(`Talk to the NISE COMPORT team in Kharangajhar, Telco, Jamshedpur. Call ${site.phones.primary.display}.`, `खरंगाझार, टेल्को, जमशेदपुर में NISE COMPORT टीम से बात करें। कॉल करें ${site.phones.primary.display}।`, `খরংগাঝাড়, টেলকো, জামশেদপুরে NISE COMPORT টিমের সঙ্গে কথা বলুন। ফোন করুন ${site.phones.primary.display}।`)}</p>{service && <Link className="button button-green" href={lp(lang, `/services/${service.slug}`)}>{serviceTitle} <ArrowUpRight size={15}/></Link>}<a href={whatsappLink(`Hi NISE COMPORT, I read your guide "${local.title}" and need help.`)} className="article-whatsapp" target="_blank" rel="noopener noreferrer">{t("Ask on WhatsApp", "WhatsApp पर पूछें", "WhatsApp-এ জিজ্ঞাসা করুন")}</a><a href={site.mapsUrl} className="article-whatsapp" target="_blank" rel="noopener noreferrer">{t("Get directions", "रास्ता देखें", "রাস্তা দেখুন")}</a></aside></div>
    </article>
    {local.faqs?.length ? <FaqSection faqs={local.faqs} title={t("Frequently asked questions", "अक्सर पूछे जाने वाले सवाल", "প্রায়ই জিজ্ঞাসিত প্রশ্ন")} eyebrow={t("QUESTIONS CUSTOMERS ASK", "ग्राहक जो सवाल पूछते हैं", "গ্রাহকেরা যে প্রশ্ন করেন")} lang={LOCALE_META[lang].htmlLang}/> : null}
    {related.length ? <section className="container related-guides"><span className="eyebrow eyebrow-muted">{t("KEEP READING", "आगे पढ़ें", "আরও পড়ুন")}</span><h2>{t("Related guides", "संबंधित गाइड", "সম্পর্কিত গাইড")}</h2><div className="guide-teasers">{related.map((guide) => { const g = localArticle(guide, lang); const href = lp(lang, `/blog/${guide.slug}`); return <article key={guide.slug}><span>{categoryName(guide.category, lang)}</span><h3><Link href={href}>{g.title}</Link></h3><p>{g.excerpt}</p><Link className="arrow-link" href={href} aria-label={`${t("Read", "पढ़ें", "পড়ুন")}: ${g.title}`}>{t("Read guide", "गाइड पढ़ें", "গাইড পড়ুন")} <ArrowRight size={14}/></Link></article>; })}</div></section> : null}
  </main>;
}
