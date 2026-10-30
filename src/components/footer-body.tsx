"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Clock3, Mail, MapPin, Phone } from "lucide-react";
import BrandWordmark from "@/components/brand-wordmark";
import { MAIL_PATH } from "@/lib/mail-route";
import { CategoryIcon, WhatsAppIcon } from "@/components/icons";
import { categoryMeta } from "@/lib/categories";
import { serviceCatalog } from "@/lib/services";
import { site, whatsappLink } from "@/lib/site";
import { lp, tr } from "@/lib/tr";
import { useLocale } from "@/lib/use-locale";

const POPULAR: [string, string, string, string][] = [
  ["/services/pan-card", "PAN card apply & correction", "पैन कार्ड आवेदन व सुधार", "প্যান কার্ড আবেদন ও সংশোধন"],
  ["/services/aadhaar", "Aadhaar update help", "आधार अपडेट में मदद", "আধার আপডেটে সাহায্য"],
  ["/services/income-caste-residence-certificate", "Income, caste & residence certificates", "आय, जाति व निवास प्रमाण पत्र", "আয়, জাতি ও বাসস্থান শংসাপত্র"],
  ["/services/aeps-money-transfer", "AEPS & money transfer", "AEPS व मनी ट्रांसफर", "AEPS ও টাকা পাঠানো"],
  ["/services/bike-insurance", "Bike insurance", "बाइक बीमा", "বাইক বিমা"],
  ["/services/website-creation", "Website creation for business", "व्यवसाय के लिए वेबसाइट", "ব্যবসার জন্য ওয়েবসাইট"],
  ["/services/photo-studio", "Photo studio & passport photos", "फोटो स्टूडियो व पासपोर्ट फोटो", "ফটো স্টুডিও ও পাসপোর্ট ছবি"],
  ["/services/printing-scanning", "Printing & photocopy", "प्रिंटिंग व फ़ोटोकॉपी", "প্রিন্টিং ও ফটোকপি"],
  ["/services/jeevan-pramaan", "Jeevan Pramaan life certificate", "जीवन प्रमाण जीवित प्रमाणपत्र", "জীবন প্রমাণ জীবিত শংসাপত্র"],
];

/**
 * Shared footer on every page: the same name, address and phone (NAP) as the Google Business
 * Profile, plus links to the most important pages so every page passes link value to them.
 */
export default function FooterBody({ year, partners, hoursByLocale, mapsUrl, reviewUrl }: { year: number; partners: ReactNode; hoursByLocale: Record<"en" | "hi" | "bn", string[]>; mapsUrl: string; reviewUrl: string | null }) {
  const lc = useLocale();
  const t = tr(lc);
  // Use the server-rendered hours snapshot on both SSR and hydration.
  // NEXT_PUBLIC_OPENING_HOURS is dynamic in site.ts and unavailable in the browser bundle.
  const hours = hoursByLocale[lc];
  const href = (path: string) => lp(lc, path);
  return <footer className="site-footer">
    <div className="footer-glow" aria-hidden="true"/>
    <div className="container footer-main">
      <div className="footer-brand">
        <Link prefetch={false} className="brand brand--on-dark" href={href("/")} aria-label={`${site.name} home`}><BrandWordmark/></Link>
        <p>{t("Your neighbourhood CSC & Pragya Kendra in Kharangajhar, Telco. Sarkari & digital kaam, sorted with a human touch.", "खरंगाझार, टेल्को में आपका अपना CSC व प्रज्ञा केंद्र। सरकारी और डिजिटल काम, अपनेपन के साथ।", "খরংগাঝাড়, টেলকোতে আপনার নিজের CSC ও প্রজ্ঞা কেন্দ্র। সরকারি ও ডিজিটাল কাজ, আপন করে।")}</p>
        <div className="footer-cta">
          <a className="btn btn--wa btn--sm" href={whatsappLink(t("Hello NISE COMPORT, I need help with a service.", "नमस्ते NISE COMPORT, मुझे एक सेवा में मदद चाहिए।", "নমস্কার NISE COMPORT, একটি পরিষেবায় আমার সাহায্য দরকার।"))} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={17}/> WhatsApp</a>
          <a className="btn btn--glass btn--sm" href={`tel:${site.phones.primary.e164}`}><Phone size={16}/> {t("Call", "फ़ोन करें", "ফোন করুন")}</a>
        </div>
        <div className="footer-langs" aria-label="Languages">
          <Link prefetch={false} href="/" hrefLang="en-IN" lang="en">English</Link>
          <Link prefetch={false} href="/hi" hrefLang="hi-IN" lang="hi">हिन्दी</Link>
          <Link prefetch={false} href="/bn" hrefLang="bn-IN" lang="bn">বাংলা</Link>
        </div>
      </div>
      <nav className="footer-col" aria-label="Service categories">
        <strong>{t("Services", "सेवाएँ", "পরিষেবা")}</strong>
        {serviceCatalog.map((group) => {
          const meta = categoryMeta.find((item) => item.slug === group.slug);
          return <Link prefetch={false} key={group.slug} href={href(`/services/${group.slug}`)}>{meta && <span className={`mini-icon tone-${meta.tone}`}><CategoryIcon icon={meta.icon} size={14}/></span>}{meta?.short[lc] ?? group.title}</Link>;
        })}
      </nav>
      <nav className="footer-col" aria-label="Popular services">
        <strong>{t("Popular", "लोकप्रिय", "জনপ্রিয়")}</strong>
        {POPULAR.map(([path, en, hi, bn]) => <Link prefetch={false} key={path} href={href(path)}>{t(en, hi, bn)}</Link>)}
        <Link prefetch={false} href={href("/services")}>{t("All services →", "सभी सेवाएँ →", "সব পরিষেবা →")}</Link>
      </nav>
      <nav className="footer-col" aria-label="Help and account">
        <strong>{t("Help", "सहायता", "সাহায্য")}</strong>
        <Link prefetch={false} href="/request">{t("Start a request", "अनुरोध शुरू करें", "অনুরোধ শুরু করুন")}</Link>
        <Link prefetch={false} href="/track">{t("Track a request", "अनुरोध ट्रैक करें", "অনুরোধ ট্র্যাক করুন")}</Link>
        <Link prefetch={false} href="/offers">{t("Offers", "ऑफ़र", "অফার")}</Link>
        <Link prefetch={false} href={href("/pricing")}>{t("Pricing", "दरें", "দর")}</Link>
        <Link prefetch={false} href={href("/gallery")}>{t("Gallery", "गैलरी", "গ্যালারি")}</Link>
        <Link prefetch={false} href={href("/blog")}>{t("Local guides", "स्थानीय गाइड", "স্থানীয় গাইড")}</Link>
        <Link prefetch={false} href={href("/faq")}>{t("FAQs", "सवाल-जवाब", "প্রশ্নোত্তর")}</Link>
        <Link prefetch={false} href={href("/about")}>{t("About us", "हमारे बारे में", "আমাদের সম্পর্কে")}</Link>
        <Link prefetch={false} href={href("/team")}>{t("Our team", "हमारी टीम", "আমাদের টিম")}</Link>
        <Link prefetch={false} href={href("/areas-we-serve")}>{t("Areas we serve", "हम कहाँ सेवा देते हैं", "আমরা যেখানে সেবা দিই")}</Link>
        <strong className="footer-col__sub">{t("Policies", "नीतियाँ", "নীতি")}</strong>
        <Link prefetch={false} href={href("/terms")}>{t("Terms and Conditions", "नियम और शर्तें", "নিয়ম ও শর্তাবলি")}</Link>
        <Link prefetch={false} href={href("/refund-policy")}>{t("Refund & Cancellation Policy", "रिफ़ंड व रद्दीकरण नीति", "রিফান্ড ও বাতিল নীতি")}</Link>
        <Link prefetch={false} href={href("/privacy")}>{t("Privacy Policy", "गोपनीयता नीति", "গোপনীয়তা নীতি")}</Link>
        <Link prefetch={false} href={href("/contact")}>{t("Contact us", "संपर्क करें", "যোগাযোগ করুন")}</Link>
      </nav>
      <div className="footer-col footer-visit">
        <strong>{t("Visit us", "हमसे मिलें", "আমাদের কাছে আসুন")}</strong>
        <address>
          <p><MapPin size={16} aria-hidden="true"/><span><b>{site.name}</b><br/>{(lc === "hi" ? [site.address.hindi] : lc === "bn" ? [site.address.bengali] : site.address.lines).map((line) => <span key={line}>{line}<br/></span>)}</span></p>
        </address>
        <p><Clock3 size={16} aria-hidden="true"/><span>{hours.length ? hours.join(" · ") : t("Mon–Sat · call before visiting for today’s timings", "सोम–शनि · आने से पहले आज के समय के लिए फ़ोन करें", "সোম–শনি · আসার আগে আজকের সময় জানতে ফোন করুন")}</span></p>
        <p><Phone size={16} aria-hidden="true"/><span><a href={`tel:${site.phones.primary.e164}`}>{site.phones.primary.display}</a><br/><a href={`tel:${site.phones.secondary.e164}`}>{site.phones.secondary.display}</a><br/><a href={`tel:${site.phones.landline.e164}`}>{site.phones.landline.display}</a></span></p>
        <p><Mail size={16} aria-hidden="true"/><a href={`mailto:${site.email}`}>{site.email}</a></p>
        <a className="footer-directions" href={mapsUrl} target="_blank" rel="noopener noreferrer">{t("Get directions", "रास्ता देखें", "দিকনির্দেশ দেখুন")} <ArrowUpRight size={15} aria-hidden="true"/></a>
        {reviewUrl && <a className="footer-directions" href={reviewUrl} target="_blank" rel="noopener noreferrer">{t("Review us on Google", "Google पर रिव्यू दें", "Google-এ রিভিউ দিন")} <ArrowUpRight size={15} aria-hidden="true"/></a>}
      </div>
    </div>
    <div className="container footer-trust">
      <div className="footer-trust__head"><b>{t("Services & portals we help you use", "जिन सेवाओं और पोर्टलों में हम मदद करते हैं", "যেসব পরিষেবা ও পোর্টালে আমরা সাহায্য করি")}</b><span>{t("We are an independent CSC / Pragya Kendra service point. These names belong to their owners.", "हम एक स्वतंत्र CSC / प्रज्ञा केंद्र सेवा बिंदु हैं। ये नाम उनके मालिकों के हैं।", "আমরা একটি স্বাধীন CSC / প্রজ্ঞা কেন্দ্র পরিষেবা কেন্দ্র। এই নামগুলি তাদের মালিকদের।")}</span></div>
      {partners}
      <ul className="footer-pride">
        <li>{t("🇮🇳 Seva from Jamshedpur, Jharkhand", "🇮🇳 जमशेदपुर, झारखंड से सेवा", "🇮🇳 জামশেদপুর, ঝাড়খণ্ড থেকে সেবা")}</li>
        <li>{t("Udyam-registered local business", "उद्यम-पंजीकृत स्थानीय व्यवसाय", "উদ্যম-নিবন্ধিত স্থানীয় ব্যবসা")}</li>
        <li>English · हिन्दी · বাংলা</li>
        <li>{t("Kharangajhar, Telco · Since 1995", "खरंगाझार, टेल्को · 1995 से", "খরংগাঝাড়, টেলকো · ১৯৯৫ সাল থেকে")}</li>
      </ul>
      {/* <nav className="footer-policies" aria-label="Policies">
        <Link prefetch={false} href="/terms">Terms and Conditions</Link><Link prefetch={false} href="/refund-policy">Refund &amp; Cancellation Policy</Link><Link prefetch={false} href="/privacy">Privacy Policy</Link><Link prefetch={false} href="/pricing">Pricing</Link>
      </nav> */}
    </div>
    <div className="container footer-bottom">
      <p>{t("NISE COMPORT is an independent CSC / Pragya Kendra service centre, not a government office, bank or insurer. Official and third-party fees are separate from our service charge; final approvals rest with the relevant authority.", "NISE COMPORT एक स्वतंत्र CSC / प्रज्ञा केंद्र है, सरकारी कार्यालय, बैंक या बीमा कंपनी नहीं। सरकारी और तीसरे पक्ष का शुल्क हमारे सेवा शुल्क से अलग है; अंतिम मंज़ूरी संबंधित प्राधिकरण की होती है।", "NISE COMPORT একটি স্বাধীন CSC / প্রজ্ঞা কেন্দ্র, সরকারি অফিস, ব্যাংক বা বিমা কোম্পানি নয়। সরকারি ও তৃতীয় পক্ষের ফি আমাদের সার্ভিস চার্জ থেকে আলাদা; চূড়ান্ত অনুমোদন সংশ্লিষ্ট কর্তৃপক্ষের।")}</p>
      <div className="footer-bottom__row"><span>© {year} {site.name}. {t("All rights reserved.", "सर्वाधिकार सुरक्षित।", "সর্বস্বত্ব সংরক্ষিত।")}</span><span><Link prefetch={false} href={href("/contact")}>{t("Contact", "संपर्क", "যোগাযোগ")}</Link><Link prefetch={false} href="/login">{t("Admin login", "एडमिन लॉगिन", "অ্যাডমিন লগইন")}</Link><Link prefetch={false} href={MAIL_PATH}>{t("Mail login", "मेल लॉगिन", "মেল লগইন")}</Link></span></div>
    </div>
  </footer>;
}
