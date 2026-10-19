"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { matchesSearch, normaliseSearch } from "@/lib/search-terms";

const SUGGESTIONS = ["PAN card correction", "Income certificate", "Bike insurance renewal", "AEPS cash withdrawal", "Print from phone", "Exam form filling", "Voter ID", "Electricity bill"];

/** "What do you need today?" search with a rotating hint. Searches the services page. */
const CHUNK = 18;

export default function HeroSearch({ popular, services = [] }: { popular: { label: string; href: string }[]; services?: { slug: string; title: string }[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hint, setHint] = useState(0);
  const [shown, setShown] = useState(CHUNK);
  const listRef = useRef<HTMLDivElement>(null);
  const matches = useMemo(() => {
    return query.trim() ? services.filter((item) => matchesSearch(normaliseSearch(item.title), query)) : services;
  }, [query, services]);

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
      <input id="hero-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setShown(CHUNK); listRef.current?.scrollTo({ top: 0 }); }} placeholder={`Try “${SUGGESTIONS[hint]}”`} autoComplete="off" enterKeyHint="search"/>
      <button type="submit" className="btn btn--primary">Search</button>
    </form>
    {services.length > 0
      ? <div className="hero-search__list" ref={listRef} aria-label="All services" onScroll={(event) => {
          const el = event.currentTarget;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) setShown((count) => Math.min(count + CHUNK, matches.length));
        }}>
          {matches.slice(0, shown).map((item) => <Link key={item.slug} href={`/services/${item.slug}`}>{item.title}</Link>)}
          {!matches.length && <span className="hero-search__empty">No service matches “{query}”. Press Search or message us.</span>}
        </div>
      : <div className="hero-search__chips" aria-label="Popular">
          {popular.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </div>}
  </div>;
}
