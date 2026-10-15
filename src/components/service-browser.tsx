"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { CategoryIcon } from "@/components/icons";
import ShowMore, { useShowMore } from "@/components/show-more";
import { categoryMeta } from "@/lib/categories";

export type BrowserService = { slug: string; title: string; name: string; description: string; category: string; keywords: string[]; requestHref: string };

const subscribe = (callback: () => void) => { window.addEventListener("popstate", callback); return () => window.removeEventListener("popstate", callback); };
const readSearch = () => window.location.search;

function normalise(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

/**
 * Search + category filter for the services page. The full list is rendered on the server
 * (good for search engines); filtering happens instantly in the browser and is kept in the URL.
 */
export default function ServiceBrowser({ services }: { services: BrowserService[] }) {
  const search = useSyncExternalStore(subscribe, readSearch, () => "");
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const [typed, setTyped] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const query = typed ?? params.get("q") ?? "";
  const category = picked ?? params.get("category") ?? "all";

  function syncUrl(nextQuery: string, nextCategory: string) {
    const next = new URLSearchParams();
    if (nextQuery.trim()) next.set("q", nextQuery.trim());
    if (nextCategory !== "all") next.set("category", nextCategory);
    const url = `${window.location.pathname}${next.toString() ? `?${next}` : ""}`;
    window.history.replaceState(window.history.state, "", url);
  }

  const words = normalise(query).split(" ").filter(Boolean);
  const results = services.filter((service) => {
    if (category !== "all" && service.category !== category) return false;
    if (!words.length) return true;
    const haystack = normalise(`${service.title} ${service.description} ${service.keywords.join(" ")}`);
    return words.every((word) => haystack.includes(word));
  });

  const paging = useShowMore(12, `${query}|${category}`);

  return <div className="browser">
    <div className="browser__controls">
      <label className="browser__search">
        <Search size={20} aria-hidden="true"/>
        <span className="sr-only">Search services</span>
        <input type="search" value={query} placeholder="Search e.g. PAN correction, AEPS, bike insurance" onChange={(event) => { setTyped(event.target.value); syncUrl(event.target.value, category); }} enterKeyHint="search"/>
        {query && <button type="button" className="icon-btn" aria-label="Clear search" onClick={() => { setTyped(""); syncUrl("", category); }}><X size={18}/></button>}
      </label>
      <div className="browser__cats" role="group" aria-label="Filter by category">
        <button type="button" className={category === "all" ? "is-active" : undefined} aria-pressed={category === "all"} onClick={() => { setPicked("all"); syncUrl(query, "all"); }}>All <span>{services.length}</span></button>
        {categoryMeta.map((meta) => {
          const count = services.filter((service) => service.category === meta.slug).length;
          return <button key={meta.slug} type="button" className={`tone-${meta.tone}${category === meta.slug ? " is-active" : ""}`} aria-pressed={category === meta.slug} onClick={() => { setPicked(meta.slug); syncUrl(query, meta.slug); }}><CategoryIcon icon={meta.icon} size={16}/>{meta.short.en}<span>{count}</span></button>;
        })}
      </div>
    </div>
    <p className="browser__count" role="status">{results.length} {results.length === 1 ? "service" : "services"}{query ? ` for “${query}”` : ""}</p>
    {results.length ? <><div className="svc-grid">{results.map((service, index) => {
      const meta = categoryMeta.find((item) => item.slug === service.category);
      return <article key={service.slug} className={`svc-card tone-${meta?.tone ?? "blue"}`} hidden={index >= paging.count}>
        <div className="svc-card__top"><span className="svc-card__icon">{meta && <CategoryIcon icon={meta.icon} size={22}/>}</span><span className="chip chip--soft">{meta?.short.en}</span></div>
        <h3><Link href={`/services/${service.slug}`}>{service.name}</Link></h3>
        <p>{service.description}</p>
        <div className="svc-card__actions"><Link className="btn btn--primary btn--sm" href={service.requestHref}>Start <ArrowRight size={16}/></Link><Link className="btn btn--ghost btn--sm" href={`/services/${service.slug}`}>Details</Link></div>
      </article>;
    })}</div><ShowMore shown={Math.min(paging.count, results.length)} total={results.length} onMore={paging.more} label="services"/></> : <div className="empty-state"><h3>No match for “{query}”</h3><p>Try another word, pick “All”, or ask us directly. We help with many things that aren’t listed.</p><div className="empty-state__actions"><button type="button" className="btn btn--ghost" onClick={() => { setTyped(""); setPicked("all"); syncUrl("", "all"); }}>Clear filters</button><Link className="btn btn--primary" href={`/request?note=${encodeURIComponent(query)}`}>Ask us about it <ArrowRight size={16}/></Link></div></div>}
  </div>;
}
