"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CategoryIcon } from "@/components/icons";
import { categoryMetaFor } from "@/lib/categories";
import { serviceName } from "@/lib/i18n-forms";
import { publishedServiceDetails, serviceCatalog, shortServiceName } from "@/lib/services";
import { lp, tr } from "@/lib/tr";
import { useLocale } from "@/lib/use-locale";
import { usePathname } from "next/navigation";

const MAX_PER_GROUP = 4;

// One source for the desktop preview and the full mobile category list.
const groups = serviceCatalog
  .map((group) => {
    const meta = categoryMetaFor(group.slug);
    const items = publishedServiceDetails.filter((service) => service.categorySlug === group.slug);
    return { ...group, icon: meta?.icon ?? "file" as const, tone: meta?.tone ?? "blue", items };
  })
  .filter((group) => group.items.length > 0);

/** Services navigation: roomy category cards and live, keyboard-friendly search. */
export function ServicesMegaDesktop({ label, active }: { label: string; active: boolean }) {
  const lc = useLocale();
  const path = usePathname();
  const t = tr(lc);
  const catName = (slug: string, fallback: string) => lc === "en" ? fallback : categoryMetaFor(slug)?.short[lc] ?? fallback;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const close = () => { setOpen(false); setQuery(""); };
  const cancelClose = () => { if(closeTimer.current) clearTimeout(closeTimer.current); closeTimer.current=null; };
  const scheduleClose = () => { cancelClose(); closeTimer.current=setTimeout(close,220); };

  useEffect(() => { return () => { if(closeTimer.current) clearTimeout(closeTimer.current); }; }, []);
  useEffect(() => { setOpen(false); setQuery(""); }, [path]);
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => { if (!wrapRef.current?.contains(event.target as Node)) close(); };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { close(); wrapRef.current?.querySelector<HTMLButtonElement>(".mega__trigger")?.focus(); }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return groups.map(group => ({
      ...group, shown: q ? group.items.filter(item =>
        [item.title,shortServiceName(item.title),serviceName(item.slug,item.title,lc),group.title,catName(group.slug,group.title)]
          .some(value => value.toLocaleLowerCase().includes(q))) : group.items.slice(0,MAX_PER_GROUP),
    })).filter(group => group.shown.length > 0);
  }, [query,lc]);
  const matching = filtered.reduce((sum,group)=>sum+group.shown.length,0);
  const allServices = groups.reduce((sum,group)=>sum+group.items.length,0);

  return <div className={open ? "mega is-open" : "mega"} ref={wrapRef}
    onMouseEnter={() => { cancelClose(); setOpen(true); }} onMouseLeave={scheduleClose}>
    <button type="button" className={active ? "mega__trigger is-active" : "mega__trigger"}
      aria-expanded={open} aria-haspopup="true" aria-controls="nav-services-panel"
      onClick={() => { cancelClose(); setOpen(prev => !prev); }} >
      {label}<ChevronDown size={16} aria-hidden="true" className="mega__chevron"/>
    </button>
    {open && <div className="mega__backdrop" aria-hidden="true" onClick={close}/>}
    <div id="nav-services-panel" className="mega__panel" role="region" aria-label={t("Browse all services", "सभी सेवाएँ देखें", "সব পরিষেবা দেখুন")}
      onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
      <div className="mega__header">
        <div className="mega__intro">
          <span className="mega__eyebrow"><Sparkles size={14} aria-hidden="true"/> NISE COMPORT · SERVICE DIRECTORY</span>
          <h2>{t("How can we help you?", "हम आपकी कैसे मदद कर सकते हैं?", "আমরা কীভাবে সাহায্য করতে পারি?")}</h2>
          <p>{t("Choose a service to see the documents and next steps.", "दस्तावेज़ और अगले चरण देखने के लिए सेवा चुनें।", "কাগজপত্র ও পরবর্তী পদক্ষেপ দেখতে পরিষেবা বেছে নিন।")}</p>
        </div>
        <div className="mega__header-actions">
          <label className="mega__search">
            <Search size={18} aria-hidden="true"/>
            <span className="sr-only">{t("Find a service", "सेवा खोजें", "পরিষেবা খুঁজুন")}</span>
            <input ref={searchRef} type="search" value={query} onChange={e=>setQuery(e.target.value)} autoComplete="off"
              placeholder={t("Search PAN, passport, certificates…", "PAN, पासपोर्ट, प्रमाणपत्र खोजें…", "PAN, পাসপোর্ট, সার্টিফিকেট খুঁজুন…")}/>
            {query && <button type="button" aria-label={t("Clear search", "खोज मिटाएँ", "অনুসন্ধান মুছুন")} onClick={()=>{setQuery("");searchRef.current?.focus();}}><X size={16}/></button>}
          </label>
          <button type="button" className="mega__dismiss" aria-label={t("Close services", "सेवाएँ बंद करें", "পরিষেবা বন্ধ করুন")} onClick={close}><X size={18}/></button>
        </div>
      </div>
      <div className="mega__results-meta">
        <span>{query.trim() ? t("Matching services", "मिलती सेवाएँ", "মেলে এমন পরিষেবা") : t("Explore by category", "श्रेणी के अनुसार देखें", "বিভাগ অনুসারে দেখুন")}</span>
        <span>{query.trim() ? matching : allServices} {t("services", "सेवाएँ", "পরিষেবা")}</span>
      </div>
      <div className="mega__grid" aria-live="polite">
        {filtered.map(group => (
          <section key={group.slug} className={`mega__group tone-${group.tone}`}>
            <div className="mega__category">
              <span className="mega__icon"><CategoryIcon icon={group.icon} size={20}/></span>
              <div className="mega__category-title">
                <h3><Link prefetch={false} href={lp(lc,`/services/${group.slug}`)} onClick={close}>{catName(group.slug,group.title)}</Link></h3>
                <small>{group.items.length} {t("services", "सेवाएँ", "পরিষেবা")}</small>
              </div>
              <ArrowRight size={16} aria-hidden="true" className="mega__category-arrow"/>
            </div>
            <ul>
              {group.shown.map(service => (
                <li key={service.slug}><Link className="mega__service-link" prefetch={false}
                  href={lp(lc,`/services/${service.slug}`)} onClick={close}>
                  <span>{lc === "en" ? shortServiceName(service.title) : serviceName(service.slug,shortServiceName(service.title),lc)}</span>
                  <ArrowRight size={14} aria-hidden="true"/>
                </Link></li>
              ))}
            </ul>
            {!query.trim() && group.items.length>MAX_PER_GROUP && <Link prefetch={false} className="mega__category-more"
              href={lp(lc,`/services/${group.slug}`)} onClick={close}>
              {t("Explore all", "सभी देखें", "সব দেখুন")} {group.items.length} {t("services", "सेवाएँ", "পরিষেবা")} <ArrowRight size={14}/>
            </Link>}
          </section>
        ))}
        {filtered.length===0 && <div className="mega__empty"><Search size={26}/>
          <strong>{t("No matching services found", "कोई सेवा नहीं मिली", "কোনো পরিষেবা পাওয়া যায়নি")}</strong>
          <p>{t("Try another keyword or browse the full list.", "दूसरा शब्द आज़माएँ या पूरी सूची देखें।", "অন্য শব্দ দিয়ে খুঁজুন বা সব পরিষেবা দেখুন।")}</p>
          <button type="button" className="btn btn--ghost" onClick={()=>setQuery("")}>{t("Show all", "सभी दिखाएँ", "সব দেখুন")}</button>
        </div>}
      </div>
      <div className="mega__footer">
        <span>{t("Not sure which service you need?", "पता नहीं कौन सी सेवा चाहिए?", "কোন পরিষেবা লাগবে বুঝতে পারছেন না?")}</span>
        <Link prefetch={false} className="mega__all" href={lp(lc,"/services")} onClick={close}>
          {t("View all services", "सभी सेवाएँ देखें", "সব পরিষেবা দেখুন")} <ArrowRight size={17} aria-hidden="true"/>
        </Link>
      </div>
    </div>
  </div>;
}

wRight size={16} aria-hidden="true"/></Link>
      </div>
    </div>
  );
}

/**
 * Mobile: the whole services section is collapsed behind one toggle, so it doesn't push every
 * other link down the sheet by default. Opening it reveals the per-category expandable rows.
 */
export function ServicesMegaMobile({ label }: { label: string }) {
  const lc = useLocale();
  const t = tr(lc);
  const catName = (slug: string, fallback: string) => lc === "en" ? fallback : categoryMetaFor(slug)?.short[lc] ?? fallback;
  return (
    <details className="mobile-mega">
      <summary className="mobile-mega__all">
        {label}
        <ChevronDown size={18} aria-hidden="true" className="mobile-mega__chevron"/>
      </summary>
      <Link prefetch={false} className="mobile-mega__viewall" href={lp(lc, "/services")}>{t("View all services", "सभी सेवाएँ देखें", "সব পরিষেবা দেখুন")}<span aria-hidden="true">→</span></Link>
      {groups.map((group) => (
        <details key={group.slug} className="mobile-mega__group">
          <summary>
            <span className={`mega__icon tone-${group.tone}`}><CategoryIcon icon={group.icon} size={18}/></span>
            <span className="mobile-mega__label">{catName(group.slug, group.title)}</span>
            <ChevronDown size={18} aria-hidden="true" className="mobile-mega__chevron"/>
          </summary>
          <ul>
            {group.items.map((service) => (
              <li key={service.slug}><Link prefetch={false} href={lp(lc, `/services/${service.slug}`)}>{lc === "en" ? shortServiceName(service.title) : serviceName(service.slug, shortServiceName(service.title), lc)}</Link></li>
            ))}
            <li><Link prefetch={false} className="mega__more" href={lp(lc, `/services/${group.slug}`)}>{lc === "en" ? `All ${group.title.toLowerCase()} →` : `${catName(group.slug, group.title)} →`}</Link></li>
          </ul>
        </details>
      ))}
    </details>
  );
}
