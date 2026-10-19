"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * One-line carousel that loops endlessly and moves only when the visitor scrolls, swipes or drags.
 * The scrollbar is hidden. If everything fits on screen it simply sits still, with no copies.
 * The content is drawn three times; the scroll position is kept in the middle copy.
 */
export default function LoopScroller({ children, className = "", label, arrows = false, gap = 12 }: { children: ReactNode; className?: string; label: string; arrows?: boolean; gap?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLDivElement>(null);
  const [fits, setFits] = useState(false);
  const drag = useRef({ active: false, moved: false, x: 0, left: 0 });

  const measure = useCallback(() => {
    const el = box.current; const group = first.current;
    if (!el || !group) return;
    const width = group.offsetWidth;
    const nextFits = width <= el.clientWidth + 1;
    setFits(nextFits);
    if (!nextFits && (el.scrollLeft < width || el.scrollLeft >= width * 2)) el.scrollLeft = width + (el.scrollLeft % width);
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = box.current; const group = first.current;
    if (!el || !group || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el); observer.observe(group);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => { measure(); }, [children, measure]);

  function onScroll() {
    const el = box.current; const group = first.current;
    if (!el || !group || fits) return;
    const width = group.offsetWidth;
    if (width <= 0) return;
    if (el.scrollLeft < width) el.scrollLeft += width;
    else if (el.scrollLeft >= width * 2) el.scrollLeft -= width;
  }

  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0 || fits) return;
    drag.current = { active: true, moved: false, x: event.clientX, left: box.current?.scrollLeft ?? 0 };
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state.active || !box.current) return;
    const delta = event.clientX - state.x;
    if (Math.abs(delta) > 5) { state.moved = true; box.current.classList.add("is-dragging"); }
    if (state.moved) box.current.scrollLeft = state.left - delta;
  }
  function up() {
    drag.current.active = false;
    window.setTimeout(() => { drag.current.moved = false; box.current?.classList.remove("is-dragging"); }, 0);
  }
  function by(direction: 1 | -1) { const el = box.current; if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" }); }

  return <div className={`loop-wrap${fits ? " is-still" : ""}`} style={{ ["--loop-gap" as string]: `${gap}px` }}>
    <div ref={box} className={`loop-scroller ${className}`} onScroll={onScroll} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
      onClickCapture={(event) => { if (drag.current.moved) { event.preventDefault(); event.stopPropagation(); } }}>
      <div ref={first} className="loop-scroller__group" role="list" aria-label={label}>{children}</div>
      {!fits && <>
        <div className="loop-scroller__group" aria-hidden="true" inert>{children}</div>
        <div className="loop-scroller__group" aria-hidden="true" inert>{children}</div>
      </>}
    </div>
    {arrows && !fits && <>
      <button type="button" className="loop-arrow loop-arrow--prev" aria-label="Previous" onClick={() => by(-1)}><ChevronLeft size={20}/></button>
      <button type="button" className="loop-arrow loop-arrow--next" aria-label="Next" onClick={() => by(1)}><ChevronRight size={20}/></button>
    </>}
  </div>;
}
