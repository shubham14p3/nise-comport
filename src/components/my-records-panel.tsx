"use client";

import { Clock, Flag, KeyRound, ShieldCheck } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { RECORD_SERVICES } from "@/lib/record-import";
import { secureApi, secureResult } from "@/lib/secure-api-client";

type Row = { id: string; service: string; name: string; date: string | null; nextRenewal: string | null; vehicle: string | null };
type Data = { status: "none" | "pending" | "approved" | "rejected" | "expired"; expiresAt?: string; codeSent?: boolean; records: Row[]; smsEnabled?: boolean };
const label = (service: string) => RECORD_SERVICES[service] ?? service.replace(/[-_]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const day = (value: string | null) => value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

/** Profile → My records: only after staff or a code approve it. Shows first name and service, never amounts or ID numbers. */
export default function MyRecordsPanel() {
  const [data, setData] = useState<Data | null>(null); const [error, setError] = useState("");
  const [code, setCode] = useState(""); const [busy, setBusy] = useState(false); const [codeError, setCodeError] = useState(""); const [flagged, setFlagged] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try { setData(await secureApi<Data>("R3v8N5pH1wD6")); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Could not load your records."); }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function submitCode(event: FormEvent) {
    event.preventDefault(); setCodeError(""); setBusy(true);
    try {
      const { ok, result } = await secureResult<{ error?: string }>("B9t4L7qM2xF5", { action: "code", code });
      if (!ok) { setCodeError(result.error ?? "That code did not work."); return; }
      setCode(""); await load();
    } finally { setBusy(false); }
  }

  async function notMe(id: string | null) {
    if (!window.confirm(id ? "Tell us this record is not yours?" : "Tell us these records are not yours?")) return;
    const { ok, result } = await secureResult<{ error?: string }>("B9t4L7qM2xF5", { action: "flag", recordId: id });
    if (!ok) { setError(result.error ?? "Could not send that."); return; }
    setFlagged((current) => ({ ...current, [id ?? "all"]: true }));
  }

  if (error) return <div className="panel"><p role="alert" className="form-error">{error}</p></div>;
  if (!data) return <div className="panel"><p className="muted">Loading…</p></div>;

  if (data.status === "none") return <div className="panel"><h2>My records</h2><p>We did not find earlier work under your mobile number. Anything you request on this site will appear in your requests.</p></div>;

  if (data.status !== "approved") return <div className="panel records-wait">
    <h2><Clock size={20}/> We found earlier work under your number</h2>
    {data.status === "pending" && <p>For your privacy we confirm it is you before showing anything. Our team will approve this, usually within a day or two (it stays open until {day(data.expiresAt ?? null)}). You can keep using the site and send new requests meanwhile.</p>}
    {(data.status === "rejected") && <p>We could not confirm these records for this account. If this is a mistake, please message us on WhatsApp.</p>}
    {(data.status === "expired") && <p>The request timed out. Sign in again or message us on WhatsApp and we will check it for you.</p>}
    {data.status === "pending" && <form onSubmit={submitCode} className="records-code">
      <label className="field"><span className="field__label"><KeyRound size={15}/> Got a code from us on WhatsApp?</span>
        <span className="input-wrap"><input inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code"/></span>
        {codeError && <span className="field__error" role="alert">{codeError}</span>}</label>
      <button className="btn btn--primary" disabled={busy || code.length !== 6}>{busy ? "Checking…" : "Show my records"}</button>
    </form>}
  </div>;

  return <div className="panel">
    <h2>My records</h2>
    <p className="muted"><ShieldCheck size={15}/> Only you can see this. We show the first name, service and dates, never amounts or ID numbers. Every time this page is opened it is noted.</p>
    {data.records.length === 0 ? <p>No records right now.</p> : <ul className="records-list">{data.records.map((row) => <li key={row.id} className="records-list__item">
      <div><b>{label(row.service)}</b><span>{row.name}{row.vehicle ? ` · ${row.vehicle}` : ""}</span></div>
      <div className="records-list__dates">{row.date && <small>Done {day(row.date)}</small>}{row.nextRenewal && <small>Next renewal {day(row.nextRenewal)}</small>}</div>
      {flagged[row.id] ? <span className="chip chip--soft">Reported</span> : <button type="button" className="btn btn--ghost btn--sm" onClick={() => void notMe(row.id)}><Flag size={14}/>This isn&rsquo;t me</button>}
    </li>)}</ul>}
    {!flagged.all && data.records.length > 0 && <button type="button" className="link-btn" onClick={() => void notMe(null)}>None of these are mine</button>}
  </div>;
}
