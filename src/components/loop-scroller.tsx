"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * One-line carousel that loops endlessly and moves only when the visitor scrolls, swipes or drags.
 * The scrollbar is hidden. Items are repeated as needed so the loop works with any number of items.
 * The content is drawn three times; the scroll position is kept in the middle copy.
 */
export default function LoopScroller({ children, className = "", label, arrows = false, gap = 12, loop = true, auto = false }: { children: ReactNode; className?: string; label: string; arrows?: boolean; gap?: number; loop?: boolean; auto?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLDivElement>(null);
  const [reps, setReps] = useState(1);
  const drag = useRef({ active: false, moved: false, x: 0, left: 0 });

  const measure = useCallback(() => {
    const el = box.current; const group = first.current;
    if (!el || !group) return;
    const width = group.offsetWidth;
    if (width <= 0) return;
    // Repeat the items inside each copy until one copy is wider than the box, so even a few cards can loop.
    const need = Math.min(8, Math.max(1, Math.ceil((el.clientWidth + 1) / (width / reps))));
    if (need !== reps) { setReps(need); return; }
    if (el.scrollLeft < width || el.scrollLeft >= width * 2) el.scrollLeft = width + (el.scrollLeft % width);
  }, [reps]);

  useLayoutEffect(() => {
    measure();
    const el = box.current; const group = first.current;
    if (!el || !group || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el); observer.observe(group);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => { measure(); }, [children, measure]);

  // Optional slow drift. It stops while the visitor hovers, touches or drags, and picks up again a few seconds later.
  const hold = useRef({ hover: false, until: 0 });
  useEffect(() => {
    if (!auto || !loop || typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0; let last = performance.now(); let pos = -1;
    const tick = (now: number) => {
      const el = box.current; const group = first.current;
      const dt = Math.min(now - last, 64); last = now;
      if (el && group && group.offsetWidth > 0) {
        if (hold.current.hover || now < hold.current.until || document.hidden) pos = -1;
        else {
          if (pos < 0 || Math.abs(pos - el.scrollLeft) > 2) pos = el.scrollLeft;
          pos += dt * 0.035;
          const width = group.offsetWidth;
          if (pos >= width * 2) pos -= width;
          el.scrollLeft = pos;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [auto, loop]);
  const pause = (ms = 2500) => { hold.current.until = performance.now() + ms; };

  function onScroll() {
    const el = box.current; const group = first.current;
    if (!el || !group) return;
    const width = group.offsetWidth;
    if (width <= 0) return;
    if (el.scrollLeft < width) el.scrollLeft += width;
    else if (el.scrollLeft >= width * 2) el.scrollLeft -= width;
  }

  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
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

  if (!loop) return <div className="loop-wrap is-still" style={{ ["--loop-gap" as string]: `${gap}px` }}><div className={`loop-scroller ${className}`}><div className="loop-scroller__group" role="list" aria-label={label}>{children}</div></div></div>;

  return <div className="loop-wrap" style={{ ["--loop-gap" as string]: `${gap}px` }}>
    <div ref={box} className={`loop-scroller ${className}`} onScroll={onScroll} onMouseEnter={() => { hold.current.hover = true; }} onMouseLeave={() => { hold.current.hover = false; pause(); }} onTouchStart={() => pause(4000)} onTouchEnd={() => pause(4000)} onWheel={() => pause(4000)} onFocus={() => pause(6000)} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
      onClickCapture={(event) => { if (drag.current.moved) { event.preventDefault(); event.stopPropagation(); } }}>
      {[0, 1, 2].map((copy) => <div key={copy} ref={copy === 0 ? first : undefined} className="loop-scroller__group" {...(copy === 0 ? { role: "list", "aria-label": label } : { "aria-hidden": true, inert: true })}>
        {Array.from({ length: reps }, (_, rep) => <div key={rep} className="loop-rep" {...(copy === 0 && rep === 0 ? {} : { "aria-hidden": true, inert: true })}>{children}</div>)}
      </div>)}
    </div>
    {arrows && <>
      <button type="button" className="loop-arrow loop-arrow--prev" aria-label="Previous" onClick={() => by(-1)}><ChevronLeft size={20}/></button>
      <button type="button" className="loop-arrow loop-arrow--next" aria-label="Next" onClick={() => by(1)}><ChevronRight size={20}/></button>
    </>}
  </div>;
}
