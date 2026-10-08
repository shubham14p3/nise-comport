"use client";

import { useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import { getRecordsLoading, subscribeRecordsLoading } from "@/lib/records-client";

/** Shows which records request is running right now (bottom of the screen). Nothing when idle. */
export default function RecordsLoading() {
  const labels = useSyncExternalStore(subscribeRecordsLoading, getRecordsLoading, () => [] as string[]);
  if (!labels.length) return null;
  const latest = labels[labels.length - 1];
  return <div className="loading-toast" role="status" aria-live="polite">
    <Loader2 size={16} className="spin" aria-hidden="true"/> {latest}{labels.length > 1 ? ` (${labels.length} running)` : ""}
  </div>;
}
