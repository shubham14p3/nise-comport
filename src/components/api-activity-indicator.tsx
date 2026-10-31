"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { DEFAULT_LOADER_SRC, LOADER_CHANGED, loaderSettings } from "@/lib/loader-config";
import { getApiActivity, getServerApiActivity, subscribeApiActivity, trackApiActivity } from "@/lib/api-activity";

/**
 * One consistent progress indicator for encrypted UI calls and standard same-origin
 * /api requests. The late threshold prevents flashes for instant background polling.
 */
export default function ApiActivityIndicator({ loaderSrc = null }: { loaderSrc?: string | null }) {
  const pending = useSyncExternalStore(subscribeApiActivity, getApiActivity, getServerApiActivity);
  const [override, setOverride] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const changed = (event: Event) => setOverride(loaderSettings((event as CustomEvent).detail).src);
    window.addEventListener(LOADER_CHANGED, changed);
    return () => window.removeEventListener(LOADER_CHANGED, changed);
  }, []);

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

  const src = override === undefined ? loaderSettings({ src: loaderSrc }).src : override;
  return pending > 0 ? <ActivityBadge src={src}/> : null;
}

/** A new busy episode gets its own delay; concurrent requests do not restart it. */
function ActivityBadge({ src }: { src: string | null }) {
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 220);
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return null;
  const imageSrc = src && !failed.includes(src) ? src : DEFAULT_LOADER_SRC;
  return <div className="api-activity api-activity--branded" role="status" aria-label="NiSE COMPORT is processing your request" aria-live="polite">
    <span className="api-activity__mark" aria-hidden="true">
      {!failed.includes(imageSrc)
        // eslint-disable-next-line @next/next/no-img-element -- custom animated loader must retain animation
        ? <img className="api-activity__logo" src={imageSrc} alt="" width={78} height={34} onError={() => setFailed((previous) => [...previous, imageSrc])}/>
        : <span className="nc-lettermark"><span>N</span><span>i</span><span>S</span><span>E</span></span>}
      <span className="api-activity__orbit"/>
    </span>
    <span className="api-activity__description"><strong>NiSE COMPORT</strong><small>Processing your request…</small></span>
    <span className="api-activity__track" aria-hidden="true"><span/></span>
  </div>;
}
