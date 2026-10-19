"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

export type FinderFaq = { id: string; topic: string; question: string; answer: string; serviceTitle?: string; serviceHref?: string };

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (needle.length < 2) return <>{text}</>;
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) return <>{text}</>;
  return <>{text.slice(0, index)}<mark>{text.slice(index, index + needle.length)}</mark>{text.slice(index + needle.length)}</>;
}

/** Searchable FAQ list with a topic / service filter. Everything is already on the page, so it works instantly. */
export default function FaqFinder({ faqs, topics }: { faqs: FinderFaq[]; topics: string[] }) {
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
      <label className="sr-only" htmlFor="faq-search">Search the FAQs</label>
      <input id="faq-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search any question: PAN, Aadhaar, refund, caste certificate…" autoComplete="off" enterKeyHint="search"/>
    </div>
    <div className="faq-finder__chips" role="group" aria-label="Filter by topic or service">
      {["All", ...topics].map((item) => <button key={item} type="button" aria-pressed={topic === item} onClick={() => setTopic(item)}>{item}</button>)}
    </div>
    <p className="faq-finder__count" role="status" aria-live="polite">{results.length === faqs.length ? `${faqs.length} questions` : `${results.length} of ${faqs.length} questions`}</p>
    {!results.length && <div className="faq-finder__empty"><b>No matching question.</b><p>Try fewer words, or ask us directly: <Link href="/contact">contact the service desk</Link>.</p></div>}
    {grouped.map(([group, items]) => <section className="faq-finder__group" key={group}>
      <h2>{group}</h2>
      <div className="faq-list">{items.map((faq) => <details key={faq.id} open={Boolean(query.trim()) && items.length <= 6 ? true : undefined}>
        <summary><span><Highlight text={faq.question} query={query}/></span><i aria-hidden="true"><Plus size={18}/></i></summary>
        <p><Highlight text={faq.answer} query={query}/>{faq.serviceHref ? <> <Link className="arrow-link" href={faq.serviceHref}>{faq.serviceTitle}</Link></> : null}</p>
      </details>)}</div>
    </section>)}
  </div>;
}
