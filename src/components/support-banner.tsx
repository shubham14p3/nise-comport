"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { secureApi } from "@/lib/secure-api-client";

type Status = { active: boolean; targetName?: string; targetEmail?: string; ownerName?: string; expiresAt?: string };

/** Shown only while the owner is viewing a customer's account for support. */
export default function SupportBanner() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Checked on every page change: a switch to a customer is a client-side navigation, so the layout does not remount.
  useEffect(() => {
    // The hint cookie is set only during a support view, so normal visitors make no extra request.
    if (!document.cookie.split("; ").some((c) => c.startsWith("nc_sv=1"))) return;
    let cancelled = false;
    secureApi<Status>("P9d4Ks1mL7qY", {}).then((result) => { if (!cancelled) setStatus(result); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [pathname]);

  if (!status?.active) return null;

  async function stop() {
    setBusy(true);
    try { await secureApi("F2n8Vb6tW0xE", {}); } catch { /* the session expires on its own */ }
    setStatus(null);
    router.push("/admin"); router.refresh();
  }

  const until = status.expiresAt ? new Date(status.expiresAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "";
  return (
    <div className="support-banner" role="status">
      <span>Viewing <b>{status.targetName}</b>’s account for support{until ? ` · ends ${until}` : ""}. Your actions are logged.</span>
      <button type="button" className="btn btn--ghost" onClick={stop} disabled={busy}>{busy ? "Going back…" : "Back to my admin account"}</button>
    </div>
  );
}
