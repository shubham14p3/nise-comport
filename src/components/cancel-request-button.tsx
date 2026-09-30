"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";

/** Lets a customer cancel a request before staff have finished it. */
export default function CancelRequestButton({ reference, onDone }: { reference: string; onDone?: () => void | Promise<void> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function cancel(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await secureApi("G8q4T1vM6rC0", { reference, reason });
      setOpen(false); if (onDone) await onDone(); else router.refresh();
    } catch (reason) { setError(reason instanceof TypeError ? "You appear to be offline. Check your connection and try again." : reason instanceof Error ? reason.message : "Could not cancel this request."); }
    finally { setBusy(false); }
  }

  if (!open) return <button type="button" className="button button-outline" onClick={() => setOpen(true)}>Cancel this request</button>;
  return <form className="cancel-request-form" onSubmit={cancel}>
    <label>Reason (optional)<textarea maxLength={300} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. I completed it elsewhere"/></label>
    {error && <div className="form-alert error-alert" role="alert">{error}</div>}
    <div className="security-actions"><button className="button button-danger" disabled={busy}>{busy ? "Cancelling…" : "Yes, cancel request"}</button><button type="button" className="profile-text-button" onClick={() => setOpen(false)} disabled={busy}>Keep request</button></div>
  </form>;
}
