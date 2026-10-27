"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LoopScroller from "@/components/loop-scroller";
import { Search } from "lucide-react";
import { matchesSearch, normaliseSearch, searchAliases } from "@/lib/search-terms";
import { isKnownRecord, loadSearchRecords, type SearchRecords } from "@/lib/search-records";

const SUGGESTIONS = ["PAN card correction", "Income certificate", "Bike insurance renewal", "AEPS cash withdrawal", "Passport photo", "Exam form filling", "Voter ID", "Website for my shop"];

/** "What do you need today?" search with a rotating hint. Searches the services page. */
export default function HeroSearch({ popular, services = [] }: { popular: { label: string; href: string }[]; services?: { slug: string; title: string }[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hint, setHint] = useState(0);
  const [records, setRecords] = useState<SearchRecords | null>(null);
  useEffect(() => { if (normaliseSearch(query)) void loadSearchRecords().then(setRecords); }, [query]);
  const matches = useMemo(() => {
    return query.trim() ? services.filter((item) => isKnownRecord(records, item.slug, query) || matchesSearch(normaliseSearch(`${item.title} ${searchAliases(item.title)}`), query)) : services;
  }, [query, services, records]);

  useEffect(() => {
    const timer = window.setInterval(() => setHint((value) => (value + 1) % SUGGESTIONS.length), 2600);
    return () => window.clearInterval(timer);
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/services?q=${encodeURIComponent(value)}` : "/services");
  }

  return <div className="hero-search">
    <form role="search" onSubmit={submit} className="hero-search__box">
      <Search size={22} aria-hidden="true"/>
      <label className="sr-only" htmlFor="hero-search">What do you need today?</label>
      <input id="hero-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); }} placeholder={`Try “${SUGGESTIONS[hint]}”`} autoComplete="off" enterKeyHint="search"/>
      <button type="submit" className="btn btn--primary">Search</button>
    </form>
    {services.length > 0
      ? matches.length
        ? <LoopScroller className="hero-search__row" label="Services" gap={8} loop={matches.length > 3} auto>{matches.map((item) => <Link key={item.slug} role="listitem" href={`/services/${item.slug}`}>{item.title}</Link>)}</LoopScroller>
        : <span className="hero-search__empty">No service matches “{query}”. Press Search or message us.</span>
      : <div className="hero-search__chips" aria-label="Popular">
          {popular.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </div>}
  </div>;
}
