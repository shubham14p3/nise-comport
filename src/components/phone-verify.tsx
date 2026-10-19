"use client";

import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { secureResult } from "@/lib/secure-api-client";

type Reply = { error?: string; fields?: Record<string, string>; resendAfter?: number };

/** Under the mobile number field: proves the number is yours with an SMS code, so you can sign in with it. */
export default function PhoneVerify({ phone, verified, enabled, onVerified }: { phone: string; verified: boolean; enabled: boolean; onVerified: () => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const [wait, setWait] = useState(0);
  useEffect(() => { if (wait <= 0) return; const timer = window.setTimeout(() => setWait((n) => n - 1), 1000); return () => window.clearTimeout(timer); }, [wait]);

  if (!phone.trim()) return null;
  if (verified) return <p className="phone-verify phone-verify--ok"><BadgeCheck size={16}/> Mobile number verified. You can sign in with it.</p>;
  if (!enabled) return null;

  async function call(action: "send" | "verify") {
    setBusy(true); setError(""); setMessage("");
    try {
      const { ok, result } = await secureResult<Reply>("M8b5C1qJ7yL2", { action, phone, code: code.trim() });
      if (!ok) { setError(result.fields?.code ?? result.fields?.phone ?? result.error ?? "Something went wrong."); return; }
      if (action === "send") { setOpen(true); setWait(result.resendAfter ?? 60); setMessage("We sent a 6-digit code by SMS."); }
      else onVerified();
    } finally { setBusy(false); }
  }

  return <div className="phone-verify">
    {!open ? <button type="button" className="link-btn" disabled={busy} onClick={() => void call("send")}>{busy ? "Sending…" : "Verify this number by SMS"}</button>
      : <div className="phone-verify__row">
        <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" aria-label="SMS code"/>
        <button type="button" className="btn btn--primary btn--sm" disabled={busy || code.length !== 6} onClick={() => void call("verify")}>Verify</button>
        <button type="button" className="link-btn" disabled={busy || wait > 0} onClick={() => void call("send")}>{wait > 0 ? `Resend in ${wait}s` : "Resend"}</button>
      </div>}
    {message && <p role="status" className="field__hint">{message}</p>}{error && <p role="alert" className="field__error">{error}</p>}
  </div>;
}
