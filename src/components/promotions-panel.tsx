"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, FileSpreadsheet, Gift, Lock, LockOpen, RefreshCw, Search, TicketPercent, TriangleAlert } from "lucide-react";
import { todayIst } from "@/lib/festivals";
import { secureApi } from "@/lib/secure-api-client";
import type { PromoView } from "@/lib/promo-view";

type Promotion = PromoView & { id: string; active: boolean; locked: boolean; source: string | null; uses: number };
type Listing = { promotions: Promotion[]; welcome: { issued: number; used: number } };
type SyncReport = { feed: { ok: boolean; events: number; matched: number }; promos: number; created: number; updated: number; unchanged: number; conflicts: string[] };
type View = "live" | "upcoming" | "all";

const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/**
 * Admin → Promotions: every festival, Team India and hand-made code with its dates and uses.
 * Switch a code off, correct tentative dates (locks the row against the daily sync) or run the
 * Google holiday sync now.
 */
export default function PromotionsPanel({ canEdit }: { canEdit: boolean }) {
  const [data, setData] = useState<Listing | null>(null);
  const [view, setView] = useState<View>("live");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<{ id: string; startsOn: string; endsOn: string; eventStarts: string; eventEnds: string } | null>(null);
  const today = todayIst();

  async function load() {
    try { setData(await secureApi<Listing>("U4n8K2rP6wD1")); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load promotions."); }
  }
  useEffect(() => {
    let active = true;
    secureApi<Listing>("U4n8K2rP6wD1").then((result) => { if (active) setData(result); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load promotions."); });
    return () => { active = false; };
  }, []);

  const rows = useMemo(() => (data?.promotions ?? []).filter((row) => {
    if (view === "live" && !(row.startsOn <= today && today <= row.endsOn)) return false;
    if (view === "upcoming" && row.startsOn <= today) return false;
    const words = q.trim().toLowerCase();
    return !words || `${row.code} ${row.names.en} ${row.communities.join(" ")}`.toLowerCase().includes(words);
  }), [data, view, q, today]);

  async function patch(id: string, body: Record<string, unknown>, message: string) {
    setBusy(id); setError(""); setNotice("");
    try { await secureApi("M7x3Q9vB2kF5", { id, ...body }); setNotice(message); setEditing(null); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save."); }
    finally { setBusy(null); }
  }

  async function sync() {
    setBusy("sync"); setError(""); setNotice("");
    try {
      const report = await secureApi<SyncReport>("Z9p4L6tH1cN8");
      setNotice(`Sync done: ${report.created} new, ${report.updated} updated, ${report.unchanged} unchanged. Google holiday feed ${report.feed.ok ? `read (${report.feed.matched} festival dates matched)` : "not reachable, so the checked dates were used"}.${report.conflicts.length ? ` Skipped (code already used by another coupon): ${report.conflicts.join(", ")}.` : ""}`);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Sync failed."); }
    finally { setBusy(null); }
  }

  const liveCount = (data?.promotions ?? []).filter((row) => row.active && row.startsOn <= today && today <= row.endsOn).length;
  return <section className="admin-queue promo-admin" id="promotions">
    <h2><TicketPercent size={17}/> Promotions <span>{data?.promotions.length ?? "…"}</span></h2>
    <div className="promo-admin__stats">
      <div><b>{liveCount}</b><small>codes live today</small></div>
      <div><b>{data?.welcome.issued ?? "…"}</b><small>welcome coupons issued</small></div>
      <div><b>{data?.welcome.used ?? "…"}</b><small>welcome coupons used</small></div>
    </div>
    <div className="promo-admin__bar">
      <div className="seg">{(["live", "upcoming", "all"] as View[]).map((id) => <button key={id} type="button" className={view === id ? "is-active" : undefined} aria-pressed={view === id} onClick={() => setView(id)}>{id === "live" ? "Live" : id === "upcoming" ? "Upcoming" : "All"}</button>)}</div>
      <label className="input-wrap"><Search size={16}/><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search code or festival" aria-label="Search promotions"/></label>
      {canEdit && <button type="button" className="btn btn--primary btn--sm" onClick={() => void sync()} disabled={busy === "sync"}><RefreshCw size={15} className={busy === "sync" ? "spin" : undefined}/>{busy === "sync" ? "Syncing…" : "Sync with Google calendar"}</button>}
      <a className="btn btn--ghost btn--sm" href="/offers/offers.csv?download=1"><FileSpreadsheet size={15}/>CSV</a>
      <a className="btn btn--ghost btn--sm" href="/offers/calendar.ics?download=1"><CalendarPlus size={15}/>.ics</a>
    </div>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    {notice && <div className="alert alert--success" role="status">{notice}</div>}
    {!data && !error && <p>Loading promotions…</p>}
    {data && !rows.length && <p className="admin-empty">No promotions in this view.</p>}
    <div className="promo-admin__list">{rows.map((row) => {
      const live = row.startsOn <= today && today <= row.endsOn;
      const isEditing = editing?.id === row.id;
      return <article key={row.id} className={`promo-row theme-${row.theme}${row.active ? "" : " is-off"}`}>
        <span className="promo-row__emoji" aria-hidden="true">{row.emoji}</span>
        <div className="promo-row__main">
          <b>{row.code} <small>· {row.names.en}</small></b>
          <small>{row.kind} · valid {day(row.startsOn)} – {day(row.endsOn)}{row.eventStarts ? ` · event ${day(row.eventStarts)}${row.eventEnds && row.eventEnds !== row.eventStarts ? ` – ${day(row.eventEnds)}` : ""}` : ""} · ₹{row.discount} off on ₹{row.minimum}+ · used {row.uses}×</small>
          <span className="promo-row__tags">
            {live && row.active && <span className="status-pill status-pill--done">Live</span>}
            {!row.active && <span className="status-pill">Off</span>}
            {row.tentative && <span className="status-pill status-pill--warn"><TriangleAlert size={12}/> Dates TBC</span>}
            {row.locked && <span className="status-pill"><Lock size={12}/> Edited</span>}
            {row.source === "google" && <span className="status-pill">Google date</span>}
          </span>
          {isEditing && editing && <div className="promo-row__edit">
            <label>Code from<input type="date" value={editing.startsOn} onChange={(event) => setEditing({ ...editing, startsOn: event.target.value })}/></label>
            <label>Code until<input type="date" value={editing.endsOn} onChange={(event) => setEditing({ ...editing, endsOn: event.target.value })}/></label>
            <label>Event starts<input type="date" value={editing.eventStarts} onChange={(event) => setEditing({ ...editing, eventStarts: event.target.value })}/></label>
            <label>Event ends<input type="date" value={editing.eventEnds} onChange={(event) => setEditing({ ...editing, eventEnds: event.target.value })}/></label>
            <button type="button" className="btn btn--primary btn--sm" disabled={busy === row.id} onClick={() => void patch(row.id, { startsOn: editing.startsOn, endsOn: editing.endsOn, ...(editing.eventStarts ? { eventStarts: editing.eventStarts } : {}), ...(editing.eventEnds ? { eventEnds: editing.eventEnds } : {}) }, `${row.code} dates saved.`)}>Save dates</button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(null)}>Cancel</button>
          </div>}
        </div>
        {canEdit && <div className="promo-row__actions">
          <label className="switch" title={row.active ? "Switch off" : "Switch on"}><input type="checkbox" checked={row.active} disabled={busy === row.id} onChange={(event) => void patch(row.id, { active: event.target.checked }, `${row.code} switched ${event.target.checked ? "on" : "off"}.`)}/><span aria-hidden="true"/><span className="sr-only">{row.code} active</span></label>
          {!isEditing && row.eventKey && <button type="button" className="profile-text-button" onClick={() => setEditing({ id: row.id, startsOn: row.startsOn, endsOn: row.endsOn, eventStarts: row.eventStarts ?? "", eventEnds: row.eventEnds ?? "" })}>Edit dates</button>}
          {row.locked && <button type="button" className="profile-text-button" onClick={() => void patch(row.id, { unlock: true }, `${row.code} will follow the daily sync again.`)}><LockOpen size={13}/> Let sync manage</button>}
        </div>}
      </article>;
    })}</div>
    <p className="admin-note"><Gift size={13}/> Codes are created daily up to December 2028 from Google’s Indian holiday calendar and the Team India fixtures list. Switching a code off takes effect immediately at checkout.</p>
  </section>;
}
