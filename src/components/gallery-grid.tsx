"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

export type GalleryEntry = { key: string; src: string; width: number; height: number; title: string; alt: string; tag: "google" | "shop" | "services"; author?: string; authorUri?: string | null; href?: string };

const FILTERS: { id: "all" | GalleryEntry["tag"]; label: string }[] = [
  { id: "all", label: "All" },
  { id: "google", label: "From Google" },
  { id: "shop", label: "Our desk" },
  { id: "services", label: "Service artwork" },
];

/** Masonry gallery with filters and a keyboard-friendly lightbox. */
export default function GalleryGrid({ items }: { items: GalleryEntry[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [open, setOpen] = useState<number | null>(null);
  const visible = items.filter((item) => filter === "all" || item.tag === filter);
  const available = FILTERS.filter((option) => option.id === "all" || items.some((item) => item.tag === option.id));
  const current = open === null ? null : visible[open];

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
    {available.length > 2 && <div className="chip-row chip-row--center" role="group" aria-label="Filter photos">{available.map((option) => <button key={option.id} type="button" className={filter === option.id ? "chip-btn is-active" : "chip-btn"} aria-pressed={filter === option.id} onClick={() => { setFilter(option.id); setOpen(null); }}>{option.label}</button>)}</div>}
    <div className="masonry">{visible.map((item, index) => <figure key={item.key} className="masonry__item">
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
