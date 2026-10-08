"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import RecordsServiceBrowser from "@/components/records-service-browser";
import ClaimsQueue from "@/components/claims-queue";
import { RECORD_STATUSES, RECORD_STATUS_KEYS } from "@/lib/record-status";
import { Check, ChevronLeft, ChevronRight, Copy, Database, Eye, Loader2, Phone, Search, Upload, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { secureApi, secureUpload } from "@/lib/secure-api-client";
import { recordsClient } from "@/lib/records-client";
import { useRouter } from "next/navigation";

type Person = { key: string; name: string; mobile: string | null; whatsapp: string | null; altMobiles: string[]; email: string | null; address: string | null; total: number; services: string[]; lastDate: string | null; nextRenewal: string | null; sentCount: number; lastSentAt: string | null; recentSends: string[] };
type SendSummary = { sentCount: number; lastSentAt: string | null; recentSends: string[] };
type Listing = { people: Person[]; totals: { people: number; records: number; repeat: number }; byService: { service: string; total: number }[]; services: Record<string, string> };
type SheetReport = { sheet: string; service: string | null; rows: number; records: number; skipped: number; reason?: string; droppedColumns?: string[] };
type ImportResult = { imported: number; duplicates: number; updated: number; removed: number; removalHeld: number; skipped: number; contactsAdded: number; totalRows: number; sheets: SheetReport[] };
type ImportRow = { id: string; fileName: string; imported: number; duplicates: number; contactsAdded: number; createdAt: string };
type Detail = { name: string; records: { id: string; removedAt: string | null; statusNote: string | null; status: string; service: string; source: string; recordDate: string | null; renewalOn: string | null; mobile: string | null; whatsapp: string | null; altMobiles: string[]; email: string | null; address: string | null; panMasked: string | null; hasPan: boolean; aadhaarMasked: string | null; fields: Record<string, string> }[] };

const day = (iso: string | null) => iso ? new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";
const pretty = (phone: string) => phone.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");
const whenSent = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** Copies text to the clipboard; falls back to select-and-copy on older browsers. Resolves true when it worked. */
async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const area = document.createElement("textarea");
    area.value = text; area.setAttribute("readonly", ""); area.style.position = "fixed"; area.style.opacity = "0";
    document.body.appendChild(area); area.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    area.remove();
    return ok;
  }
}

/** Icon button beside one value. Shows a tick for a moment after copying. */
function CopyButton({ text, label, withText = false }: { text: string; label: string; withText?: boolean }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setDone(false), 1500);
    return () => window.clearTimeout(timer);
  }, [done]);
  const caption = done ? "Copied" : label;
  return <button type="button" className={`copy-icon${withText ? " copy-icon--text" : ""}${done ? " is-copied" : ""}`} aria-label={caption} title={caption} onClick={async () => { if (await copyText(text)) setDone(true); }}>
    {done ? <Check size={14} aria-hidden="true"/> : <Copy size={14} aria-hidden="true"/>}
    {withText ? <span>{caption}</span> : null}
  </button>;
}

/** Plain text of one person's records, for "Copy all". PAN is copied masked unless it was revealed. */
function recordSheetText(name: string, records: Detail["records"], names: Record<string, string>): string {
  const statusText = (key: string) => (RECORD_STATUSES as Record<string, string>)[key] ?? key;
  const blocks = records.map((record) => {
    const lines = [`${names[record.service] ?? record.service}${record.recordDate ? ` · ${day(record.recordDate)}` : ""}`, `Status: ${statusText(record.status)}`];
    if (record.mobile) lines.push(`Mobile: ${pretty(record.mobile)}`);
    if (record.whatsapp) lines.push(`WhatsApp: ${pretty(record.whatsapp)}`);
    if (record.altMobiles?.length) lines.push(`Other mobiles: ${record.altMobiles.map(pretty).join(", ")}`);
    if (record.email) lines.push(`Email: ${record.email}`);
    if (record.address) lines.push(`Address: ${record.address}`);
    if (record.hasPan && record.panMasked) lines.push(`PAN: ${record.panMasked}`);
    if (record.aadhaarMasked) lines.push(`Aadhaar: ${record.aadhaarMasked}`);
    for (const [label, value] of Object.entries(record.fields)) lines.push(`${label}: ${value}`);
    return lines.join("\n");
  });
  return [`${name} (${records.length} record${records.length === 1 ? "" : "s"})`, ...blocks].join("\n\n");
}

/**
 * Admin → Records: import the shop's Excel registers (all sheets) and find customers across them.
 * Data is encrypted in the database; opening a person's records is logged in the inbox.
 */
/** Where this record stands. Saving writes the change to the Inbox. */
function RecordStatus({ recordId, status, comment, onSaved }: { recordId: string; status: string; comment: string | null; onSaved: (status: string, comment: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState(comment ?? "");
  const [saved, setSaved] = useState("");
  async function change(next: string) {
    setBusy(true); setError("");
    try { await recordsClient.setStatus(recordId, next, note.trim()); onSaved(next, note.trim() || null); setSaved(`Saved as ${RECORD_STATUSES[next] ?? next}`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save the status."); }
    finally { setBusy(false); }
  }
  return <div className="record-status">
    <label>Status <select value={status} disabled={busy} onChange={(e) => void change(e.target.value)}>
      {Object.entries(RECORD_STATUSES).map(([key, text]) => <option key={key} value={key}>{text}</option>)}
    </select></label>
    <label className="record-status__note">Comment <input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="Shown to the customer, e.g. documents needed"/></label>
    <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => void change(status)}>Save comment</button>
    {saved ? <small role="status">{saved}</small> : null}
    {error ? <small role="alert">{error}</small> : null}
  </div>;
}

/** Shows the masked PAN. "Show full PAN" emails a code to the signed-in staff member first. */
function RevealPan({ recordId, masked }: { recordId: string; masked: string | null }) {
  const [step, setStep] = useState<"idle" | "code" | "shown">("idle");
  const [code, setCode] = useState("");
  const [pan, setPan] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true); setError("");
    try { const result = await secureApi<{ emailHint: string }>("R4v7Pn2kQ9mX", { recordId }); setHint(result.emailHint); setStep("code"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send the code."); }
    finally { setBusy(false); }
  }
  async function confirm(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { const result = await secureApi<{ pan: string | null }>("R4v7Pn2kQ9mX", { recordId, code }); setPan(result.pan); setStep("shown"); setCode(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Wrong code."); }
    finally { setBusy(false); }
  }

  if (step === "shown") return <span className="pan-shown">{pan ?? "—"}{pan ? <CopyButton text={pan} label="Copy PAN"/> : null}</span>;
  if (step === "code") return <form className="pan-reveal" onSubmit={confirm}>
    <span>Code sent to {hint}</span>
    <input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="6-digit code" aria-label="Code from email"/>
    <button className="btn btn--primary btn--sm" disabled={busy || code.length !== 6}>{busy ? "Checking…" : "Show PAN"}</button>
    {error ? <small role="alert">{error}</small> : null}
  </form>;
  return <span className="pan-reveal">{masked ?? "XXXXX"} <button type="button" className="btn btn--ghost btn--sm" onClick={send} disabled={busy}>{busy ? "Sending…" : "Show full PAN"}</button>{error ? <small role="alert">{error}</small> : null}</span>;
}

export default function RecordsPanel({ service: chosen = "" }: { service?: string }) {
  const [data, setData] = useState<Listing | null>(null);
  const [imports, setImports] = useState<ImportRow[]>([]);
  const [q, setQ] = useState("");
  const [service, setService] = useState(chosen);
  const [sort, setSort] = useState<"repeat" | "recent" | "renewal">("repeat");
  const [page, setPage] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [addContacts, setAddContacts] = useState(true);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const router = useRouter();
  const [switchError, setSwitchError] = useState("");
  const [stages, setStages] = useState<{ service: string; total: number; counts: Record<string, number> } | null>(null);
  const [stage, setStage] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load(next: { q?: string; service?: string; sort?: string; page?: number } = {}) {
    const params = { q, service, sort, page, ...next };
    try { setData(await secureApi<Listing>("W8r2T5yN1cF6", params)); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load records."); }
  }

  // Escape closes the record panel.
  useEffect(() => {
    if (!detail) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setDetail(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail]);

  useEffect(() => {
    let active = true;
    secureApi<Listing>("W8r2T5yN1cF6", { sort: "repeat", page: 0 }).then((value) => { if (active) setData(value); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load records."); });
    secureApi<{ imports: ImportRow[] }>("W8r2T5yN1cF6", { imports: true }).then((value) => { if (active) setImports(value.imports); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  // Counts per stage for the chosen service (the row above its list).
  useEffect(() => {
    if (!service) return;
    let active = true;
    recordsClient.stages<{ total: number; counts: Record<string, number> }>(service)
      .then((value) => { if (active) setStages({ service, ...value }); }).catch(() => undefined);
    return () => { active = false; };
  }, [service]);

  async function upload(event: FormEvent) {
    event.preventDefault(); if (!file) return;
    setBusy("import"); setError(""); setResult(null);
    try {
      const uploaded = await secureUpload<{ file: { id: string } }>("U7b3R8mQ4zL1", file);
      const response = await secureApi<{ import: ImportResult }>("B4j9D6sX2mH7", { fileId: uploaded.file.id, addContacts });
      recordsClient.clearAll();
      setResult(response.import); setFile(null);
      await load({ page: 0 }); setPage(0);
      const history = await secureApi<{ imports: ImportRow[] }>("W8r2T5yN1cF6", { imports: true }); setImports(history.imports);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Import failed."); }
    finally { setBusy(""); }
  }

  /** Opens the WhatsApp chat straight away, then records the send so the list shows it. */
  async function openWhatsApp(person: Person) {
    const number = (person.whatsapp ?? person.mobile ?? "").replace(/\D/g, "");
    if (!number) return;
    window.open(`https://wa.me/${number}`, "_blank", "noopener,noreferrer");
    try {
      const summary = await secureApi<SendSummary>("T7p2Q9rL4xH8", { key: person.key });
      setData((current) => current && { ...current, people: current.people.map((item) => item.key === person.key ? { ...item, ...summary } : item) });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not record the WhatsApp send."); }
  }

  /** Opens the customer's website account. Works only when the number belongs to one account. */
  async function switchTo(phone: string) {
    setSwitchError("");
    try {
      await secureApi("H5w2Zc8nR3vK", { email: phone });
      setDetail(null);
      router.push("/profile");
      router.refresh();
    } catch (reason) {
      setSwitchError(reason instanceof Error ? reason.message : "Could not open that account.");
    }
  }

  async function openPerson(person: Person) {
    setBusy(person.key);
    try { setDetail(await recordsClient.person<Detail>(person.key)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not open the records."); }
    finally { setBusy(""); }
  }

  const names = data?.services ?? {};
  return <section className="admin-queue records">
    <h2><Database size={17}/> Master records {data ? <span>{data.totals.people.toLocaleString("en-IN")}</span> : null}</h2>
    <p className="admin-lead">🔒 Imported registers are encrypted in the database. Portal passwords and user IDs in the sheets are never imported, Aadhaar numbers stay masked, and the uploaded file is deleted after import. Every time someone opens a person’s records it shows in the Inbox.</p>

    <ClaimsQueue/>
    <form className="records-import" onSubmit={upload}>
      <label className="records-import__file"><Upload size={16}/><input type="file" accept=".xlsx,.csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)}/><span>{file?.name ?? "Choose an Excel register (.xlsx), all sheets are read"}</span></label>
      <label className="check"><input type="checkbox" checked={addContacts} onChange={(event) => setAddContacts(event.target.checked)}/> Also add mobile numbers to WhatsApp contacts (as “not asked yet”)</label>
      <button className="btn btn--primary" disabled={!file || busy === "import"}>{busy === "import" ? "Importing… (big files take a minute)" : "Import"}<Upload size={16}/></button>
    </form>
    {result && <div className="alert alert--success" role="status">
      <b>{result.imported.toLocaleString("en-IN")} new records</b> · {result.duplicates.toLocaleString("en-IN")} unchanged · {result.updated.toLocaleString("en-IN")} updated · {result.removed.toLocaleString("en-IN")} no longer in the register{result.removalHeld ? <> · <b>{result.removalHeld.toLocaleString("en-IN")} not marked: the file is much smaller than the register, check it</b></> : null} · {result.contactsAdded.toLocaleString("en-IN")} new WhatsApp contacts
      <table className="records-report"><thead><tr><th>Sheet</th><th>Read as</th><th>Records</th><th>Skipped</th><th>Note</th></tr></thead><tbody>
        {result.sheets.map((sheet) => <tr key={sheet.sheet}><td>{sheet.sheet}</td><td>{sheet.service ? names[sheet.service] ?? sheet.service : "—"}</td><td>{sheet.records}</td><td>{sheet.skipped}</td>
          <td>{sheet.reason ?? (sheet.skipped ? "Rows without a name, or without mobile/PAN/Aadhaar" : "")}{sheet.droppedColumns?.length ? ` Not imported: ${sheet.droppedColumns.join(", ")}.` : ""}</td></tr>)}
      </tbody></table>
    </div>}
    {error && <div className="alert alert--error" role="alert">{error}</div>}

    {data && <div className="promo-admin__stats">
      <div><b>{data.totals.people.toLocaleString("en-IN")}</b><small>people{service || q ? " (filtered)" : ""}</small></div>
      <div><b>{data.totals.records.toLocaleString("en-IN")}</b><small>records</small></div>
      <div><b>{data.totals.repeat.toLocaleString("en-IN")}</b><small>came back more than once</small></div>
    </div>}
    {data && <div className="records-layout"><div className="records-services">
      <button type="button" className={!service ? "is-active" : undefined} onClick={() => { setService(""); setPage(0); void load({ service: "", page: 0 }); }}>All</button>
      {[...data.byService].sort((a, b) => b.total - a.total).map((item) => <button key={item.service} type="button" className={service === item.service ? "is-active" : undefined}
        onClick={() => { setService(item.service); setPage(0); void load({ service: item.service, page: 0 }); }}><span>{names[item.service] ?? item.service}</span><b>{item.total.toLocaleString("en-IN")}</b></button>)}
    </div>
    <div className="records-main">
    {service && stages?.service === service && <div className="stage-row" role="group" aria-label="Filter by stage">
      <button type="button" className={`stage-chip${stage === "" ? " is-on" : ""}`} onClick={() => setStage("")}><b>{stages.total.toLocaleString("en-IN")}</b> All</button>
      {RECORD_STATUS_KEYS.map((key) => <button key={key} type="button" className={`stage-chip stage-chip--${key}${stage === key ? " is-on" : ""}`} onClick={() => setStage(key)}><b>{(stages.counts[key] ?? 0).toLocaleString("en-IN")}</b>{RECORD_STATUSES[key]}</button>)}
    </div>}
    {service && <RecordsServiceBrowser key={`${service}|${stage}`} service={service} initialStatus={stage} label={names[service] ?? service} onOpen={(key) => void openPerson({ key } as Person)}/>}
    {!service && <>
    <form className="promo-admin__bar" role="search" onSubmit={(event) => { event.preventDefault(); setPage(0); void load({ page: 0 }); }}>
      <label className="input-wrap"><Search size={16}/><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name, mobile, WhatsApp, email, PAN, Aadhaar or last 4 digits" aria-label="Search customers"/></label>
      <select value={sort} onChange={(event) => { const next = event.target.value as typeof sort; setSort(next); setPage(0); void load({ sort: next, page: 0 }); }} aria-label="Sort">
        <option value="repeat">Most repeated first</option><option value="recent">Most recent first</option><option value="renewal">Next renewal first</option>
      </select>
      <button className="btn btn--ghost btn--sm">Search</button>
    </form>

    <div className="people-list">{(data?.people ?? []).map((person) => <article key={person.key} className="person-row">
      <div className="person-row__main">
        <span><b>{person.name}</b>{person.total > 1 && <span className="repeat-badge" title="How many times this person appears across your registers">{person.total}×</span>}</span>
        {person.sentCount > 0 && <span className="send-badge" title={`WhatsApp opened ${person.sentCount} time${person.sentCount === 1 ? "" : "s"}\n${person.recentSends.map(whenSent).join("\n")}`}>Sent {person.sentCount}× · last {whenSent(person.lastSentAt ?? "")}</span>}
        <small>{person.mobile ? pretty(person.mobile) : "no mobile"}{person.whatsapp ? ` · WhatsApp ${pretty(person.whatsapp)}` : ""}{person.altMobiles?.length ? ` · also ${person.altMobiles.map(pretty).join(", ")}` : ""} · last {day(person.lastDate)}{person.nextRenewal ? ` · renewal ${day(person.nextRenewal)}` : ""}</small>
        {(person.email || person.address) && <small>{person.email && <a href={`mailto:${person.email}`}>{person.email}</a>}{person.email && person.address ? " · " : ""}{person.address}</small>}
        <span className="contact-row__services">{person.services.map((item) => <em key={item}>{names[item] ?? item}</em>)}</span>
      </div>
      <div className="person-row__actions">
        {person.mobile && <a className="icon-btn" href={`tel:${person.mobile}`} aria-label={`Call ${person.name}`}><Phone size={16}/></a>}
        {(person.whatsapp ?? person.mobile) && <button type="button" className="icon-btn" onClick={() => void openWhatsApp(person)} aria-label={`WhatsApp ${person.name}`}><WhatsAppIcon size={16}/></button>}
        <button type="button" className="btn btn--ghost btn--sm" disabled={busy === person.key} onClick={() => void openPerson(person)}><Eye size={14}/>{busy === person.key ? "Opening…" : "Open"}</button>
      </div>
    </article>)}</div>
    {data && !data.people.length && <p className="admin-empty">{data.totals.records ? "Nobody matches." : "No registers imported yet. Upload your PAN, insurance or certificate Excel files above."}</p>}
    {data && data.totals.people > 50 && <div className="pager">
      <button type="button" className="btn btn--ghost btn--sm" disabled={page === 0} onClick={() => { setPage(page - 1); void load({ page: page - 1 }); }}><ChevronLeft size={15}/>Previous</button>
      <span>Page {page + 1} of {Math.ceil(data.totals.people / 50)}</span>
      <button type="button" className="btn btn--ghost btn--sm" disabled={(page + 1) * 50 >= data.totals.people} onClick={() => { setPage(page + 1); void load({ page: page + 1 }); }}>Next<ChevronRight size={15}/></button>
    </div>}

    {imports.length > 0 && <div className="pan-import-history"><b>Recent imports</b>{imports.map((row) => <span key={row.id}>{new Date(row.createdAt).toLocaleDateString("en-IN")} · {row.fileName} · {row.imported} added · {row.duplicates} already there · {row.contactsAdded} contacts</span>)}</div>}

    </>}
    </div>
    </div>}
    {detail && createPortal(<div className="record-sheet" role="dialog" aria-modal="true" aria-label={`Records of ${detail.name}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setDetail(null); }}>
      <div className="record-sheet__panel">
        <div className="record-sheet__head"><div><small>Customer records</small><h3>{detail.name}</h3></div><span className="repeat-badge">{detail.records.length} record{detail.records.length === 1 ? "" : "s"}</span><CopyButton text={recordSheetText(detail.name, detail.records, names)} label="Copy all" withText/>{detail.records.some((r) => r.mobile) ? <button type="button" className="btn btn--ghost btn--sm" onClick={() => void switchTo(detail.records.find((r) => r.mobile)?.mobile ?? "")}>Switch to this user</button> : null}<button type="button" className="record-sheet__close" onClick={() => setDetail(null)} aria-label="Close"><X size={18}/> Close</button></div>
        <p className="field__hint"><Eye size={12}/> This view was logged in the Inbox.</p>
        {switchError ? <p role="alert" className="alert alert--error">{switchError}</p> : null}
        {detail.records.map((record) => <article key={record.id} className="record-card">
          <header><b>{names[record.service] ?? record.service}</b>{record.removedAt ? <span className="repeat-badge">No longer in the register</span> : null}<small>{day(record.recordDate)}{record.renewalOn ? ` · renewal ${day(record.renewalOn)}` : ""} · {record.source}</small></header>
          <RecordStatus recordId={record.id} status={record.status} comment={record.statusNote} onSaved={(next, comment) => setDetail((current) => current && { ...current, records: current.records.map((item) => item.id === record.id ? { ...item, status: next, statusNote: comment } : item) })}/>
          <dl>
            {record.mobile && <><dt>Mobile</dt><dd><a href={`tel:${record.mobile}`}>{pretty(record.mobile)}</a><CopyButton text={pretty(record.mobile)} label="Copy mobile"/></dd></>}
            {record.whatsapp && <><dt>WhatsApp</dt><dd><a href={`https://wa.me/${record.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">{pretty(record.whatsapp)}</a><CopyButton text={pretty(record.whatsapp)} label="Copy WhatsApp"/></dd></>}
            {record.altMobiles?.length > 0 && <><dt>Other mobiles</dt><dd>{record.altMobiles.map((phone) => <span key={phone}><a href={`tel:${phone}`}>{pretty(phone)}</a><CopyButton text={pretty(phone)} label="Copy mobile"/> </span>)}</dd></>}
            {record.email && <><dt>Email</dt><dd><a href={`mailto:${record.email}`}>{record.email}</a><CopyButton text={record.email} label="Copy email"/></dd></>}
            {record.address && <><dt>Address</dt><dd>{record.address}<CopyButton text={record.address} label="Copy address"/></dd></>}
            {record.hasPan && <><dt>PAN</dt><dd><RevealPan recordId={record.id} masked={record.panMasked}/></dd></>}
            {record.aadhaarMasked && <><dt>Aadhaar</dt><dd>{record.aadhaarMasked}</dd></>}
            {Object.entries(record.fields).map(([label, value]) => <div key={label} className="record-card__field"><dt>{label}</dt><dd>{value}<CopyButton text={value} label={`Copy ${label}`}/></dd></div>)}
          </dl>
        </article>)}
      </div>
    </div>, document.body)}
  </section>;
}
