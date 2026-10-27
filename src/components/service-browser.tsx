"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, Search, SlidersHorizontal, X } from "lucide-react";
import { CategoryIcon } from "@/components/icons";
import ShowMore, { useShowMore } from "@/components/show-more";
import { categoryMeta } from "@/lib/categories";
import { expandFullForms, matchesSearch, normaliseSearch, searchAliases } from "@/lib/search-terms";
import { tr } from "@/lib/tr";
import type { Locale } from "@/lib/i18n";

export type BrowserService = { slug: string; title: string; name: string; description: string; category: string; keywords: string[]; requestHref: string; href?: string };

const subscribe = (callback: () => void) => { window.addEventListener("popstate", callback); return () => window.removeEventListener("popstate", callback); };
const readSearch = () => window.location.search;


/**
 * Search + category filter for the services page. The full list is rendered on the server
 * (good for search engines); filtering happens instantly in the browser and is kept in the URL.
 */
export default function ServiceBrowser({ services, lang = "en" }: { services: BrowserService[]; lang?: Locale }) {
  const t = tr(lang);
  const search = useSyncExternalStore(subscribe, readSearch, () => "");
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const [typed, setTyped] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = typed ?? params.get("q") ?? "";
  const category = picked ?? params.get("category") ?? "all";

  function syncUrl(nextQuery: string, nextCategory: string) {
    const next = new URLSearchParams();
    if (nextQuery.trim()) next.set("q", nextQuery.trim());
    if (nextCategory !== "all") next.set("category", nextCategory);
    const url = `${window.location.pathname}${next.toString() ? `?${next}` : ""}`;
    window.history.replaceState(window.history.state, "", url);
  }

  const results = services.filter((service) => {
    // Searching covers every category; the category filter only applies when nothing is typed.
    if (!normaliseSearch(query)) return category === "all" || service.category === category;
    return matchesSearch(expandFullForms(normaliseSearch(`${service.title} ${service.description} ${service.keywords.join(" ")} ${service.category.replace(/-/g, " ")} ${searchAliases(service.title)}`)), query);
  });

  const paging = useShowMore(12, `${query}|${category}`);

  return <div className="browser">
    <div className="browser__controls">
      <div className="browser__row">
      <label className="browser__search">
        <Search size={20} aria-hidden="true"/>
        <span className="sr-only">{t("Search services", "सेवाएँ खोजें", "পরিষেবা খুঁজুন")}</span>
        <input type="search" value={query} placeholder={t("Search in English, हिन्दी or বাংলা, e.g. PAN, बीमा, ওয়েবসাইট", "हिन्दी, বাংলা या English में खोजिए, जैसे PAN, बीमा, ওয়েবসাইট", "বাংলা, हिन्दी বা English-এ খুঁজুন, যেমন PAN, বিমা, ওয়েবসাইট")} onChange={(event) => { setTyped(event.target.value); syncUrl(event.target.value, category); }} enterKeyHint="search"/>
        {query && <button type="button" className="icon-btn" aria-label={t("Clear search", "खोज साफ़ करें", "অনুসন্ধান মুছুন")} onClick={() => { setTyped(""); syncUrl("", category); }}><X size={18}/></button>}
      </label>
      <button type="button" className={`browser__filter${category !== "all" ? " has-filter" : ""}`} aria-expanded={filtersOpen} aria-controls="browser-cats" onClick={() => setFiltersOpen((open) => !open)}><SlidersHorizontal size={18}/><span>{t("Filter", "फ़िल्टर", "ফিল্টার")}</span>{category !== "all" && <i aria-hidden="true"/>}</button>
      </div>
      {(filtersOpen || category !== "all") && <div id="browser-cats" className="browser__cats" role="group" aria-label={t("Filter by category", "श्रेणी से फ़िल्टर करें", "বিভাগ অনুযায়ী ফিল্টার")}>
        <button type="button" className={category === "all" ? "is-active" : undefined} aria-pressed={category === "all"} onClick={() => { setPicked("all"); syncUrl(query, "all"); }}>{t("All", "सभी", "সব")} <span>{services.length}</span></button>
        {categoryMeta.map((meta) => {
          const count = services.filter((service) => service.category === meta.slug).length;
          return <button key={meta.slug} type="button" className={`tone-${meta.tone}${category === meta.slug ? " is-active" : ""}`} aria-pressed={category === meta.slug} onClick={() => { setPicked(meta.slug); syncUrl(query, meta.slug); }}><CategoryIcon icon={meta.icon} size={16}/>{meta.short[lang]}<span>{count}</span></button>;
        })}
      </div>}
    </div>
    <p className="browser__count" role="status">{results.length} {results.length === 1 ? t("service", "सेवा", "পরিষেবা") : t("services", "सेवाएँ", "পরিষেবা")}{query ? ` ${t("for", "के लिए", "-এর জন্য")} “${query}”` : ""}</p>
    {results.length ? <><div className="svc-grid">{results.map((service, index) => {
      const meta = categoryMeta.find((item) => item.slug === service.category);
      return <article key={service.slug} className={`svc-card tone-${meta?.tone ?? "blue"}`} hidden={index >= paging.count}>
        <div className="svc-card__top"><span className="svc-card__icon">{meta && <CategoryIcon icon={meta.icon} size={22}/>}</span><span className="chip chip--soft">{meta?.short[lang]}</span></div>
        <h3><Link prefetch={false} href={service.href ?? `/services/${service.slug}`}>{service.name}</Link></h3>
        <p>{service.description}</p>
        <div className="svc-card__actions"><Link prefetch={false} className="btn btn--primary btn--sm" href={service.requestHref}>{t("Start", "शुरू करें", "শুরু করুন")} <ArrowRight size={16}/></Link><Link prefetch={false} className="btn btn--ghost btn--sm" href={service.href ?? `/services/${service.slug}`}>{t("Details", "जानकारी", "বিস্তারিত")}</Link></div>
      </article>;
    })}</div><ShowMore shown={Math.min(paging.count, results.length)} total={results.length} onMore={paging.more} label={t("services", "सेवाएँ", "পরিষেবা")} lang={lang}/></> : <div className="empty-state"><h3>{t("No match for", "कोई परिणाम नहीं:", "কোনও ফল নেই:")} “{query}”</h3><p>{t("Try another word, pick “All”, or ask us directly. We help with many things that aren’t listed.", "कोई दूसरा शब्द आज़माइए, “सभी” चुनिए या हमसे सीधे पूछिए। सूची में न होने वाले कई कामों में भी हम मदद करते हैं।", "অন্য কোনও শব্দ চেষ্টা করুন, “সব” বাছুন বা সরাসরি আমাদের জিজ্ঞাসা করুন। তালিকায় নেই এমন অনেক কাজেও আমরা সাহায্য করি।")}</p><div className="empty-state__actions"><button type="button" className="btn btn--ghost" onClick={() => { setTyped(""); setPicked("all"); syncUrl("", "all"); }}>{t("Clear filters", "फ़िल्टर हटाएँ", "ফিল্টার সরান")}</button><Link prefetch={false} className="btn btn--primary" href={`/request?note=${encodeURIComponent(query)}`}>{t("Ask us about it", "हमसे पूछिए", "আমাদের জিজ্ঞাসা করুন")} <ArrowRight size={16}/></Link></div></div>}
  </div>;
}
