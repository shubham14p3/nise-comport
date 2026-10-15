"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { promoDict } from "@/lib/promo-i18n";
import type { Locale } from "@/lib/i18n";

/** Copies a promo code (or any short text) and says "Copied!" for two seconds. */
export default function CopyCode({ text, locale, label, className = "copy-btn" }: { text: string; locale: Locale; label?: string; className?: string }) {
  const t = promoDict(locale);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older browsers: select-and-copy fallback.
      const area = document.createElement("textarea");
      area.value = text; area.setAttribute("readonly", ""); area.style.position = "fixed"; area.style.opacity = "0";
      document.body.appendChild(area); area.select();
      try { document.execCommand("copy"); } catch { /* nothing else to try */ }
      area.remove();
    }
    setCopied(true);
  }

  const caption = copied ? t.copied : label ?? t.copy;
  return <button type="button" className={`${className}${copied ? " is-copied" : ""}`} onClick={() => void copy()} aria-live="polite" title={caption}>
    {copied ? <Check size={15} aria-hidden="true"/> : <Copy size={15} aria-hidden="true"/>}
    <span>{caption}</span>
  </button>;
}
