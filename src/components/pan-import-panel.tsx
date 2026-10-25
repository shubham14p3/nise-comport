"use client";
import { FormEvent, useState } from "react";
import { Database, Search, Upload } from "lucide-react";
import { secureApi, secureUpload } from "@/lib/secure-api-client";
import { AdminPager } from "@/components/admin-pager";
type ImportRow = { id: string; rowCount: number; acceptedRows: number; rejectedRows: number; createdAt: string };
type RecordRow = { id: string; holderName: string; recordStatus: string; createdAt: string };
export default function PanImportPanel() {
  const [file, setFile] = useState<File | null>(null); const [query, setQuery] = useState("");
  const [imports, setImports] = useState<ImportRow[]>([]); const [records, setRecords] = useState<RecordRow[]>([]);
  const [page, setPage] = useState(0); const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [importsFetched, setImportsFetched] = useState(false);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function search(event?: FormEvent, nextPage = 0, size = pageSize) {
    event?.preventDefault(); setError("");
    try { const result = await secureApi<{ records: RecordRow[]; total: number }>("C9p2W6mH4xB8", { q: query, page: nextPage, pageSize: size }); setRecords(result.records); setTotal(result.total); setPage(nextPage); } catch (reason) { setError(reason instanceof Error ? reason.message : "Search failed."); }
  }
  async function loadImports() {
    if (importsFetched) return;
    try { const result = await secureApi<{ imports: ImportRow[] }>("C9p2W6mH4xB8", { imports: true }); setImports(result.imports); setImportsFetched(true); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load import history."); }
  }
  async function importFile(event: FormEvent) {
    event.preventDefault(); if (!file) return; setBusy(true); setError(""); setMessage("");
    try {
      const uploadedResult = await secureUpload<{ file: { id: string } }>("U7b3R8mQ4zL1", file);
      const result = await secureApi<{ import: { acceptedRows: number; rejectedRows: number } }>("L5v1N7qD9kR3", { fileId: uploadedResult.file.id });
      setMessage(`${result.import.acceptedRows} new records imported. ${result.import.rejectedRows} duplicates or invalid rows were skipped.`); setFile(null); await search();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Import failed."); }
    finally { setBusy(false); }
  }
  return <section className="admin-queue pan-import"><h2><Database size={17}/> PAN data import &amp; lookup</h2><p>Upload a CSV/XLSX with <b>PAN</b> and <b>Name</b> columns. PAN values are encrypted in the database; lookups return names/status only.</p>
    <form className="pan-import-form" onSubmit={importFile}><label><Upload size={15}/><input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={event => setFile(event.target.files?.[0] ?? null)}/><span>{file?.name ?? "Choose CSV or XLSX (up to 20 MB)"}</span></label><button className="button button-green" disabled={busy || !file}>{busy ? "Importing…" : "Import data"}</button></form>
    <form className="pan-search" onSubmit={search}><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name or exact PAN"/><button type="submit" aria-label="Search"><Search size={16}/></button></form>
    {error && <div className="form-alert error-alert">{error}</div>}{message && <div className="form-alert success-alert">{message}</div>}
    {total > 0 && <AdminPager page={page} total={total} pageSize={pageSize} onPage={(next) => void search(undefined, next)} onPageSize={(size) => { setPageSize(size); void search(undefined, 0, size); }} label="PAN records"/>}
    {records.length > 0 && <div className="pan-records">{records.map(row => <article key={row.id}><b>{row.holderName}</b><span>{row.recordStatus}</span><small>{new Date(row.createdAt).toLocaleDateString("en-IN")}</small></article>)}</div>}
    {total > pageSize && <AdminPager page={page} total={total} pageSize={pageSize} onPage={(next) => void search(undefined, next)} label="PAN records"/>}
    <details className="pan-import-history admin-accordion" onToggle={(event) => { if (event.currentTarget.open) void loadImports(); }}><summary>Recent PAN imports {importsFetched ? `(${imports.length})` : ""}</summary>{imports.length ? imports.map(row => <span key={row.id}>{new Date(row.createdAt).toLocaleDateString("en-IN")} · {row.acceptedRows} added · {row.rejectedRows} skipped</span>) : <small>No import history yet.</small>}</details>
  </section>;
}
