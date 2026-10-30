"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { LoaderCircle } from "lucide-react";
import { getApiActivity, getServerApiActivity, subscribeApiActivity } from "@/lib/api-activity";

/** Any encrypted UI API call shows one shared progress indicator after 280ms.
 * A short threshold avoids flashing for instant reads and background checks.
 * It is intentionally not a fabricated percentage-complete bar.
 */
export default function ApiActivityIndicator() {
  const pending = useSyncExternalStore(subscribeApiActivity, getApiActivity, getServerApiActivity);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (pending === 0) return;
    const timer = window.setTimeout(() => setVisible(true), 280);
    return () => window.clearTimeout(timer);
  }, [pending]);
  if (!pending || !visible) return null;
  return <div className="api-activity" role="status" aria-label="Processing your request" aria-live="polite">
    <LoaderCircle size={19} className="api-activity__spin" aria-hidden="true"/>
    <span>Working on your request…</span>
  </div>;
}
