"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import ShowMore, { useShowMore } from "@/components/show-more";

export type GalleryEntry = {
  key: string; src: string; width: number; height: number; title: string; alt: string; tag: "google" | "shop" | "services";
  author?: string; authorUri?: string | null; href?: string;
  /** Your photos: what they're about ("pan-card", "diwali", "shop"…) and its group. */
  group?: "service" | "festival" | "shop"; service?: string; serviceLabel?: string;
};

const GROUPS = [
  { id: "grp:service", label: "Services", group: "service" },
  { id: "grp:festival", label: "Festivals", group: "festival" },
  { id: "grp:shop", label: "Our centre", group: "shop" },
] as const;
const SOURCES = [
  { id: "google", label: "From Google" },
  { id: "services", label: "Service artwork" },
] as const;

const subscribe = (callback: () => void) => { window.addEventListener("popstate", callback); return () => window.removeEventListener("popstate", callback); };
const readSearch = () => window.location.search;

/**
 * Masonry gallery with a lightbox. Filters: All · Services · Festivals · Our centre (each opens its
 * own row: PAN card, Aadhaar… / Diwali, Holi…) · From Google · Service artwork.
 * /gallery?service=pan-card (or ?tag=diwali) opens one directly.
 */
export default function GalleryGrid({ items }: { items: GalleryEntry[] }) {
  const search = useSyncExternalStore(subscribe, readSearch, () => "");
  const params = new URLSearchParams(search);
  const fromUrl = params.get("service") ?? params.get("tag");
  const [picked, setPicked] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  // "all", "grp:<group>", "tag:<tag>", "google" or "services".
  const filter = picked ?? (fromUrl && items.some((item) => item.service === fromUrl) ? `tag:${fromUrl}` : "all");
  const setFilter = (value: string) => { setPicked(value); setOpen(null); };
  const activeGroup = filter.startsWith("grp:") ? filter.slice(4) : filter.startsWith("tag:") ? items.find((item) => item.service === filter.slice(4))?.group : undefined;
  const visible = items.filter((item) => filter === "all"
    || (filter.startsWith("grp:") && item.group === filter.slice(4))
    || (filter.startsWith("tag:") && item.service === filter.slice(4))
    || (!filter.includes(":") && item.tag === filter));
  const groups = GROUPS.filter((option) => items.some((item) => item.group === option.group));
  const sources = SOURCES.filter((option) => items.some((item) => item.tag === option.id));
  const counts = new Map<string, { label: string; count: number }>();
  for (const item of items) if (item.group === activeGroup && item.service) counts.set(item.service, { label: item.serviceLabel ?? item.service, count: (counts.get(item.service)?.count ?? 0) + 1 });
  const subChips = [...counts.entries()].sort((a, b) => b[1].count - a[1].count);
  const current = open === null ? null : visible[open];
  const paging = useShowMore(12, filter);

  useEffect(() => {
    if (open === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
      if (event.key === "ArrowRight") setOpen((index) => index === null ? null : (index + 1) % visible.length);
      if (event.key === "ArrowLeft") setOpen((index) => index === null ? null : (index - 1 + visible.length) % visible.length);
    };
    document.documentElement.classList.add("no-scroll");
    window.addEventListener("keydown", onKey);
    return () => { document.documentElement.classList.remove("no-scroll"); window.removeEventListener("keydown", onKey); };
  }, [open, visible.length]);

  return <>
    {(groups.length + sources.length) > 0 && <div className="chip-row chip-row--center" role="group" aria-label="Filter photos">
      <button type="button" className={filter === "all" ? "chip-btn is-active" : "chip-btn"} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All <span className="chip-count">{items.length}</span></button>
      {groups.map((option) => <button key={option.id} type="button" className={activeGroup === option.group ? "chip-btn is-active" : "chip-btn"} aria-pressed={activeGroup === option.group} onClick={() => setFilter(option.id)}>{option.label} <span className="chip-count">{items.filter((item) => item.group === option.group).length}</span></button>)}
      {sources.map((option) => <button key={option.id} type="button" className={filter === option.id ? "chip-btn is-active" : "chip-btn"} aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>{option.label}</button>)}
    </div>}
    {subChips.length > 1 && <div className="chip-row chip-row--center chip-row--sub" role="group" aria-label="Choose one">
      {subChips.map(([tag, info]) => <button key={tag} type="button" className={filter === `tag:${tag}` ? "chip-btn chip-btn--sm is-active" : "chip-btn chip-btn--sm"} aria-pressed={filter === `tag:${tag}`} onClick={() => setFilter(`tag:${tag}`)}>{info.label} <span className="chip-count">{info.count}</span></button>)}
    </div>}
    <div className="masonry">{visible.slice(0, paging.count).map((item, index) => <figure key={item.key} className="masonry__item">
      <button type="button" className="masonry__open" onClick={() => setOpen(index)} aria-label={`View larger: ${item.title}`}>
        <Image src={item.src} alt={item.alt} width={item.width} height={item.height} sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw" unoptimized={item.tag === "google"}/>
        <span className="masonry__zoom" aria-hidden="true"><Expand size={18}/></span>
      </button>
      <figcaption>
        <b>{item.title}</b>
        {item.tag === "google" ? <small>Photo: {item.authorUri ? <a href={item.authorUri} target="_blank" rel="noopener noreferrer nofollow">{item.author}</a> : item.author} · Google Maps</small>
          : item.href ? <Link href={item.href}>Learn more <ArrowRight size={14}/></Link> : null}
      </figcaption>
    </figure>)}</div>
    <ShowMore shown={Math.min(paging.count, visible.length)} total={visible.length} onMore={paging.more} label="photos"/>
    {current && <div className="lightbox" role="dialog" aria-modal="true" aria-label={current.title} onClick={() => setOpen(null)}>
      <button type="button" className="lightbox__close icon-btn" aria-label="Close" onClick={() => setOpen(null)}><X size={24}/></button>
      {visible.length > 1 && <button type="button" className="lightbox__nav lightbox__nav--prev icon-btn" aria-label="Previous" onClick={(event) => { event.stopPropagation(); setOpen((index) => index === null ? null : (index - 1 + visible.length) % visible.length); }}><ChevronLeft size={28}/></button>}
      <figure onClick={(event) => event.stopPropagation()}>
        <Image src={current.src} alt={current.alt} width={current.width} height={current.height} sizes="92vw" unoptimized={current.tag === "google"}/>
        <figcaption><b>{current.title}</b>{current.tag === "google" && <small>Photo: {current.author} · Google Maps</small>}</figcaption>
      </figure>
      {visible.length > 1 && <button type="button" className="lightbox__nav lightbox__nav--next icon-btn" aria-label="Next" onClick={(event) => { event.stopPropagation(); setOpen((index) => index === null ? null : (index + 1) % visible.length); }}><ChevronRight size={28}/></button>}
    </div>}
  </>;
}
