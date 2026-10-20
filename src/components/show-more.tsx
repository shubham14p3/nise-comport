"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { tr } from "@/lib/tr";

/**
 * Paging for long lists: shows `page` items, then "Show more". Starts again when `resetKey`
 * changes (a new search or filter). Hidden items can stay in the HTML for search engines.
 */
export function useShowMore(page: number, resetKey: string) {
  const [state, setState] = useState({ key: resetKey, count: page });
  const count = state.key === resetKey ? state.count : page;
  return { count, more: () => setState({ key: resetKey, count: count + page }) };
}

export default function ShowMore({ shown, total, onMore, label = "items", lang = "en" }: { shown: number; total: number; onMore: () => void; label?: string; lang?: Locale }) {
  const t = tr(lang);
  if (total <= shown) return total > 0 ? <p className="show-more__count">{t("Showing all", "सभी दिख रहे हैं:", "সব দেখানো হচ্ছে:")} {total} {label}</p> : null;
  return <div className="show-more">
    <p className="show-more__count">{lang === "en" ? `Showing ${shown} of ${total} ${label}` : lang === "hi" ? `${total} ${label} में से ${shown} दिख रहे हैं` : `${total}টির মধ্যে ${shown}টি ${label} দেখানো হচ্ছে`}</p>
    <button type="button" className="btn btn--ghost" onClick={onMore}><ChevronDown size={18}/>{lang === "en" ? `Show more (${total - shown} left)` : lang === "hi" ? `और दिखाएँ (${total - shown} बाकी)` : `আরও দেখুন (${total - shown}টি বাকি)`}</button>
  </div>;
}
