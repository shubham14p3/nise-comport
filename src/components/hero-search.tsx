"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const SUGGESTIONS = ["PAN card correction", "Income certificate", "Bike insurance renewal", "AEPS cash withdrawal", "Print from phone", "Exam form filling", "Voter ID", "Electricity bill"];

/** "What do you need today?" search with a rotating hint. Searches the services page. */
export default function HeroSearch({ popular }: { popular: { label: string; href: string }[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hint, setHint] = useState(0);

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
      <input id="hero-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Try “${SUGGESTIONS[hint]}”`} autoComplete="off" enterKeyHint="search"/>
      <button type="submit" className="btn btn--primary">Search</button>
    </form>
    <div className="hero-search__chips" aria-label="Popular">
      {popular.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
    </div>
  </div>;
}
