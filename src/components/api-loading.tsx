"use client";

import { useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import { getApiLoading, subscribeApiLoading } from "@/lib/api-loading";

/** Shows the latest server call that is running (bottom of the screen). Nothing when idle. */
export default function ApiLoading() {
  const labels = useSyncExternalStore(subscribeApiLoading, getApiLoading, () => [] as string[]);
  if (!labels.length) return null;
  const latest = labels[labels.length - 1];
  return <div className="loading-toast" role="status" aria-live="polite">
    <Loader2 size={16} className="spin" aria-hidden="true"/> {latest}{labels.length > 1 ? ` (${labels.length} running)` : ""}
  </div>;
}
