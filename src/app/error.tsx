"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { useLocale } from "@/lib/use-locale";

const TEXT = {
  en: { eyebrow: "SOMETHING WENT WRONG", a: "This page didn’t load.", b: "Please try again.", lead: "It’s usually temporary. If it keeps happening, call", or: "or WhatsApp us.", offline: "You seem to be offline. Check your internet connection; this page reloads when you are back online.", retry: "Try again", reload: "Reload the page", home: "Go to the home page", ref: "Reference" },
  hi: { eyebrow: "कुछ गड़बड़ हो गई", a: "यह पेज नहीं खुला।", b: "कृपया फिर कोशिश करें।", lead: "यह आमतौर पर थोड़ी देर की समस्या होती है। बार-बार हो तो फ़ोन करें:", or: "या WhatsApp करें।", offline: "आप ऑफ़लाइन लगते हैं। इंटरनेट जाँचें; ऑनलाइन होते ही पेज दोबारा खुल जाएगा।", retry: "फिर कोशिश करें", reload: "पेज दोबारा खोलें", home: "होम पेज पर जाएँ", ref: "संदर्भ" },
  bn: { eyebrow: "কিছু ভুল হয়েছে", a: "এই পেজটি খোলেনি।", b: "আবার চেষ্টা করুন।", lead: "এটা সাধারণত সাময়িক সমস্যা। বারবার হলে ফোন করুন:", or: "বা WhatsApp করুন।", offline: "আপনি অফলাইন মনে হচ্ছে। ইন্টারনেট দেখুন; অনলাইন হলেই পেজ আবার খুলবে।", retry: "আবার চেষ্টা করুন", reload: "পেজ আবার লোড করুন", home: "হোম পেজে যান", ref: "রেফারেন্স" },
} as const;

/** Shown when a page fails to render. The customer can retry; nothing technical is displayed. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = useLocale();
  const t = TEXT[locale];
  const [online, setOnline] = useState(true);
  // A stale browser tab after a new release can't load its old script files: a full reload fixes it.
  const staleBuild = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(`${error.name} ${error.message}`);
  useEffect(() => { console.error("[page error]", error.digest ?? error.message); }, [error]);
  useEffect(() => {
    queueMicrotask(() => setOnline(navigator.onLine));
    const up = () => { setOnline(true); reset(); };
    const down = () => setOnline(false);
    window.addEventListener("online", up); window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, [reset]);
  return <main className="content-page"><section className="content-hero"><div className="container">
    <span className="eyebrow eyebrow-muted">{t.eyebrow}</span>
    <h1>{t.a}<br/><em>{t.b}</em></h1>
    <p>{online ? <>{t.lead} <a href={`tel:${site.phones.primary.e164}`}>{site.phones.primary.display}</a> {t.or}{error.digest ? ` ${t.ref}: ${error.digest}` : ""}</> : t.offline}</p>
    <div className="service-hero-actions">
      <button type="button" className="btn btn--primary" onClick={() => (staleBuild ? window.location.reload() : reset())}>{staleBuild ? t.reload : t.retry}</button>
      <Link className="btn btn--ghost" href={locale === "en" ? "/" : `/${locale}`}>{t.home}</Link>
    </div>
  </div></section></main>;
}
