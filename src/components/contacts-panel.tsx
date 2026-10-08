"use client";

import { FormEvent, useEffect, useState } from "react";
import { Contact, Search, ThumbsDown, ThumbsUp, UserPlus } from "lucide-react";
import { CAMPAIGN_SERVICES, serviceTitle } from "@/lib/campaign-text";
import { secureApi } from "@/lib/secure-api-client";
import EmailCampaignsPanel from "@/components/email-campaigns-panel";

type Row = { id: string; name: string; phone: string; locale: string; area: string | null; services: { service: string; renewalOn?: string | null; note?: string | null }[]; consent: string; lastMessagedAt: string | null; source: string | null };
type Listing = { contacts: Row[]; totals: Record<string, number>; matching: number; page: number; pageSize: number };
const CONSENT: Record<string, { label: string; className: string }> = {
  unknown: { label: "Not asked yet", className: "status-pill" },
  opted_in: { label: "Said YES", className: "status-pill status-pill--done" },
  opted_out: { label: "Said STOP", className: "status-pill status-pill--warn" },
};
const day = (iso: string | null | undefined) => iso ? new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";

/** Admin → Contacts: who may be messaged, their services and renewal dates, and YES/STOP. */
export default function ContactsPanel() {
  const [data, setData] = useState<Listing | null>(null);
  const [q, setQ] = useState("");
  const [consent, setConsent] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", locale: "en", service: "insurance", renewalOn: "", consent: "unknown" });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [page, setPage] = useState(0);
  async function load(nextQ = q, nextConsent = consent, nextPage = 0) {
    try { setData(await secureApi<Listing>("D4q8M2wS7kF1", { q: nextQ, consent: nextConsent, page: nextPage })); setPage(nextPage); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load contacts."); }
  }
  useEffect(() => {
    let active = true;
    secureApi<Listing>("D4q8M2wS7kF1", { q: "", consent: "" }).then((result) => { if (active) setData(result); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load contacts."); });
    return () => { active = false; };
  }, []);

  async function add(event: FormEvent) {
    event.preventDefault(); setBusy("add"); setError(""); setNotice("");
    try {
      await secureApi("Y2n6R9tC4vK7", { name: form.name, phone: form.phone, locale: form.locale, consent: form.consent, services: form.service ? [{ service: form.service, renewalOn: form.renewalOn || null }] : [] });
      setNotice(`${form.name} saved. The same mobile number is never stored twice.`);
      setForm({ ...form, name: "", phone: "", renewalOn: "" });
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save the contact."); }
    finally { setBusy(""); }
  }

  async function setAnswer(row: Row, next: "opted_in" | "opted_out" | "unknown") {
    setBusy(row.id); setError("");
    try { await secureApi("J7t1P5xW3qM9", { id: row.id, consent: next }); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update."); }
    finally { setBusy(""); }
  }

  const totals = data?.totals ?? {};
  return <section className="admin-queue contacts">
    <EmailCampaignsPanel/>
    <h2><Contact size={17}/> Contacts <span>{Object.values(totals).reduce((sum, value) => sum + value, 0)}</span></h2>
    <p className="admin-lead">Everyone the shop may message on WhatsApp. People who say <b>STOP</b> are never messaged again, even if they appear in a later list. Excel lists (PAN, insurance, voter ID…) can be imported here next.</p>
    <form className="promo-admin__bar" role="search" onSubmit={(event) => { event.preventDefault(); void load(); }}>
      <div className="seg">{[["", "All"], ["unknown", "Not asked"], ["opted_in", "YES"], ["opted_out", "STOP"]].map(([id, label]) => <button key={id} type="button" className={consent === id ? "is-active" : undefined} onClick={() => { setConsent(id); void load(q, id); }}>{label}{id && totals[id] !== undefined ? ` · ${totals[id]}` : ""}</button>)}</div>
      <label className="input-wrap"><Search size={16}/><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name, mobile or area" aria-label="Search contacts"/></label>
      <button className="btn btn--ghost btn--sm">Search</button>
    </form>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    {notice && <div className="alert alert--success" role="status">{notice}</div>}
    <div className="contact-list">{(data?.contacts ?? []).map((row) => <article key={row.id} className="contact-row">
      <div><b>{row.name}</b><small>{row.phone} · {row.locale.toUpperCase()}{row.area ? ` · ${row.area}` : ""}{row.source ? ` · from ${row.source}` : ""}{row.lastMessagedAt ? ` · last messaged ${day(row.lastMessagedAt)}` : ""}</small>
        {row.services.length > 0 && <span className="contact-row__services">{row.services.map((item) => <em key={`${item.service}-${item.renewalOn ?? ""}`}>{serviceTitle(item.service)}{item.renewalOn ? ` · due ${day(item.renewalOn)}` : ""}</em>)}</span>}
      </div>
      <span className={CONSENT[row.consent]?.className ?? "status-pill"}>{CONSENT[row.consent]?.label ?? row.consent}</span>
      <div className="contact-row__actions">
        {row.consent !== "opted_in" && <button type="button" className="profile-text-button" disabled={busy === row.id} onClick={() => void setAnswer(row, "opted_in")}><ThumbsUp size={13}/> Said YES</button>}
        {row.consent !== "opted_out" && <button type="button" className="profile-text-button" disabled={busy === row.id} onClick={() => void setAnswer(row, "opted_out")}><ThumbsDown size={13}/> Said STOP</button>}
      </div>
    </article>)}</div>
    {data && !data.contacts.length && <p className="admin-empty">No contacts match. Import your registers with “Also add mobile numbers to WhatsApp contacts” ticked to fill this list.</p>}
    {data && data.matching > data.pageSize && <div className="pager">
      <button type="button" className="btn btn--ghost btn--sm" disabled={page === 0} onClick={() => void load(q, consent, page - 1)}>Previous</button>
      <span>Page {page + 1} of {Math.ceil(data.matching / data.pageSize)} · {data.matching.toLocaleString("en-IN")} contacts</span>
      <button type="button" className="btn btn--ghost btn--sm" disabled={(page + 1) * data.pageSize >= data.matching} onClick={() => void load(q, consent, page + 1)}>Next</button>
    </div>}
    {data && data.matching <= data.pageSize && data.matching > 0 && <p className="field__hint">{data.matching.toLocaleString("en-IN")} contacts</p>}
    <form className="team-add" onSubmit={add}>
      <h3><UserPlus size={17}/> Add a contact</h3>
      <div className="form-grid form-grid--3">
        <label className="field"><span className="field__label">Name</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={100}/></label>
        <label className="field"><span className="field__label">Mobile</span><input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="98765 43210" inputMode="tel"/></label>
        <label className="field"><span className="field__label">Language</span><select value={form.locale} onChange={(event) => setForm({ ...form, locale: event.target.value })}><option value="en">English</option><option value="hi">हिन्दी</option><option value="bn">বাংলা</option></select></label>
        <label className="field"><span className="field__label">Service</span><select value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })}><option value="">None</option>{CAMPAIGN_SERVICES.map((service) => <option key={service} value={service}>{serviceTitle(service)}</option>)}</select></label>
        <label className="field"><span className="field__label">Renewal / expiry date <em>optional</em></span><input type="date" value={form.renewalOn} onChange={(event) => setForm({ ...form, renewalOn: event.target.value })}/></label>
        <label className="field"><span className="field__label">WhatsApp permission</span><select value={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.value })}><option value="unknown">Not asked yet</option><option value="opted_in">Said YES</option><option value="opted_out">Said STOP</option></select></label>
      </div>
      <button className="btn btn--primary" disabled={busy === "add"}>{busy === "add" ? "Saving…" : "Save contact"}<UserPlus size={16}/></button>
    </form>
  </section>;
}
