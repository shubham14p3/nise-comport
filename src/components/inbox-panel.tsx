"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, Eye, Phone, RefreshCw, UserRound, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { secureApi } from "@/lib/secure-api-client";

type Item = { id: string; kind: string; category: string | null; title: string; detail: string | null; createdAt: string; actor: string | null };
type Lead = { id: string; name: string; phone: string; topic: string; message: string | null; status: string; page: string | null; createdAt: string };
type Inbox = { items: Item[]; unread: number; seenAt: string; pending: { category: string; label: string; total: number }[]; leads: Lead[] };

const ICON: Record<string, string> = { lead: "📞", request: "📝", print: "🖨️", status: "🔄", import: "📥", record_view: "👁️", staff: "👥", campaign: "📣", promotion: "🎟️" };
const ago = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)} h ago`;
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
};
const pretty = (phone: string) => phone.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");

/**
 * Admin → Inbox: what's waiting per service, people who asked to be called back, and a feed of
 * what happened (new requests, status changes, imports, who opened which customer records).
 */
export default function InboxPanel({ onSeen, active: shown = true }: { onSeen?: () => void; active?: boolean }) {
  const [data, setData] = useState<Inbox | null>(null);
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(0);
  const items = data?.items ?? [];
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pages - 1);
  const shown = items.slice(current * pageSize, current * pageSize + pageSize);

  async function load(nextCategory = category) {
    try { setData(await secureApi<Inbox>("I5x2N8kQ3wT6", { category: nextCategory })); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load the inbox."); }
  }

  const unreadNow = useRef(0);
  const loadedAt = useRef(0);
  useEffect(() => { unreadNow.current = data?.unread ?? 0; }, [data]);

  // Read once when first opened. The panel then stays mounted, so coming back shows it at once.
  useEffect(() => {
    let active = true;
    secureApi<Inbox>("I5x2N8kQ3wT6", { category: "" })
      .then((result) => { if (active) { loadedAt.current = Date.now(); setData(result); } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load the inbox."); });
    return () => { active = false; };
  }, []);

  // While on screen: mark what is here as seen (after a moment, so the highlights are visible)
  // and refresh every two minutes. Nothing runs while the tab is hidden or another area is open.
  useEffect(() => {
    if (!shown) return;
    let active = true;
    const seen = window.setTimeout(() => { if (unreadNow.current > 0) void secureApi("O9c4V7mB2pL5").then(() => onSeen?.()).catch(() => undefined); }, 4000);
    const refresh = () => {
      if (document.hidden) return;
      void secureApi<Inbox>("I5x2N8kQ3wT6", { category: "" })
        .then((result) => { if (active) { loadedAt.current = Date.now(); setData(result); } }).catch(() => undefined);
    };
    if (loadedAt.current && Date.now() - loadedAt.current > 120_000) refresh();
    const timer = window.setInterval(refresh, 120_000);
    return () => { active = false; window.clearTimeout(seen); window.clearInterval(timer); };
  }, [shown, onSeen]);

  async function lead(row: Lead, status: "called" | "done" | "spam") {
    setBusy(row.id);
    try { await secureApi("E3h8K1tW6qZ9", { id: row.id, status }); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update."); }
    finally { setBusy(""); }
  }

  const seenAt = data ? new Date(data.seenAt).getTime() : 0;
  return <section className="admin-queue inbox">
    <h2><Bell size={17}/> Inbox {data?.unread ? <span className="inbox__unread">{data.unread} new</span> : null}
      <button type="button" className="btn btn--ghost btn--sm inbox__refresh" onClick={() => void load()}><RefreshCw size={14}/>Refresh</button></h2>
    {error && <div className="alert alert--error" role="alert">{error}</div>}

    {data && data.pending.length > 0 && <div className="inbox__pending">
      {data.pending.map((item) => <button key={item.category} type="button" className={category === item.category ? "is-active" : undefined} onClick={() => { const next = category === item.category ? "" : item.category; setCategory(next); void load(next); }}>
        <b>{item.total}</b><span>{item.label}</span><small>waiting</small>
      </button>)}
    </div>}

    {data && data.leads.length > 0 && <div className="inbox__leads">
      <h3><Phone size={16}/> Call these people back <span>{data.leads.length}</span></h3>
      {data.leads.map((row) => <article key={row.id} className={`lead-row lead-row--${row.status}`}>
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
    </div>}

    <h3 className="inbox__feed-title">Activity{category ? ` · ${data?.pending.find((item) => item.category === category)?.label ?? category}` : ""}</h3>
    <ol className="inbox__feed">{shown.map((item) => <li key={item.id} className={new Date(item.createdAt).getTime() > seenAt ? "is-new" : undefined}>
      <span className="inbox__icon" aria-hidden="true">{ICON[item.kind] ?? "•"}</span>
      <div><b>{item.title}</b>{item.detail && <small>{item.detail}</small>}</div>
      <time dateTime={item.createdAt}>{item.kind === "record_view" ? <Eye size={12}/> : item.actor ? <UserRound size={12}/> : null} {ago(item.createdAt)}</time>
    </li>)}</ol>
    {items.length > 0 && <div className="inbox__pager">
      <label>Show <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }}>
        {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
      </select> per page</label>
      <span>{current * pageSize + 1}–{Math.min(items.length, (current + 1) * pageSize)} of {items.length}</span>
      <button type="button" className="btn btn--ghost btn--sm" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</button>
      <button type="button" className="btn btn--ghost btn--sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next</button>
    </div>}
    {data && !items.length && <p className="admin-empty">Nothing yet. New requests, call-back requests and staff actions appear here.</p>}
  </section>;
}
