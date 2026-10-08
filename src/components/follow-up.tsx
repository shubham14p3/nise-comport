"use client";

import { FormEvent, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { secureApi } from "@/lib/secure-api-client";

export type FollowUpItem = { id: string; byStaff: boolean; author: string; body: string; createdAt: string };

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

/**
 * A small message thread on one record. Closed by default, just an icon with the number of messages.
 * Customers write what is not working; staff reply. Both see the same thread.
 */
export default function FollowUp({ recordId, items, op, canWrite, hint, placeholder, onAdded }: {
  recordId: string; items: FollowUpItem[]; op: string; canWrite: boolean; hint: string; placeholder: string; onAdded: (item: FollowUpItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    setBusy(true); setError("");
    try {
      const result = await secureApi<{ item: FollowUpItem }>(op, { recordId, body: text }, "Sending…");
      onAdded(result.item); setText("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send that."); }
    finally { setBusy(false); }
  }

  return <div className="followup">
    <button type="button" className="followup__toggle" aria-expanded={open} aria-label={`Follow-up on this record${items.length ? `, ${items.length} message${items.length === 1 ? "" : "s"}` : ""}`} title="Follow-up" onClick={() => setOpen((value) => !value)}>
      <MessageCircle size={16}/>{items.length ? <b>{items.length}</b> : null}
    </button>
    {open && <div className="followup__panel">
      {items.length ? <ul className="followup__list">{items.map((item) => <li key={item.id} className={item.byStaff ? "is-staff" : undefined}>
        <small>{item.author} · {when(item.createdAt)}</small>
        <p>{item.body}</p>
      </li>)}</ul> : <p className="field__hint">{hint}</p>}
      {canWrite
        ? <form onSubmit={send}>
          <textarea value={text} maxLength={500} rows={2} onChange={(event) => setText(event.target.value)} placeholder={placeholder} aria-label="Your message"/>
          <button className="btn btn--primary btn--sm" disabled={busy || !text.trim()}>{busy ? "Sending…" : "Send"}<Send size={14}/></button>
        </form>
        : <p className="field__hint">Messages can’t be sent while viewing an account for support.</p>}
      {error ? <small role="alert" className="followup__error">{error}</small> : null}
    </div>}
  </div>;
}
