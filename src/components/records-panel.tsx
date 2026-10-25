"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Database, Eye, Phone, Search, Upload, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { secureApi, secureUpload } from "@/lib/secure-api-client";
import { AdminPager } from "@/components/admin-pager";

type Person = { key: string; name: string; mobile: string | null; whatsapp: string | null; altMobiles: string[]; email: string | null; address: string | null; total: number; services: string[]; lastDate: string | null; nextRenewal: string | null };
type Listing = { people: Person[]; totals: { people: number; records: number; repeat: number }; byService: { service: string; total: number }[]; services: Record<string, string> };
type SheetReport = { sheet: string; service: string | null; rows: number; records: number; skipped: number; reason?: string; droppedColumns?: string[] };
type ImportResult = { imported: number; duplicates: number; skipped: number; contactsAdded: number; totalRows: number; sheets: SheetReport[] };
type ImportRow = { id: string; fileName: string; imported: number; duplicates: number; contactsAdded: number; createdAt: string };
type Detail = { name: string; records: { id: string; service: string; source: string; recordDate: string | null; renewalOn: string | null; mobile: string | null; whatsapp: string | null; altMobiles: string[]; email: string | null; address: string | null; pan: string | null; aadhaarMasked: string | null; fields: Record<string, string> }[] };

const day = (iso: string | null) => iso ? new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";
const pretty = (phone: string) => phone.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");

/**
 * Admin → Records: import the shop's Excel registers (all sheets) and find customers across them.
 * Data is encrypted in the database; opening a person's records is logged in the inbox.
 */
export default function RecordsPanel() {
  const [data, setData] = useState<Listing | null>(null);
  const [imports, setImports] = useState<ImportRow[]>([]);
  const [q, setQ] = useState("");
  const [service, setService] = useState("");
  const [sort, setSort] = useState<"repeat" | "recent" | "renewal">("repeat");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [importsOpen, setImportsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [addContacts, setAddContacts] = useState(true);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailPage, setDetailPage] = useState(0);
  const [detailPageSize, setDetailPageSize] = useState(1);
  const modalCloseRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load(next: { q?: string; service?: string; sort?: string; page?: number; pageSize?: number } = {}) {
    const params = { q, service, sort, page, pageSize, ...next };
    try { setData(await secureApi<Listing>("W8r2T5yN1cF6", params)); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load records."); }
  }

  useEffect(() => {
    let active = true;
    secureApi<Listing>("W8r2T5yN1cF6", { sort: "repeat", page: 0, pageSize: 20 }).then((value) => { if (active) setData(value); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load records."); });
    return () => { active = false; };
  }, []);

  async function upload(event: FormEvent) {
    event.preventDefault(); if (!file) return;
    setBusy("import"); setError(""); setResult(null);
    try {
      const uploaded = await secureUpload<{ file: { id: string } }>("U7b3R8mQ4zL1", file);
      const response = await secureApi<{ import: ImportResult }>("B4j9D6sX2mH7", { fileId: uploaded.file.id, addContacts });
      setResult(response.import); setFile(null);
      await load({ page: 0 }); setPage(0);
      if (importsOpen) { const history = await secureApi<{ imports: ImportRow[] }>("W8r2T5yN1cF6", { imports: true }); setImports(history.imports); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Import failed."); }
    finally { setBusy(""); }
  }

  async function openPerson(person: Person) {
    setBusy(person.key);
    try {
      const opened = await secureApi<Detail>("W8r2T5yN1cF6", { key: person.key });
      setDetailPage(0); setDetail(opened);
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not open the records."); }
    finally { setBusy(""); }
  }

  useEffect(() => {
    if (!detail) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalCloseRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setDetail(null); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKey); };
  }, [detail]);

  const names = data?.services ?? {};
  const detailsTotal = detail?.records.length ?? 0;
  const detailsPageCount = Math.max(1, Math.ceil(detailsTotal / detailPageSize));
  const safeDetailPage = Math.min(detailPage, detailsPageCount - 1);
  return <section className="admin-queue records">
    <h2><Database size={17}/> Customer records {data ? <span>{data.totals.people.toLocaleString("en-IN")}</span> : null}</h2>
    <p className="admin-lead">🔒 Imported registers are encrypted in the database. Portal passwords and user IDs in the sheets are never imported, Aadhaar numbers stay masked, and the uploaded file is deleted after import. Every time someone opens a person’s records it shows in the Inbox.</p>

    <form className="records-import" onSubmit={upload}>
      <label className="records-import__file"><Upload size={16}/><input type="file" accept=".xlsx,.csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)}/><span>{file?.name ?? "Choose an Excel register (.xlsx), all sheets are read"}</span></label>
      <label className="check"><input type="checkbox" checked={addContacts} onChange={(event) => setAddContacts(event.target.checked)}/> Also add mobile numbers to WhatsApp contacts (as “not asked yet”)</label>
      <button className="btn btn--primary" disabled={!file || busy === "import"}>{busy === "import" ? "Importing… (big files take a minute)" : "Import"}<Upload size={16}/></button>
    </form>
    {result && <div className="alert alert--success" role="status">
      <b>{result.imported.toLocaleString("en-IN")} new records</b> · {result.duplicates.toLocaleString("en-IN")} were already there · {result.contactsAdded.toLocaleString("en-IN")} new WhatsApp contacts
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
    {data && <div className="records-services">
      <button type="button" className={!service ? "is-active" : undefined} onClick={() => { setService(""); setPage(0); void load({ service: "", page: 0 }); }}>All</button>
      {[...data.byService].sort((a, b) => b.total - a.total).map((item) => <button key={item.service} type="button" className={service === item.service ? "is-active" : undefined}
        onClick={() => { setService(item.service); setPage(0); void load({ service: item.service, page: 0 }); }}>{names[item.service] ?? item.service} · {item.total.toLocaleString("en-IN")}</button>)}
    </div>}

    <form className="promo-admin__bar" role="search" onSubmit={(event) => { event.preventDefault(); setPage(0); void load({ page: 0 }); }}>
      <label className="input-wrap"><Search size={16}/><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name, mobile, WhatsApp, email, PAN, Aadhaar or last 4 digits" aria-label="Search customers"/></label>
      <select value={sort} onChange={(event) => { const next = event.target.value as typeof sort; setSort(next); setPage(0); void load({ sort: next, page: 0 }); }} aria-label="Sort">
        <option value="repeat">Most repeated first</option><option value="recent">Most recent first</option><option value="renewal">Next renewal first</option>
      </select>
      <button className="btn btn--ghost btn--sm">Search</button>
    </form>

    {data && <AdminPager page={page} total={data.totals.people} pageSize={pageSize} onPage={(next) => { setPage(next); void load({ page: next }); }} onPageSize={(size) => { setPageSize(size); setPage(0); void load({ page: 0, pageSize: size }); }} label="customer records"/>}
    <div className="people-list">{(data?.people ?? []).map((person) => <article key={person.key} className="person-row">
      <div className="person-row__main">
        <span><b>{person.name}</b>{person.total > 1 && <span className="repeat-badge" title="How many times this person appears across your registers">{person.total}×</span>}</span>
        <small>{person.mobile ? pretty(person.mobile) : "no mobile"}{person.whatsapp ? ` · WhatsApp ${pretty(person.whatsapp)}` : ""}{person.altMobiles?.length ? ` · also ${person.altMobiles.map(pretty).join(", ")}` : ""} · last {day(person.lastDate)}{person.nextRenewal ? ` · renewal ${day(person.nextRenewal)}` : ""}</small>
        {(person.email || person.address) && <small>{person.email && <a href={`mailto:${person.email}`}>{person.email}</a>}{person.email && person.address ? " · " : ""}{person.address}</small>}
        <span className="contact-row__services">{person.services.map((item) => <em key={item}>{names[item] ?? item}</em>)}</span>
      </div>
      <div className="person-row__actions">
        {person.mobile && <a className="icon-btn" href={`tel:${person.mobile}`} aria-label={`Call ${person.name}`}><Phone size={16}/></a>}
        {(person.whatsapp ?? person.mobile) && <a className="icon-btn" href={`https://wa.me/${(person.whatsapp ?? person.mobile ?? "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${person.name}`}><WhatsAppIcon size={16}/></a>}
        <button type="button" className="btn btn--ghost btn--sm" disabled={busy === person.key} onClick={() => void openPerson(person)}><Eye size={14}/>Open</button>
      </div>
    </article>)}</div>
    {data && !data.people.length && <p className="admin-empty">{data.totals.records ? "Nobody matches." : "No registers imported yet. Upload your PAN, insurance or certificate Excel files above."}</p>}
    {data && data.totals.people > pageSize && <AdminPager page={page} total={data.totals.people} pageSize={pageSize} onPage={(next) => { setPage(next); void load({ page: next }); }} label="customer records"/>}

    <details className="pan-import-history admin-accordion" open={importsOpen} onToggle={(event) => { const open = event.currentTarget.open; setImportsOpen(open); if (open && !imports.length) void secureApi<{ imports: ImportRow[] }>("W8r2T5yN1cF6", { imports: true }).then((value) => setImports(value.imports)).catch(() => undefined); }}><summary>Recent imports {importsOpen && imports.length ? `(${imports.length})` : ""}</summary>{imports.length ? imports.map((row) => <span key={row.id}>{new Date(row.createdAt).toLocaleDateString("en-IN")} · {row.fileName} · {row.imported} added · {row.duplicates} already there · {row.contactsAdded} contacts</span>) : <small>No imports recorded.</small>}</details>

    {detail && typeof document !== "undefined" && createPortal(
      <div className="record-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetail(null); }}>
        <div className="record-modal__panel" role="dialog" aria-modal="true" aria-label={`Records of ${detail.name}`}>
          <header className="record-modal__header">
            <div><h3>{detail.name} <span className="repeat-badge">{detailsTotal}×</span></h3>
              <small><Eye size={12}/> Access to these records is logged in the Inbox.</small></div>
            <button ref={modalCloseRef} type="button" className="btn btn--ghost btn--sm record-modal__close" onClick={() => setDetail(null)} aria-label="Close customer records"><X size={18}/> Close</button>
          </header>
          <div className="record-modal__toolbar">
            <span>{detailsTotal ? `Records ${safeDetailPage * detailPageSize + 1}–${Math.min(detailsTotal, (safeDetailPage + 1) * detailPageSize)} of ${detailsTotal}` : "No records"}</span>
            <label>Cards per page <select aria-label="Records per detail page" value={detailPageSize} onChange={(event) => { setDetailPageSize(Number(event.target.value)); setDetailPage(0); }}>
              {[1, 5, 10].map((size) => <option key={size} value={size}>{size}</option>)}
            </select></label>
          </div>
          <div className="record-modal__body" tabIndex={0}>
            {detail.records.slice(safeDetailPage * detailPageSize, (safeDetailPage + 1) * detailPageSize).map((record) => <article key={record.id} className="record-card">
              <header><b>{names[record.service] ?? record.service}</b><small>{day(record.recordDate)}{record.renewalOn ? ` · renewal ${day(record.renewalOn)}` : ""} · {record.source}</small></header>
              <dl>
                {record.mobile && <><dt>Mobile</dt><dd><a href={`tel:${record.mobile}`}>{pretty(record.mobile)}</a></dd></>}
                {record.whatsapp && <><dt>WhatsApp</dt><dd><a href={`https://wa.me/${record.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">{pretty(record.whatsapp)}</a></dd></>}
                {record.altMobiles?.length > 0 && <><dt>Other mobiles</dt><dd>{record.altMobiles.map((phone) => <a key={phone} href={`tel:${phone}`}>{pretty(phone)} </a>)}</dd></>}
                {record.email && <><dt>Email</dt><dd><a href={`mailto:${record.email}`}>{record.email}</a></dd></>}
                {record.address && <><dt>Address</dt><dd>{record.address}</dd></>}
                {record.pan && <><dt>PAN</dt><dd>{record.pan}</dd></>}
                {record.aadhaarMasked && <><dt>Aadhaar</dt><dd>{record.aadhaarMasked}</dd></>}
                {Object.entries(record.fields).map(([label, value]) => <div key={label} className="record-card__field"><dt>{label}</dt><dd>{value}</dd></div>)}
              </dl>
            </article>)}
          </div>
          <footer className="record-modal__footer">
            <button type="button" className="btn btn--ghost btn--sm" disabled={safeDetailPage === 0} onClick={() => setDetailPage(0)}>First</button>
            <button type="button" className="btn btn--ghost btn--sm" disabled={safeDetailPage === 0} onClick={() => setDetailPage(safeDetailPage - 1)}>Previous</button>
            <span>Page {safeDetailPage + 1} of {detailsPageCount}</span>
            <button type="button" className="btn btn--ghost btn--sm" disabled={safeDetailPage >= detailsPageCount - 1} onClick={() => setDetailPage(safeDetailPage + 1)}>Next</button>
            <button type="button" className="btn btn--ghost btn--sm" disabled={safeDetailPage >= detailsPageCount - 1} onClick={() => setDetailPage(detailsPageCount - 1)}>Last</button>
          </footer>
        </div>
      </div>, document.body)}
  </section>;
}
