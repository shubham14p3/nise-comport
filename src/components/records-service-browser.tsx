"use client";

import { useEffect, useMemo, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";

type YearRow = { year: number | null; total: number };
type RecordRow = { id: string; key: string; name: string; source: string; recordDate: string | null; renewalOn: string | null; mobile: string | null; panMasked: string | null; hasPan: boolean };
type Page = { records: RecordRow[]; hasMore: boolean; page: number; loading: boolean };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const day = (value: string | null) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "No date";
const monthOf = (value: string | null) => value ? MONTHS[Number(value.slice(5, 7)) - 1] ?? "Unknown" : "No date";
const yearKey = (year: number | null) => (year === null ? "undated" : String(year));

/**
 * One service at a time, as accordions: year → month → records, newest first.
 * A year's records load only when it is opened, so big services stay fast on a phone.
 */
export default function RecordsServiceBrowser({ service, label, onOpen }: { service: string; label: string; onOpen: (key: string) => void }) {
  const [years, setYears] = useState<YearRow[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [pages, setPages] = useState<Record<string, Page>>({});

  useEffect(() => {
    let active = true;
    setYears(null); setOpen({}); setPages({}); setError("");
    secureApi<{ years: YearRow[] }>("W8r2T5yN1cF6", { view: "years", service })
      .then((value) => { if (active) setYears(value.years); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load this service."); });
    return () => { active = false; };
  }, [service]);

  async function loadPage(year: number | null, page: number) {
    const key = yearKey(year);
    setPages((current) => ({ ...current, [key]: { records: current[key]?.records ?? [], hasMore: current[key]?.hasMore ?? false, page, loading: true } }));
    try {
      const result = await secureApi<{ records: RecordRow[]; hasMore: boolean }>("W8r2T5yN1cF6", {
        view: "records", service, year: year === null ? undefined : String(year), undated: year === null ? true : undefined, page,
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

  // Newest month first, records inside each month newest first.
  const byMonth = (records: RecordRow[]) => {
    const groups = new Map<string, RecordRow[]>();
    for (const record of records) {
      const key = record.recordDate ? record.recordDate.slice(0, 7) : "undated";
      groups.set(key, [...(groups.get(key) ?? []), record]);
    }
    return [...groups.entries()].sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0));
  };

  const total = useMemo(() => (years ?? []).reduce((sum, row) => sum + row.total, 0), [years]);

  if (error) return <div className="alert alert--error" role="alert">{error}</div>;
  if (!years) return <p className="admin-empty">Loading {label}…</p>;
  if (!years.length) return <p className="admin-empty">No {label} records yet.</p>;

  return <div className="svc-browser">
    <p className="svc-browser__total"><b>{total.toLocaleString("en-IN")}</b> {label} records · newest first</p>
    {years.map((row) => {
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
                  <span>{record.mobile ?? "No mobile"}</span>
                  {record.hasPan ? <span className="svc-row__pan">{record.panMasked}</span> : null}
                  <small>{day(record.recordDate)}{record.renewalOn ? ` · renews ${day(record.renewalOn)}` : ""} · {monthOf(record.recordDate)}</small>
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
