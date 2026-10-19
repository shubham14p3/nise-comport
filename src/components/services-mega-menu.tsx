"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CategoryIcon } from "@/components/icons";
import { categoryMetaFor } from "@/lib/categories";
import { serviceName } from "@/lib/i18n-forms";
import { publishedServiceDetails, serviceCatalog, shortServiceName } from "@/lib/services";
import { lp, tr } from "@/lib/tr";
import { useLocale } from "@/lib/use-locale";

const MAX_PER_GROUP = 6;

// Every service grouped by category, with its icon and tone colour. Built from the same data
// as the /services hub, so the menu and the hub can never disagree.
const groups = serviceCatalog
  .map((group) => {
    const meta = categoryMetaFor(group.slug);
    const items = publishedServiceDetails.filter((service) => service.categorySlug === group.slug);
    return { ...group, icon: meta?.icon ?? "file" as const, tone: meta?.tone ?? "blue", items: items.slice(0, MAX_PER_GROUP), more: Math.max(0, items.length - MAX_PER_GROUP) };
  })
  .filter((group) => group.items.length > 0);

/** Desktop: a button that opens a multi-column panel on hover, focus or click. */
export function ServicesMegaDesktop({ label, active }: { label: string; active: boolean }) {
  const lc = useLocale();
  const t = tr(lc);
  const catName = (slug: string, fallback: string) => categoryMetaFor(slug)?.short[lc] ?? fallback;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => { if (!wrapRef.current?.contains(event.target as Node)) close(); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className={open ? "mega is-open" : "mega"} ref={wrapRef}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className={active ? "mega__trigger is-active" : "mega__trigger"}
        aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((value) => !value)}>
        {label}<ChevronDown size={16} aria-hidden="true" className="mega__chevron"/>
      </button>
      {open && <div className="mega__backdrop" aria-hidden="true" onClick={close}/>}
      <div className="mega__panel" role="region" aria-label={t("All services", "सभी सेवाएँ", "সব পরিষেবা")}>
        <div className="mega__grid">
          {groups.map((group) => (
            <section key={group.slug} className={`mega__group tone-${group.tone}`}>
              <h3>
                <Link href={lp(lc, `/services/${group.slug}`)} onClick={close}>
                  <span className="mega__icon"><CategoryIcon icon={group.icon} size={18}/></span>
                  {lc === "en" ? group.title : catName(group.slug, group.title)}
                </Link>
              </h3>
              <ul>
                {group.items.map((service) => (
                  <li key={service.slug}><Link href={lp(lc, `/services/${service.slug}`)} onClick={close}>{lc === "en" ? shortServiceName(service.title) : serviceName(service.slug, shortServiceName(service.title), lc)}</Link></li>
                ))}
                {group.more > 0 && <li><Link className="mega__more" href={lp(lc, `/services/${group.slug}`)} onClick={close}>+{group.more} {t("more", "और", "আরও")}</Link></li>}
              </ul>
            </section>
          ))}
        </div>
        <Link className="mega__all" href={lp(lc, "/services")} onClick={close}>{t("View all services", "सभी सेवाएँ देखें", "সব পরিষেবা দেখুন")}<ArrowRight size={16} aria-hidden="true"/></Link>
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
      <Link className="mobile-mega__viewall" href={lp(lc, "/services")}>{t("View all services", "सभी सेवाएँ देखें", "সব পরিষেবা দেখুন")}<span aria-hidden="true">→</span></Link>
      {groups.map((group) => (
        <details key={group.slug} className="mobile-mega__group">
          <summary>
            <span className={`mega__icon tone-${group.tone}`}><CategoryIcon icon={group.icon} size={18}/></span>
            <span className="mobile-mega__label">{catName(group.slug, group.title)}</span>
            <ChevronDown size={18} aria-hidden="true" className="mobile-mega__chevron"/>
          </summary>
          <ul>
            {group.items.map((service) => (
              <li key={service.slug}><Link href={lp(lc, `/services/${service.slug}`)}>{lc === "en" ? shortServiceName(service.title) : serviceName(service.slug, shortServiceName(service.title), lc)}</Link></li>
            ))}
            <li><Link className="mega__more" href={lp(lc, `/services/${group.slug}`)}>{lc === "en" ? `All ${group.title.toLowerCase()} →` : `${catName(group.slug, group.title)} →`}</Link></li>
          </ul>
        </details>
      ))}
    </details>
  );
}
