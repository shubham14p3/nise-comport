"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Paging for long lists: shows `page` items, then "Show more". Starts again when `resetKey`
 * changes (a new search or filter). Hidden items can stay in the HTML for search engines.
 */
export function useShowMore(page: number, resetKey: string) {
  const [state, setState] = useState({ key: resetKey, count: page });
  const count = state.key === resetKey ? state.count : page;
  return { count, more: () => setState({ key: resetKey, count: count + page }) };
}

export default function ShowMore({ shown, total, onMore, label = "items" }: { shown: number; total: number; onMore: () => void; label?: string }) {
  if (total <= shown) return total > 0 ? <p className="show-more__count">Showing all {total} {label}</p> : null;
  return <div className="show-more">
    <p className="show-more__count">Showing {shown} of {total} {label}</p>
    <button type="button" className="btn btn--ghost" onClick={onMore}><ChevronDown size={18}/>Show more ({total - shown} left)</button>
  </div>;
}
