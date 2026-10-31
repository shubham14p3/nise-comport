"use client";

import dynamic from "next/dynamic";
const ClaimsPanel = dynamic(() => import("@/components/claims-panel"), { loading: () => <p className="admin-loading">Loading claims…</p> });
import { useEffect, useRef, useState } from "react";
import { Bell, Check, Eye, Phone, RefreshCw, UserRound, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { createLatestRequest } from "@/lib/latest-request";
import { secureApi } from "@/lib/secure-api-client";

type Item = { id: string; kind: string; category: string | null; title: string; detail: string | null; createdAt: string; actor: string | null };
type Lead = { id: string; name: string; phone: string; topic: string; message: string | null; status: string; handledBy: string | null; ownerName?: string | null; source: string; details: { email?: string; serviceSlug?: string } | null; page: string | null; createdAt: string };
type CallbackTab = "open" | "called" | "closed" | "spam";
type Callbacks = { rows: Lead[]; total: number; tabCounts: Record<CallbackTab, number>; tab: CallbackTab; mine: boolean; page: number; pageSize: number };
type Summary = { unread: number; waiting: number; callbacks: number };
type Inbox = { summary: Summary; items: Item[]; unread: number; seenAt: string; pending: { category: string; label: string; total: number }[]; callbacks: Callbacks | null };
/** What the callbacks list and the activity filter are showing. Every change reloads the inbox from the server. */
type View = { category: string; tab: CallbackTab; scope: "all" | "mine"; page: number };

const TABS: { id: CallbackTab; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "called", label: "Called" },
  { id: "closed", label: "Closed" },
  { id: "spam", label: "Spam" },
];
const ICON: Record<string, string> = { lead: "📞", request: "📝", print: "🖨️", status: "🔄", import: "📥", record_view: "👁️", claim: "🔑", flag: "🚩", signup: "🆕", staff: "👥", campaign: "📣", promotion: "🎟️" };
const ago = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)} h ago`;
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
};
const FEED_PAGE_SIZE = 15;

/** "Showing 1–15 of 52" with Previous / Next. Hidden when everything fits on one page. */
function Pager({ page, total, pageSize, onPage, label }: { page: number; total: number; pageSize: number; onPage: (next: number) => void; label: string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = page * pageSize + 1; const to = Math.min(total, (page + 1) * pageSize);
  return <nav className="inbox__pager" aria-label={label}>
    <button type="button" className="btn btn--ghost btn--sm" disabled={page <= 0} onClick={() => onPage(page - 1)}>Previous</button>
    <span>Showing {from}–{to} of {total} · page {page + 1} of {pages}</span>
    <button type="button" className="btn btn--ghost btn--sm" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>Next</button>
  </nav>;
}
const pretty = (phone: string) => phone.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");

async function loadInbox(view: View) {
  return secureApi<Inbox>("I5x2N8kQ3wT6", { category: view.category, leadTab: view.tab, leadScope: view.scope, leadPage: String(view.page) });
}

/**
 * Admin → Inbox: callbacks split into Open / Called / Closed / Spam tabs (paged on the server),
 * what's waiting per service, and a feed of what happened.
 */
export default function InboxPanel({ onSeen, onSummary, viewer }: { onSeen?: () => void; onSummary?: (summary: Summary) => void; viewer?: {id?:string;role:string} }) {
  const listRequest = useRef(createLatestRequest());
  const [data, setData] = useState<Inbox | null>(null);
  const [view, setView] = useState<View>({ category: "", tab: "open", scope: "all", page: 0 });
  const viewRef = useRef(view);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [feedPage, setFeedPage] = useState(0);

  async function fetchInbox(next: View = viewRef.current) {
    const current = listRequest.current.begin();
    try {
      let result = await loadInbox(next);
      if (!current()) return;
      // If the current page emptied (for example the last callback moved to another tab), step back to the last page that has rows.
      const cb = result.callbacks;
      if (cb && cb.rows.length === 0 && cb.total > 0 && next.page > 0) {
        next = { ...next, page: Math.ceil(cb.total / cb.pageSize) - 1 };
        viewRef.current = next; setView(next);
        result = await loadInbox(next);
        if (!current()) return;
      }
      setData(result); onSummary?.(result.summary); setError("");
    }
    catch (reason) { if (current()) setError(reason instanceof Error ? reason.message : "Could not load the inbox."); }
  }

  /** Changes what is shown (tab, scope, service filter or page) and loads it. */
  function changeView(patch: Partial<View>) {
    const next = { ...viewRef.current, ...patch };
    viewRef.current = next; setView(next);
    void fetchInbox(next);
  }

  useEffect(() => {
    const gate = listRequest.current;
    const refresh = () => {
      const current = gate.begin();
      return loadInbox(viewRef.current)
        .then((result) => { if (current()) { setData(result); onSummary?.(result.summary); setError(""); } })
        .catch((reason) => { if (current()) setError(reason instanceof Error ? reason.message : "Could not load the inbox."); });
    };
    void refresh();
    // Opening the inbox marks what's here as seen (after a moment, so the highlights are visible).
    const seen = window.setTimeout(() => { void secureApi("O9c4V7mB2pL5").then(() => onSeen?.()).catch(() => undefined); }, 4000);
    const poll = () => { if (document.visibilityState === "visible") void refresh(); };
    const timer = window.setInterval(poll, 60_000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      gate.invalidate();
      window.clearTimeout(seen);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [onSeen, onSummary]);

  async function takeCase(row:Lead){
    setBusy(row.id);setError("");
    try{await secureApi("U6c2R9pL5wM7",{id:row.id,action:"claim"});await fetchInbox();}
    catch(reason){setError(reason instanceof Error?reason.message:"Could not take the case.");}
    finally{setBusy("")}
  }

  async function lead(row: Lead, status: "new" | "called" | "done" | "spam" | "offline_closed" | "online_invited") {
    setBusy(row.id);
    try { await secureApi("E3h8K1tW6qZ9", { id: row.id, status }); await fetchInbox(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update."); }
    finally { setBusy(""); }
  }

  const seenAt = data ? new Date(data.seenAt).getTime() : 0;
  const items = data?.items ?? [];
  const cb = data?.callbacks ?? null;
  const actionable = view.tab === "open" || view.tab === "called";
  const feedAt = Math.min(feedPage, Math.max(0, Math.ceil(items.length / FEED_PAGE_SIZE) - 1));
  return <section className="admin-queue inbox">
    <h2><Bell size={17}/> Inbox {data?.unread ? <span className="inbox__unread">{data.unread} new</span> : null}
      <button type="button" className="btn btn--ghost btn--sm inbox__refresh" onClick={() => void fetchInbox()}><RefreshCw size={14}/>Refresh</button></h2>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    <ClaimsPanel onChange={onSeen}/>

    {data && data.pending.length > 0 && <div className="inbox__pending">
      {data.pending.map((item) => <button key={item.category} type="button" className={view.category === item.category ? "is-active" : undefined} onClick={() => { const next = view.category === item.category ? "" : item.category; setFeedPage(0); changeView({ category: next, page: 0 }); }}>
        <b>{item.total}</b><span>{item.label}</span><small>waiting</small>
      </button>)}
    </div>}

    {cb && <div className="inbox__leads">
      <h3><Phone size={16}/> Callbacks <span>{cb.total}</span></h3>
      <div className="inbox__callback-tabs" role="tablist" aria-label="Callback status">
        {TABS.map((tab) => <button key={tab.id} className="btn btn--ghost btn--sm" type="button" role="tab" aria-selected={view.tab === tab.id} onClick={() => changeView({ tab: tab.id, page: 0 })}>
          {tab.label} <b>{cb.tabCounts[tab.id]}</b>
        </button>)}
        <span className="inbox__scope">
          <button className="btn btn--ghost btn--sm" type="button" aria-pressed={view.scope === "all"} onClick={() => changeView({ scope: "all", page: 0 })}>All</button>
          <button className="btn btn--ghost btn--sm" type="button" aria-pressed={view.scope === "mine"} onClick={() => changeView({ scope: "mine", page: 0 })}>Mine</button>
        </span>
      </div>
      {cb.rows.length === 0 && <p className="admin-empty">No callbacks here{view.scope === "mine" ? " assigned to you" : ""}.</p>}
      {cb.rows.map((row) => <article key={row.id} className={`lead-row lead-row--${row.status}`}>
        <div><b>{row.name}</b> <a href={`tel:${row.phone}`}>{pretty(row.phone)}</a>
          <small>{row.topic}{row.message && !row.message.includes("\n") ? ` — ${row.message}` : ""} · {ago(row.createdAt)}{row.status === "called" ? " · contacted" : row.status === "online_invited" ? " · online form sent" : row.status === "offline_closed" ? " · closed offline" : row.status === "done" ? " · done" : ""}</small>
          {row.source==="service-callback" && <small><b>Callback enquiry</b> · {row.details?.email && <a href={`mailto:${row.details.email}`}>{row.details.email}</a>} · <strong>{row.ownerName ? `Handled by ${row.ownerName}` : "Unassigned"}</strong></small>}
          {row.message?.includes("\n") && <p className="lead-row__details">{row.message}</p>}</div>
        <div className="lead-row__actions">
          <a className="btn btn--ghost btn--sm" href={`tel:${row.phone}`}><Phone size={14}/>Call</a>
          <a className="btn btn--ghost btn--sm" href={`https://wa.me/${row.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Namaste ${row.name}, NISE COMPORT here about your enquiry: ${row.topic}.`)}`} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={14}/>WhatsApp</a>
          {actionable && row.source==="service-callback" && (!row.handledBy || (viewer?.role==="admin" && row.handledBy!==viewer.id)) && <button type="button" className="btn btn--primary btn--sm" disabled={busy===row.id} onClick={()=>void takeCase(row)}>{row.handledBy?"Take over":"Take case"}</button>}
          {actionable && row.status === "new" && (row.source!=="service-callback" || row.handledBy===viewer?.id || viewer?.role==="admin") && <button type="button" className="profile-text-button" disabled={busy === row.id} onClick={() => void lead(row, "called")}><Check size={13}/>Called</button>}
          {actionable && (row.source==="service-callback" ? (row.handledBy===viewer?.id || viewer?.role==="admin" ? <>
            {row.status!=="online_invited" && <button type="button" className="btn btn--primary btn--sm" disabled={busy === row.id} onClick={() => {if(window.confirm("Has this customer agreed to continue online? Send the application link to their provided email?"))void lead(row,"online_invited");}}><Check size={13}/>Send online form</button>}
            <button type="button" className="profile-text-button" disabled={busy === row.id} onClick={() => void lead(row,"offline_closed")}>Close offline</button>
          </> : null) : <button type="button" className="profile-text-button" disabled={busy === row.id} onClick={() => void lead(row, "done")}><Check size={13}/>Done</button>)}
          {actionable && (row.source!=="service-callback" || row.handledBy===viewer?.id || viewer?.role==="admin") && <button type="button" className="profile-text-button" disabled={busy === row.id} onClick={() => void lead(row, "spam")}><X size={13}/>Spam</button>}
          {view.tab === "spam" && (row.source!=="service-callback" || row.handledBy===viewer?.id || viewer?.role==="admin") && <button type="button" className="profile-text-button" disabled={busy === row.id} onClick={() => void lead(row, "new")}><Check size={13}/>Restore to open</button>}
        </div>
      </article>)}
      <Pager page={cb.page} total={cb.total} pageSize={cb.pageSize} onPage={(next) => changeView({ page: next })} label="Callback pages"/>
    </div>}

    <h3 className="inbox__feed-title">Activity{view.category ? ` · ${data?.pending.find((item) => item.category === view.category)?.label ?? view.category}` : ""}</h3>
    <ol className="inbox__feed">{items.slice(feedAt * FEED_PAGE_SIZE, (feedAt + 1) * FEED_PAGE_SIZE).map((item) => <li key={item.id} className={new Date(item.createdAt).getTime() > seenAt ? "is-new" : undefined}>
      <span className="inbox__icon" aria-hidden="true">{ICON[item.kind] ?? "•"}</span>
      <div><b>{item.title}</b>{item.detail && <small>{item.detail}</small>}</div>
      <time dateTime={item.createdAt}>{item.kind === "record_view" ? <Eye size={12}/> : item.actor ? <UserRound size={12}/> : null} {ago(item.createdAt)}</time>
    </li>)}</ol>
    <Pager page={feedAt} total={items.length} pageSize={FEED_PAGE_SIZE} onPage={setFeedPage} label="Activity pages"/>
    {data && !data.items.length && <p className="admin-empty">Nothing yet. New requests, call-back requests and staff actions appear here.</p>}
  </section>;
}
