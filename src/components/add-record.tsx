"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { UserPlus, X } from "lucide-react";
import { RECORD_STATUSES } from "@/lib/record-status";
import { recordsClient } from "@/lib/records-client";
import { secureApi } from "@/lib/secure-api-client";

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const blank = () => ({ name: "", mobile: "", whatsapp: "", pan: "", email: "", address: "", recordDate: today(), status: "", note: "" });

/**
 * "Add person" for one service. The person is saved like an imported row, so they also show in Master records,
 * get a customer account and a WhatsApp contact. Shown only to staff the owner allowed to add records.
 */
export default function AddRecord({ service, label }: { service: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const set = (key: keyof ReturnType<typeof blank>) => (event: { target: { value: string } }) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await secureApi("Rec0rdAdd7Np", { service, ...form }, "Saving…");
      setNotice(`Added ${form.name.trim()} to ${label}.`);
      setOpen(false);
      recordsClient.clearAll(); // lists on screen refresh in place and the sidebar counts update
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not add this person."); }
    finally { setBusy(false); }
  }

  return <>
    <button type="button" className="btn btn--primary btn--sm" onClick={() => { setForm(blank()); setError(""); setNotice(""); setOpen(true); }}><UserPlus size={15}/> Add person</button>
    {notice ? <small role="status" className="add-record__notice">{notice}</small> : null}
    {open && createPortal(<div className="links-modal" role="dialog" aria-modal="true" aria-label={`Add a person to ${label}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="links-modal__panel">
        <div className="links-modal__head"><h3>Add a person to {label}</h3><button type="button" className="btn btn--ghost btn--sm" aria-label="Close" onClick={() => setOpen(false)}><X size={16}/></button></div>
        <form className="add-record__form" onSubmit={submit}>
          <label className="field"><span className="field__label">Name</span><input required value={form.name} maxLength={100} onChange={set("name")} autoFocus/></label>
          <label className="field"><span className="field__label">Mobile</span><input required inputMode="numeric" value={form.mobile} maxLength={14} onChange={set("mobile")} placeholder="10-digit number"/></label>
          <label className="field"><span className="field__label">WhatsApp <em>if different</em></span><input inputMode="numeric" value={form.whatsapp} maxLength={14} onChange={set("whatsapp")}/></label>
          <label className="field"><span className="field__label">PAN <em>optional</em></span><input value={form.pan} maxLength={10} onChange={(event) => setForm((current) => ({ ...current, pan: event.target.value.toUpperCase() }))} placeholder="ABCDE1234F"/></label>
          <label className="field"><span className="field__label">Email <em>optional</em></span><input type="email" value={form.email} maxLength={254} onChange={set("email")}/></label>
          <label className="field"><span className="field__label">Date</span><input type="date" value={form.recordDate} max={today()} onChange={set("recordDate")}/></label>
          <label className="field"><span className="field__label">Status</span><select value={form.status} onChange={set("status")}>
            <option value="">Automatic (open, or completed if before May 2026)</option>
            {Object.entries(RECORD_STATUSES).map(([key, text]) => <option key={key} value={key}>{text}</option>)}
          </select></label>
          <label className="field add-record__wide"><span className="field__label">Comment <em>shown to the customer</em></span><input value={form.note} maxLength={300} onChange={set("note")}/></label>
          <label className="field add-record__wide"><span className="field__label">Address <em>optional</em></span><input value={form.address} maxLength={300} onChange={set("address")}/></label>
          {error ? <div className="alert alert--error add-record__wide" role="alert">{error}</div> : null}
          <button className="btn btn--primary add-record__wide" disabled={busy || !form.name.trim() || !form.mobile.trim()}>{busy ? "Saving…" : "Add person"}<UserPlus size={16}/></button>
          <p className="field__hint add-record__wide">Saved with the imported data, so they also appear in Master records and get a customer account. A later Excel import of the same person updates this entry.</p>
        </form>
      </div>
    </div>, document.body)}
  </>;
}
