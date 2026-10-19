"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { lp, tr } from "@/lib/tr";

export type FinderFaq = { id: string; topic: string; question: string; answer: string; serviceTitle?: string; serviceHref?: string };

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (needle.length < 2) return <>{text}</>;
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) return <>{text}</>;
  return <>{text.slice(0, index)}<mark>{text.slice(index, index + needle.length)}</mark>{text.slice(index + needle.length)}</>;
}

/** Searchable FAQ list with a topic / service filter. Everything is already on the page, so it works instantly. */
export default function FaqFinder({ faqs, topics, lang = "en" }: { faqs: FinderFaq[]; topics: string[]; lang?: Locale }) {
  const t = tr(lang);
  const ALL = "All";
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("All");

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return faqs.filter((faq) => {
      if (topic !== "All" && faq.topic !== topic) return false;
      if (!words.length) return true;
      const haystack = `${faq.question} ${faq.answer} ${faq.topic} ${faq.serviceTitle ?? ""}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  }, [faqs, query, topic]);

  const grouped = useMemo(() => {
    const map = new Map<string, FinderFaq[]>();
    for (const faq of results) map.set(faq.topic, [...(map.get(faq.topic) ?? []), faq]);
    return [...map.entries()].sort((a, b) => topics.indexOf(a[0]) - topics.indexOf(b[0]));
  }, [results, topics]);

  return <div className="faq-finder">
    <div className="faq-finder__search">
      <Search size={18} aria-hidden="true"/>
      <label className="sr-only" htmlFor="faq-search">{t("Search the FAQs", "सवाल-जवाब खोजें", "প্রশ্নোত্তর খুঁজুন")}</label>
      <input id="faq-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Search any question: PAN, Aadhaar, refund, caste certificate…", "कोई भी सवाल खोजिए: पैन, आधार, रिफ़ंड, जाति प्रमाण पत्र…", "যেকোনো প্রশ্ন খুঁজুন: প্যান, আধার, রিফান্ড, জাতি সার্টিফিকেট…")} autoComplete="off" enterKeyHint="search"/>
    </div>
    <div className="faq-finder__chips" role="group" aria-label={t("Filter by topic or service", "विषय या सेवा से फ़िल्टर करें", "বিষয় বা পরিষেবা অনুযায়ী ফিল্টার")}>
      {[ALL, ...topics].map((item) => <button key={item} type="button" aria-pressed={topic === item} onClick={() => setTopic(item)}>{item === ALL ? t("All", "सभी", "সব") : item}</button>)}
    </div>
    <p className="faq-finder__count" role="status" aria-live="polite">{lang === "en" ? (results.length === faqs.length ? `${faqs.length} questions` : `${results.length} of ${faqs.length} questions`) : lang === "hi" ? (results.length === faqs.length ? `${faqs.length} सवाल` : `${faqs.length} में से ${results.length} सवाल`) : (results.length === faqs.length ? `${faqs.length}টি প্রশ্ন` : `${faqs.length}টির মধ্যে ${results.length}টি প্রশ্ন`)}</p>
    {!results.length && <div className="faq-finder__empty"><b>{t("No matching question.", "कोई मिलता-जुलता सवाल नहीं।", "মেলে এমন কোনও প্রশ্ন নেই।")}</b><p>{t("Try fewer words, or ask us directly: ", "कम शब्द आज़माइए, या सीधे पूछिए: ", "কম শব্দ চেষ্টা করুন, বা সরাসরি জিজ্ঞাসা করুন: ")}<Link href={lp(lang, "/contact")}>{t("contact the service desk", "सर्विस डेस्क से संपर्क करें", "সার্ভিস ডেস্কে যোগাযোগ করুন")}</Link>.</p></div>}
    {grouped.map(([group, items]) => <section className="faq-finder__group" key={group}>
      <h2>{group}</h2>
      <div className="faq-list">{items.map((faq) => <details key={faq.id} open={Boolean(query.trim()) && items.length <= 6 ? true : undefined}>
        <summary><span><Highlight text={faq.question} query={query}/></span><i aria-hidden="true"><Plus size={18}/></i></summary>
        <p><Highlight text={faq.answer} query={query}/>{faq.serviceHref ? <> <Link className="arrow-link" href={faq.serviceHref}>{faq.serviceTitle}</Link></> : null}</p>
      </details>)}</div>
    </section>)}
  </div>;
}
