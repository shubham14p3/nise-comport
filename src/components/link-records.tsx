"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { secureApi } from "@/lib/secure-api-client";

/** Sent after a link is approved, so the past records list reloads once. */
export const RECORDS_LINKED_EVENT = "nise:records-linked";

const METHODS = [
  { value: "reference", label: "Reference number on a receipt" },
  { value: "pan", label: "My PAN number" },
  { value: "whatsapp", label: "Send a code on WhatsApp" },
  { value: "staff", label: "Ask the centre to check" },
] as const;

/** Button that opens a dialog to link the past records made under this name and mobile number. */
export default function LinkRecords() {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("reference");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<{ status: string; message: string; code?: string | null } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setResult(null);
    try {
      const response = await secureApi<{ status: string; message: string; code?: string | null }>("Cl4imS9ub2Qv", { mobile, name, method, value: method === "reference" || method === "pan" ? value : undefined });
      setResult(response);
      if (response.status === "approved") window.dispatchEvent(new Event(RECORDS_LINKED_EVENT));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send this request."); }
    finally { setBusy(false); }
  }

  const whatsappHref = result?.code ? `https://wa.me/919771219893?text=${encodeURIComponent(`NISE LINK ${result.code}`)}` : "";

  return <>
    <button type="button" className="btn btn--ghost link-records__open" onClick={() => setOpen(true)}>Link my past records</button>
    {open && <div className="links-modal" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="links-modal__panel" role="dialog" aria-modal="true" aria-labelledby="link-records-title">
        <div className="links-modal__head">
          <h2 id="link-records-title">Link my past records</h2>
          <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close"><X size={18}/></button>
        </div>
        <p>If you came to NISE COMPORT before, your old records may be on file. Enter the mobile number and name used then, and one of the checks below. Records are linked only after the check.</p>
        <form className="link-records__form" onSubmit={submit}>
          <label>Mobile number<input inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile" required/></label>
          <label>Name as it was given then<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Manju Devi" required minLength={2}/></label>
          <label>How should we check?
            <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
              {METHODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          {method === "reference" || method === "pan" ? <label>{method === "pan" ? "PAN number" : "Reference number"}<input value={value} onChange={(e) => setValue(e.target.value)} required/></label> : null}
          <button className="btn btn--primary" disabled={busy}>{busy ? "Sending…" : "Link my records"}</button>
        </form>
        {error ? <p role="alert" className="link-records__error">{error}</p> : null}
        {result ? <div className="link-records__result" role="status">
          <p>{result.message}</p>
          {result.code ? <a className="btn btn--wa" href={whatsappHref} target="_blank" rel="noopener noreferrer">Open WhatsApp and send code {result.code}</a> : null}
        </div> : null}
      </section>
    </div>}
  </>;
}
