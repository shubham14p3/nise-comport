"use client";

import Link from "next/link";
import { ArrowUpRight, Phone } from "lucide-react";
import { site } from "@/lib/site";
import { useLocale } from "@/lib/use-locale";

const TEXT = {
  en: { eyebrow: "404 · PAGE NOT FOUND", a: "We couldn’t find", b: "that page.", lead: "The link may be old or mistyped. Try one of these, or call us on", home: "Home" },
  hi: { eyebrow: "404 · पेज नहीं मिला", a: "यह पेज", b: "नहीं मिला।", lead: "लिंक पुराना या गलत हो सकता है। नीचे में से कोई चुनें, या हमें फ़ोन करें:", home: "होम" },
  bn: { eyebrow: "404 · পেজ পাওয়া যায়নি", a: "এই পেজটি", b: "পাওয়া যায়নি।", lead: "লিংকটি পুরনো বা ভুল হতে পারে। নিচের একটি বেছে নিন, বা আমাদের ফোন করুন:", home: "হোম" },
} as const;

const LINKS = {
  en: ["All services", "PAN card help", "Aadhaar update help", "Income, caste & residence certificates", "Printing & photocopy", "Local guides", "Contact & directions"],
  hi: ["सभी सेवाएँ", "पैन कार्ड मदद", "आधार अपडेट मदद", "आय, जाति व निवास प्रमाण पत्र", "प्रिंटिंग व फ़ोटोकॉपी", "स्थानीय गाइड", "संपर्क व रास्ता"],
  bn: ["সব পরিষেবা", "প্যান কার্ড সাহায্য", "আধার আপডেট সাহায্য", "আয়, জাতি ও বাসস্থান শংসাপত্র", "প্রিন্টিং ও ফটোকপি", "স্থানীয় গাইড", "যোগাযোগ ও ঠিকানা"],
} as const;

const HREFS = ["/services", "/services/pan-card", "/services/aadhaar", "/services/income-caste-residence-certificate", "/print", "/blog", "/contact"];

/** Friendly 404 text in the visitor's language (the page URL or the saved language choice decides). */
export default function NotFoundContent() {
  const locale = useLocale();
  const t = TEXT[locale];
  const home = locale === "en" ? "/" : `/${locale}`;
  return <div className="container">
    <span className="eyebrow eyebrow-muted">{t.eyebrow}</span>
    <h1>{t.a}<br/><em>{t.b}</em></h1>
    <p>{t.lead} <a href={`tel:${site.phones.primary.e164}`}><Phone size={13}/> {site.phones.primary.display}</a>.</p>
    <div className="related-links">
      <Link prefetch={false} href={home}>{t.home} <ArrowUpRight size={13}/></Link>
      {HREFS.map((href, index) => <Link prefetch={false} key={href} href={href}>{LINKS[locale][index]} <ArrowUpRight size={13}/></Link>)}
    </div>
    {locale === "en" && <p className="language-switch"><Link prefetch={false} href="/hi" lang="hi">हिन्दी में देखें</Link> · <Link prefetch={false} href="/bn" lang="bn">বাংলায় দেখুন</Link></p>}
  </div>;
}
