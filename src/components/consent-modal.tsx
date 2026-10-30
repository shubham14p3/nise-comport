"use client";

import { ShieldCheck, X } from "lucide-react";

/**
 * Shown once, right before a request is actually sent, so the customer explicitly agrees that:
 * we may reach out again for more documents (including hard-copy originals), and that sending
 * the request means they're consenting to us collecting/using those documents to deliver the
 * service. Protects both sides — the customer knows what to expect, and we have a clear record
 * that this was agreed to before anything was collected.
 */
export default function ConsentModal({ open, onClose, onConfirm, busy, serviceLabel }: { open: boolean; onClose: () => void; onConfirm: () => void; busy?: boolean; serviceLabel?: string }) {
  if (!open) return null;
  return <div className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="consent-dialog-title" onClick={onClose}>
    <div className="help-dialog__card" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="icon-btn help-dialog__close" aria-label="Close" onClick={onClose} disabled={busy}><X size={20}/></button>
      <span className="chip chip--soft" style={{ marginBottom: 10 }}><ShieldCheck size={14}/> Before you send this</span>
      <h2 id="consent-dialog-title">Quick thing to agree to first</h2>
      <div className="help-dialog__docs">
        <p style={{ marginTop: 0 }}>To complete your {serviceLabel ?? "request"}, we may need to contact you again — by call, WhatsApp or email — for:</p>
        <ol>
          <li>Extra information or a clarification on something you&apos;ve shared.</li>
          <li>Documents we don&apos;t have yet, including hard-copy originals where the government portal or insurer requires one in person.</li>
        </ol>
        <p>By sending this request, you&apos;re giving NiSE COMPORT consent to collect and use the details and documents you share, solely to provide this service on your behalf. We will never ask you for OTPs, PINs or passwords.</p>
        <p style={{ marginBottom: 0 }}>If anything about your request needs sorting out, we&apos;ll get back to you directly — and you&apos;re always welcome to reach us the same way.</p>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn--primary" disabled={busy} onClick={onConfirm}>{busy ? "Sending…" : "I agree — send my request"}</button>
        <button type="button" className="btn btn--ghost" disabled={busy} onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>;
}
