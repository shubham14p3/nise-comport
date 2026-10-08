"use client";

import { useEffect, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";
import { RECORD_STATUSES } from "@/lib/record-status";

type YearRow = { year: number | null; total: number };
export type RecordRow = { id: string; key: string; name: string; source: string; recordDate: string | null; renewalOn: string | null; status: string; mobile: string | null; panMasked: string | null; hasPan: boolean };
type Page = { records: RecordRow[]; hasMore: boolean; page: number; loading: boolean };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const day = (value: string | null) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "No date";
const yearKey = (year: number | null) => (year === null ? "undated" : String(year));

/**
 * One service at a time: filters (like Excel column filters) on top, then accordions
 * year → month → records, newest first. Filters run on the server, over the whole service.
 */
export default function RecordsServiceBrowser({ service, label, onOpen, initialStatus = "" }: { service: string; label: string; onOpen: (key: string) => void; initialStatus?: string }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [years, setYears] = useState<YearRow[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [pages, setPages] = useState<Record<string, Page>>({});
  const filters = { q: q.trim(), status, from, to };

  // Reload the year counts whenever the service or a filter changes (typing waits a moment).
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setYears(null); setOpen({}); setPages({}); setError("");
      secureApi<{ years: YearRow[] }>("W8r2T5yN1cF6", { view: "years", service, ...filters })
        .then((value) => { if (active) setYears(value.years); })
        .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load this service."); });
    }, q ? 300 : 0);
    return () => { active = false; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, q, status, from, to]);

  async function loadPage(year: number | null, page: number) {
    const key = yearKey(year);
    setPages((current) => ({ ...current, [key]: { records: current[key]?.records ?? [], hasMore: current[key]?.hasMore ?? false, page, loading: true } }));
    try {
      const result = await secureApi<{ records: RecordRow[]; hasMore: boolean }>("W8r2T5yN1cF6", {
        view: "records", service, ...filters, year: year === null ? undefined : String(year), undated: year === null ? true : undefined, page,
      });
      setPages((current) => ({ ...current, [key]: { records: page === 0 ? result.records : [...(current[key]?.records ?? []), ...result.records], hasMore: result.hasMore, page, loading: false } }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load these records.");
      setPages((current) => ({ ...current, [key]: { ...(current[key] ?? { records: [], hasMore: false, page }), loading: false } }));
    }
  }

  function toggleYear(year: number | null) {
    const key = yearKey(year);
    const willOpen = !open[key];
    setOpen((current) => ({ ...current, [key]: willOpen }));
    if (willOpen && !pages[key]) void loadPage(year, 0);
  }

  const byMonth = (records: RecordRow[]) => {
    const groups = new Map<string, RecordRow[]>();
    for (const record of records) {
      const key = record.recordDate ? record.recordDate.slice(0, 7) : "undated";
      groups.set(key, [...(groups.get(key) ?? []), record]);
    }
    return [...groups.entries()].sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0));
  };

  const total = (years ?? []).reduce((sum, row) => sum + row.total, 0);
  const filtered = Boolean(filters.q || filters.status || filters.from || filters.to);

  return <div className="svc-browser">
    <div className="svc-filters" role="search">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, mobile, last 4 digits, PAN or Aadhaar" aria-label="Filter by name, mobile or PAN"/>
      <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
        <option value="">Any status</option>
        {Object.entries(RECORD_STATUSES).map(([key, text]) => <option key={key} value={key}>{text}</option>)}
      </select>
      <label>From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}/></label>
      <label>To <input type="date" value={to} onChange={(e) => setTo(e.target.value)}/></label>
      {filtered ? <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setQ(""); setStatus(""); setFrom(""); setTo(""); }}>Clear filters</button> : null}
    </div>
    {error ? <div className="alert alert--error" role="alert">{error}</div> : null}
    {!years && !error ? <p className="admin-empty">Loading {label}…</p> : null}
    {years && !years.length ? <p className="admin-empty">{filtered ? "Nothing matches these filters." : `No ${label} records yet.`}</p> : null}
    {years && years.length ? <p className="svc-browser__total"><b>{total.toLocaleString("en-IN")}</b> {label} records{filtered ? " match" : ""} · newest first</p> : null}
    {years?.map((row) => {
      const key = yearKey(row.year);
      const page = pages[key];
      const isOpen = Boolean(open[key]);
      return <details key={key} className="svc-year" open={isOpen}>
        <summary onClick={(event) => { event.preventDefault(); toggleYear(row.year); }}>
          <span>{row.year ?? "No date"}</span><small>{row.total.toLocaleString("en-IN")} record{row.total === 1 ? "" : "s"}</small>
        </summary>
        {isOpen && <div className="svc-year__body">
          {!page || (page.loading && !page.records.length) ? <p className="field__hint">Loading…</p> : null}
          {byMonth(page?.records ?? []).map(([month, records]) => <details key={month} className="svc-month" open>
            <summary><span>{month === "undated" ? "No date" : `${MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`}</span><small>{records.length} shown</small></summary>
            <ul className="svc-rows">
              {records.map((record) => <li key={record.id}>
                <button type="button" className="svc-row" onClick={() => onOpen(record.key)}>
                  <b>{record.name}</b>
                  <span className={`svc-status svc-status--${record.status}`}>{RECORD_STATUSES[record.status] ?? record.status}</span>
                  <span>{record.mobile ?? "No mobile"}</span>
                  {record.hasPan ? <span className="svc-row__pan">{record.panMasked}</span> : null}
                  <small>{day(record.recordDate)}{record.renewalOn ? ` · renews ${day(record.renewalOn)}` : ""}</small>
                </button>
              </li>)}
            </ul>
          </details>)}
          {page?.hasMore ? <button type="button" className="btn btn--ghost btn--sm" disabled={page.loading} onClick={() => void loadPage(row.year, page.page + 1)}>{page.loading ? "Loading…" : "Load more"}</button> : null}
        </div>}
      </details>;
    })}
  </div>;
}
