"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** After moving to another page, start at the top (the smooth-scroll setting otherwise leaves you down by the footer). */
export default function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.location.hash && document.getElementById(window.location.hash.slice(1))) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}
