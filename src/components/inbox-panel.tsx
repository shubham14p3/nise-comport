"use client";

import ClaimsPanel from "@/components/claims-panel";
import { useEffect, useState } from "react";
import { Bell, Check, Eye, Phone, RefreshCw, UserRound, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { secureApi } from "@/lib/secure-api-client";

type Item = { id: string; kind: string; category: string | null; title: string; detail: string | null; createdAt: string; actor: string | null };
type Lead = { id: string; name: string; phone: string; topic: string; message: string | null; status: string; page: string | null; createdAt: string };
type Inbox = { items: Item[]; unread: number; seenAt: string; pending: { category: string; label: string; total: number }[]; leads: Lead[] };

const ICON: Record<string, string> = { lead: "📞", request: "📝", print: "🖨️", status: "🔄", import: "📥", record_view: "👁️", claim: "🔑", flag: "🚩", signup: "🆕", staff: "👥", campaign: "📣", promotion: "🎟️" };
const ago = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)} h ago`;
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
};
const PAGE_SIZE = 15;

/** "Showing 1–15 of 52" with Previous / Next. Hidden when everything fits on one page. */
function Pager({ page, total, onPage, label }: { page: number; total: number; onPage: (next: number) => void; label: string }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (total <= PAGE_SIZE) return null;
  const from = page * PAGE_SIZE + 1; const to = Math.min(total, (page + 1) * PAGE_SIZE);
  return <nav className="inbox__pager" aria-label={label}>
    <button type="button" className="btn btn--ghost btn--sm" disabled={page <= 0} onClick={() => onPage(page - 1)}>Previous</button>
    <span>Showing {from}–{to} of {total} · page {page + 1} of {pages}</span>
    <button type="button" className="btn btn--ghost btn--sm" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>Next</button>
  </nav>;
}
const pretty = (phone: string) => phone.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");

/**
 * Admin → Inbox: what's waiting per service, people who asked to be called back, and a feed of
 * what happened (new requests, status changes, imports, who opened which customer records).
 */
export default function InboxPanel({ onSeen }: { onSeen?: () => void }) {
  const [data, setData] = useState<Inbox | null>(null);
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [leadPage, setLeadPage] = useState(0);
  const [feedPage, setFeedPage] = useState(0);

  async function load(nextCategory = category) {
    try { setData(await secureApi<Inbox>("I5x2N8kQ3wT6", { category: nextCategory })); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load the inbox."); }
  }

  useEffect(() => {
    let active = true;
    const refresh = () => secureApi<Inbox>("I5x2N8kQ3wT6", { category: "" })
      .then((result) => { if (active) setData(result); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load the inbox."); });
    void refresh();
    // Opening the inbox marks what's here as seen (after a moment, so the highlights are visible).
    const seen = window.setTimeout(() => { void secureApi("O9c4V7mB2pL5").then(() => onSeen?.()).catch(() => undefined); }, 4000);
    const poll = () => { if (document.visibilityState === "visible") void refresh(); };
    const timer = window.setInterval(poll, 60_000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      active = false;
      window.clearTimeout(seen);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [onSeen]);

  async function lead(row: Lead, status: "called" | "done" | "spam") {
    setBusy(row.id);
    try { await secureApi("E3h8K1tW6qZ9", { id: row.id, status }); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update."); }
    finally { setBusy(""); }
  }

  const seenAt = data ? new Date(data.seenAt).getTime() : 0;
  const leads = data?.leads ?? []; const items = data?.items ?? [];
  // Stay on a valid page when the list shrinks (for example after marking a lead done).
  const leadAt = Math.min(leadPage, Math.max(0, Math.ceil(leads.length / PAGE_SIZE) - 1));
  const feedAt = Math.min(feedPage, Math.max(0, Math.ceil(items.length / PAGE_SIZE) - 1));
  return <section className="admin-queue inbox">
    <h2><Bell size={17}/> Inbox {data?.unread ? <span className="inbox__unread">{data.unread} new</span> : null}
      <button type="button" className="btn btn--ghost btn--sm inbox__refresh" onClick={() => void load()}><RefreshCw size={14}/>Refresh</button></h2>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    <ClaimsPanel onChange={onSeen}/>

    {data && data.pending.length > 0 && <div className="inbox__pending">
      {data.pending.map((item) => <button key={item.category} type="button" className={category === item.category ? "is-active" : undefined} onClick={() => { const next = category === item.category ? "" : item.category; setCategory(next); setFeedPage(0); void load(next); }}>
        <b>{item.total}</b><span>{item.label}</span><small>waiting</small>
      </button>)}
    </div>}

    {data && data.leads.length > 0 && <div className="inbox__leads">
      <h3><Phone size={16}/> Call these people back <span>{data.leads.length}</span></h3>
      {leads.slice(leadAt * PAGE_SIZE, (leadAt + 1) * PAGE_SIZE).map((row) => <article key={row.id} className={`lead-row lead-row--${row.status}`}>
        <div><b>{row.name}</b> <a href={`tel:${row.phone}`}>{pretty(row.phone)}</a>
          <small>{row.topic}{row.message && !row.message.includes("\n") ? ` — ${row.message}` : ""} · {ago(row.createdAt)}{row.status === "called" ? " · called once" : ""}</small>
          {row.message?.includes("\n") && <p className="lead-row__details">{row.message}</p>}</div>
        <div className="lead-row__actions">
          <a className="btn btn--ghost btn--sm" href={`tel:${row.phone}`}><Phone size={14}/>Call</a>
          <a className="btn btn--ghost btn--sm" href={`https://wa.me/${row.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Namaste ${row.name}, NISE COMPORT here about your enquiry: ${row.topic}.`)}`} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={14}/>WhatsApp</a>
          {row.status === "new" && <button type="button" className="profile-text-button" disabled={busy === row.id} onClick={() => void lead(row, "called")}><Check size={13}/>Called</button>}
          <button type="button" className="profile-text-button" disabled={busy === row.id} onClick={() => void lead(row, "done")}><Check size={13}/>Done</button>
          <button type="button" className="profile-text-button" disabled={busy === row.id} onClick={() => void lead(row, "spam")}><X size={13}/>Spam</button>
        </div>
      </article>)}
      <Pager page={leadAt} total={leads.length} onPage={setLeadPage} label="Call-back pages"/>
    </div>}

    <h3 className="inbox__feed-title">Activity{category ? ` · ${data?.pending.find((item) => item.category === category)?.label ?? category}` : ""}</h3>
    <ol className="inbox__feed">{items.slice(feedAt * PAGE_SIZE, (feedAt + 1) * PAGE_SIZE).map((item) => <li key={item.id} className={new Date(item.createdAt).getTime() > seenAt ? "is-new" : undefined}>
      <span className="inbox__icon" aria-hidden="true">{ICON[item.kind] ?? "•"}</span>
      <div><b>{item.title}</b>{item.detail && <small>{item.detail}</small>}</div>
      <time dateTime={item.createdAt}>{item.kind === "record_view" ? <Eye size={12}/> : item.actor ? <UserRound size={12}/> : null} {ago(item.createdAt)}</time>
    </li>)}</ol>
    <Pager page={feedAt} total={items.length} onPage={setFeedPage} label="Activity pages"/>
    {data && !data.items.length && <p className="admin-empty">Nothing yet. New requests, call-back requests and staff actions appear here.</p>}
  </section>;
}
