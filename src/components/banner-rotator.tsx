"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Cycles through announcement slides on the home page. All slides are rendered on the server,
 * so the first one shows without JavaScript; this only switches which one is visible.
 * Pauses on hover or keyboard focus, and doesn't move at all when reduced motion is requested.
 */
export default function BannerRotator({ slides, interval = 6000 }: { slides: ReactNode[]; interval?: number }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), interval);
    return () => window.clearInterval(timer);
  }, [count, paused, interval]);

  return <div className="rotator" role="region" aria-roledescription="carousel" aria-label="Announcements"
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
    onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
    {slides.map((slide, position) => <div key={position} className={`rotator__slide${position === index ? " is-active" : ""}`}
      role="group" aria-roledescription="slide" aria-label={`${position + 1} of ${count}`} aria-hidden={position !== index}>
      {slide}
    </div>)}
    {count > 1 && <div className="rotator__dots" role="tablist" aria-label="Choose announcement">
      {slides.map((_, position) => <button key={position} type="button" role="tab" aria-selected={position === index}
        aria-label={`Show announcement ${position + 1}`} className={position === index ? "is-active" : ""}
        onClick={() => setIndex(position)}/>)}
    </div>}
  </div>;
}
