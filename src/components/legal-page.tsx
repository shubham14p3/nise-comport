import { Fragment } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SiteHeader from "@/components/site-header";
import Breadcrumbs from "@/components/breadcrumbs";
import type { LegalBlock, LegalInline } from "@/lib/legal-markup";
import { loadLegalPage, type LegalSlug } from "@/lib/legal-pages";
import { LOCALE_META, type Locale } from "@/lib/i18n";
import { lp, tr } from "@/lib/tr";

function Inline({ parts }: { parts: LegalInline[] }) {
  return <>{parts.map((part, index) => {
    const content = part.bold ? <b>{part.text}</b> : part.text;
    if (!part.href) return <Fragment key={index}>{content}</Fragment>;
    return part.href.startsWith("/") ? <Link prefetch={false} key={index} href={part.href}>{content}</Link> : <a key={index} href={part.href} rel="noopener noreferrer">{content}</a>;
  })}</>;
}

function Blocks({ blocks }: { blocks: LegalBlock[] }) {
  return <>{blocks.map((block, index) => {
    if (block.kind === "h3") return <h3 key={index}>{block.text}</h3>;
    if (block.kind === "ul") return <ul key={index}>{block.items.map((item, i) => <li key={i}><span><Inline parts={item}/></span></li>)}</ul>;
    return <p key={index}>{block.lines.map((line, i) => <Fragment key={i}>{i > 0 && <br/>}<Inline parts={line}/></Fragment>)}</p>;
  })}</>;
}

/** Terms, Privacy and Refund pages. English text comes from Admin → Legal pages (or the built-in text); Hindi and Bengali use the built-in translation. */
export default async function LegalPage({ slug, path, crumb, eyebrow, title, em, lang = "en" }: { slug: LegalSlug; path: string; crumb: string; eyebrow: string; title: string; em: string; lang?: Locale }) {
  const t = tr(lang);
  const { doc, updated } = await loadLegalPage(slug, lang === "hi" || lang === "bn" ? lang : "en");
  const home = lang === "en" ? "/" : `/${lang}`;
  const L = (href: string) => lp(lang, href);
  return <main className="content-page" lang={LOCALE_META[lang].htmlLang}><SiteHeader/>
    <article className="container legal-content">
      <Breadcrumbs items={[{ name: t("Home", "होम", "হোম"), path: home }, { name: crumb, path: L(path) }]} label={t("Breadcrumb", "ब्रेडक्रंब", "ব্রেডক্রাম্ব")}/>
      <Link prefetch={false} href={home} className="back-small"><ArrowLeft size={14}/> {t("Home", "होम", "হোম")}</Link>
      <span className="eyebrow eyebrow-muted">{eyebrow}</span>
      <h1>{title} <em>{em}</em></h1>
      <p className="legal-updated">{t("Effective date", "प्रभावी तारीख", "কার্যকর তারিখ")}: {updated}</p>
      {lang !== "en" && <p className="legal-updated">{t("", "यह हिंदी अनुवाद सुविधा के लिए है। दोनों में अंतर होने पर अंग्रेज़ी पाठ मान्य होगा।", "এই বাংলা অনুবাদ সুবিধার জন্য। দুটির মধ্যে পার্থক্য থাকলে ইংরেজি পাঠ্যই প্রযোজ্য হবে।")} <Link prefetch={false} href={path}>{t("", "अंग्रेज़ी पाठ पढ़ें", "ইংরেজি পাঠ্য পড়ুন")}</Link></p>}
      {doc.intro.length > 0 && <div className="legal-intro"><Blocks blocks={doc.intro}/></div>}
      <nav className="legal-toc" aria-label={t("Contents", "विषय-सूची", "সূচিপত্র")}><b>{t("In this policy", "इस नीति में", "এই নীতিতে")}</b><ol>{doc.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ol></nav>
      {doc.sections.map((section, index) => <section key={section.id} id={section.id} className="legal-section"><h2>{index + 1}. {section.title}</h2><Blocks blocks={section.blocks}/></section>)}
      <p className="legal-updated">{t("Read together with our ", "इन्हें हमारी ", "এগুলি আমাদের ")}<Link prefetch={false} href={L("/terms")}>{t("Terms and Conditions", "नियम और शर्तें", "শর্তাবলি")}</Link>, <Link prefetch={false} href={L("/privacy")}>{t("Privacy Policy", "गोपनीयता नीति", "গোপনীয়তা নীতি")}</Link>, <Link prefetch={false} href={L("/refund-policy")}>{t("Refund & Cancellation Policy", "रिफ़ंड और रद्दीकरण नीति", "রিফান্ড ও বাতিল নীতি")}</Link>{t(" and ", " और ", " ও ")}<Link prefetch={false} href={L("/pricing")}>{t("Pricing", "मूल्य", "মূল্য")}</Link>{t(".", " के साथ पढ़ें।", " সঙ্গে মিলিয়ে পড়ুন।")}</p>
    </article>
  </main>;
}
