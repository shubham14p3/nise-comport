"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { getApiActivity, getServerApiActivity, subscribeApiActivity, trackApiActivity } from "@/lib/api-activity";

/**
 * One consistent progress indicator for encrypted UI calls and standard same-origin
 * /api requests. The late threshold prevents flashes for instant background polling.
 */
export default function ApiActivityIndicator() {
  const pending = useSyncExternalStore(subscribeApiActivity, getApiActivity, getServerApiActivity);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Some older UI modules still use native fetch rather than secureApi.
    // Keep those calls visible too, without instrumenting the already-tracked
    // encrypted endpoint or unrelated third-party requests.
    const original = window.fetch;
    const instrumented: typeof window.fetch = (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      let path = "";
      try { const parsed = new URL(url, window.location.href); if (parsed.origin === window.location.origin) path = parsed.pathname; }
      catch { /* Native fetch handles invalid URLs as before. */ }
      const task = original.call(window, input, init);
      return path.startsWith("/api/") && path !== "/api/x7q9m2" ? trackApiActivity(task) : task;
    };
    window.fetch = instrumented;
    return () => { if (window.fetch === instrumented) window.fetch = original; };
  }, []);

  useEffect(() => {
    if (pending === 0) return;
    const timer = window.setTimeout(() => setVisible(true), 220);
    return () => window.clearTimeout(timer);
  }, [pending]);

  if (!pending || !visible) return null;
  return <div className="api-activity api-activity--branded" role="status" aria-label="NiSE COMPORT is processing your request" aria-live="polite">
    <span className="api-activity__mark" aria-hidden="true">
      <Image src="/images/logo/logo-footer.png" alt="" width={100} height={30} className="api-activity__logo"/>
      <span className="api-activity__orbit"/>
    </span>
    <span className="api-activity__description"><strong>NiSE COMPORT</strong><small>Processing your request…</small></span>
    <span className="api-activity__track" aria-hidden="true"><span/></span>
  </div>;
}
