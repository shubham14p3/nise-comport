"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { publishedServiceDetails, serviceCatalog, shortServiceName } from "@/lib/services";

// Every service grouped by category. Built from the same data as the /services hub,
// so the menu and the hub can never disagree.
const groups = serviceCatalog
  .map((group) => ({
    ...group,
    items: publishedServiceDetails.filter((service) => service.categorySlug === group.slug),
  }))
  .filter((group) => group.items.length > 0);

/** Desktop: a button that opens a multi-column panel on hover, focus or click. */
export function ServicesMegaDesktop({ label, active }: { label: string; active: boolean }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => { if (!wrapRef.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className={open ? "mega is-open" : "mega"} ref={wrapRef}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className={active ? "mega__trigger is-active" : "mega__trigger"}
        aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((value) => !value)}>
        {label}<ChevronDown size={16} aria-hidden="true"/>
      </button>
      <div className="mega__panel" role="region" aria-label="All services">
        <Link className="mega__all" href="/services" onClick={() => setOpen(false)}>View all services →</Link>
        {groups.map((group) => (
          <section key={group.slug} className="mega__group">
            <h3><Link href={`/services/${group.slug}`} onClick={() => setOpen(false)}>{group.title}</Link></h3>
            <ul>
              {group.items.map((service) => (
                <li key={service.slug}><Link href={`/services/${service.slug}`} onClick={() => setOpen(false)}>{shortServiceName(service.title)}</Link></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

/** Mobile: each category is an expandable row, so the full list fits without a long scroll. */
export function ServicesMegaMobile({ label }: { label: string }) {
  return (
    <div className="mobile-mega">
      <Link className="mobile-mega__all" href="/services">{label}<span aria-hidden="true">→</span></Link>
      {groups.map((group) => (
        <details key={group.slug} className="mobile-mega__group">
          <summary>{group.title}<ChevronDown size={18} aria-hidden="true"/></summary>
          <ul>
            <li><Link href={`/services/${group.slug}`}>All {group.title.toLowerCase()}</Link></li>
            {group.items.map((service) => (
              <li key={service.slug}><Link href={`/services/${service.slug}`}>{shortServiceName(service.title)}</Link></li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
