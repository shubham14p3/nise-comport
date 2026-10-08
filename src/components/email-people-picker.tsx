"use client";

import { useEffect, useState } from "react";
import { CAMPAIGN_SERVICES, serviceTitle } from "@/lib/campaign-text";
import { secureApi } from "@/lib/secure-api-client";

type Person = { id: string; name: string; email: string; consent: string; consentAskedAt: string | null };
type Listing = { people: Person[]; matching: number; page: number };
const CONSENT_LABEL: Record<string, string> = { opted_in: "Said YES", unknown: "Not asked yet", opted_out: "Said NO" };
const PAGE = 100;
/** The server asks at most this many people at a time, so a request finishes in time. */
const ASK_LIMIT = 40;

/**
 * Picks people for a campaign from every contact with an email address. Filter by category and
 * answer, search, then tick them or select everyone shown. Campaigns still go only to people who said YES.
 */
export default function EmailPeoplePicker({ picked, onChange, onAsked }: { picked: string[]; onChange: (ids: string[]) => void; onAsked: () => void }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [service, setService] = useState("");
  const [page, setPage] = useState(0);
  const [version, setVersion] = useState(0);
  const [data, setData] = useState<Listing | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    secureApi<Listing>("Em4ilPeop1eQ", { q, filter, service, page })
      .then((value) => { if (active) { setData(value); setError(""); } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load people."); });
    return () => { active = false; };
  }, [q, filter, service, page, version]);

  const shown = data?.people ?? [];

  function toggle(id: string) {
    onChange(picked.includes(id) ? picked.filter((item) => item !== id) : [...picked, id]);
  }

  function selectShown() {
    onChange([...new Set([...picked, ...shown.map((person) => person.id)])]);
  }

  async function askYes() {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await secureApi<{ sent: number; skipped: number; failed: number }>("Em4ilAsk3Cn9", { ids: picked.slice(0, ASK_LIMIT) });
      setNotice(`Asked ${result.sent} people by email. ${result.skipped} skipped (already answered, or asked in the last 30 days).${result.failed ? ` ${result.failed} failed.` : ""}${picked.length > ASK_LIMIT ? ` Only the first ${ASK_LIMIT} were asked; ask again for the rest.` : ""}`);
      setVersion((value) => value + 1);
      onAsked();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send the emails."); }
    finally { setBusy(false); }
  }

  return <section className="email-picker" aria-label="Pick people">
    <h4>Pick people</h4>
    <p className="field__hint">Everyone with an email address. Campaigns still go only to people who said YES.</p>
    <div className="email-picker__filters">
      <input type="search" placeholder="Search name or email" value={q} onChange={(event) => { setQ(event.target.value); setPage(0); }}/>
      <select value={service} aria-label="Category" onChange={(event) => { setService(event.target.value); setPage(0); }}>
        <option value="">All categories</option>
        {CAMPAIGN_SERVICES.map((key) => <option key={key} value={key}>{serviceTitle(key)}</option>)}
      </select>
      <select value={filter} aria-label="Answer" onChange={(event) => { setFilter(event.target.value); setPage(0); }}>
        <option value="">Any answer</option>
        <option value="opted_in">Said YES</option>
        <option value="unknown">Not asked yet</option>
        <option value="opted_out">Said NO</option>
      </select>
    </div>
    <div className="email-picker__bar">
      <span>{picked.length} picked</span>
      <button type="button" className="profile-text-button" onClick={selectShown} disabled={!shown.length}>Select all shown ({shown.length})</button>
      <button type="button" className="profile-text-button" onClick={() => onChange([])} disabled={!picked.length}>Clear</button>
      <button type="button" className="btn btn--ghost btn--sm" disabled={busy || !picked.length} onClick={() => void askYes()}>{busy ? "Sending…" : "Ask for YES by email"}</button>
    </div>
    {error ? <div className="alert alert--error" role="alert">{error}</div> : null}
    {notice ? <div className="alert alert--success" role="status">{notice}</div> : null}
    <ul className="email-picker__list">
      {shown.map((person) => <li key={person.id} className="email-picker__row">
        <input type="checkbox" checked={picked.includes(person.id)} onChange={() => toggle(person.id)} aria-label={`Pick ${person.name}`}/>
        <span><b>{person.name}</b><small>{person.email}</small></span>
        <span className="status-pill">{CONSENT_LABEL[person.consent] ?? person.consent}</span>
      </li>)}
    </ul>
    {data && !shown.length ? <p className="admin-empty">Nobody matches.</p> : null}
    <div className="email-picker__pager">
      <button type="button" className="btn btn--ghost btn--sm" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>Previous</button>
      <span>{data ? `${data.matching.toLocaleString("en-IN")} people` : ""}</span>
      <button type="button" className="btn btn--ghost btn--sm" disabled={(page + 1) * PAGE >= (data?.matching ?? 0)} onClick={() => setPage((value) => value + 1)}>Next</button>
    </div>
  </section>;
}
