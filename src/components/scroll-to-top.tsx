"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** After moving to another page, start at the top (the smooth-scroll setting otherwise leaves you down by the footer). */
export default function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    // Browser restoring the previous footer position is especially confusing after login.
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, []);
  useEffect(() => {
    // Public pages start at the top. The dashboard uses its own hash-based tabs;
    // let those tabs handle their own scrolling.
    if (window.location.pathname === "/desk" && window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);
  return null;
}
