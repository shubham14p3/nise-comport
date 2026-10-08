"use client";

import { FormEvent, useEffect, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";

type Linked = { id: string; service: string; name: string; recordDate: string | null; renewalOn: string | null; status: string };
const METHODS = [
  { value: "reference", label: "Reference number on a receipt" },
  { value: "pan", label: "My PAN number" },
  { value: "whatsapp", label: "Send a code on WhatsApp" },
  { value: "staff", label: "Ask the centre to check" },
] as const;

/** Customer profile: link the past records made under this name and mobile number. */
export default function LinkRecords() {
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("reference");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<{ status: string; message: string; code?: string | null } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [linked, setLinked] = useState<Linked[] | null>(null);

  async function loadLinked() {
    try { setLinked((await secureApi<{ records: Linked[] }>("Cl4imMine5Rz", {})).records); }
    catch { setLinked([]); }
  }
  useEffect(() => { void loadLinked(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setResult(null);
    try {
      const response = await secureApi<{ status: string; message: string; code?: string | null }>("Cl4imS9ub2Qv", { mobile, name, method, value: method === "reference" || method === "pan" ? value : undefined });
      setResult(response);
      if (response.status === "approved") void loadLinked();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send this request."); }
    finally { setBusy(false); }
  }

  const whatsappHref = result?.code ? `https://wa.me/919771219893?text=${encodeURIComponent(`NISE LINK ${result.code}`)}` : "";

  return <section className="panel link-records" aria-labelledby="link-records-title">
    <h2 id="link-records-title">Link my past records</h2>
    <p>If you came to NISE COMPORT before, your old records may be on file. Enter the mobile number and name used then, and one of the checks below. Records are linked only after the check.</p>
    <form className="link-records__form" onSubmit={submit}>
      <label>Mobile number<input inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile" required/></label>
      <label>Name as it was given then<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Manju Devi" required minLength={2}/></label>
      <label>How should we check?
        <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
          {METHODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      {method === "reference" || method === "pan" ? <label>{method === "pan" ? "PAN number" : "Reference number"}<input value={value} onChange={(e) => setValue(e.target.value)} required/></label> : null}
      <button className="btn btn--primary" disabled={busy}>{busy ? "Sending…" : "Link my records"}</button>
    </form>
    {error ? <p role="alert" className="link-records__error">{error}</p> : null}
    {result ? <div className="link-records__result" role="status">
      <p>{result.message}</p>
      {result.code ? <a className="btn btn--wa" href={whatsappHref} target="_blank" rel="noopener noreferrer">Open WhatsApp and send code {result.code}</a> : null}
    </div> : null}
    {linked && linked.length ? <div className="link-records__list">
      <h3>Linked to your account</h3>
      <ul>{linked.map((row) => <li key={row.id}><b>{row.service.replace(/-/g, " ")}</b> · {row.name} · {row.recordDate ?? "no date"} · {row.status}</li>)}</ul>
    </div> : null}
  </section>;
}
