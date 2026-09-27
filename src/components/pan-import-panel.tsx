"use client";
import { FormEvent, useState } from "react";
import { Database, Search, Upload } from "lucide-react";
type ImportRow = { id: string; rowCount: number; acceptedRows: number; rejectedRows: number; createdAt: string };
type RecordRow = { id: string; holderName: string; recordStatus: string; createdAt: string };
export default function PanImportPanel() {
  const [file, setFile] = useState<File | null>(null); const [query, setQuery] = useState("");
  const [imports, setImports] = useState<ImportRow[]>([]); const [records, setRecords] = useState<RecordRow[]>([]);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function search(event?: FormEvent) {
    event?.preventDefault(); setError("");
    const response = await fetch(`/api/admin/pan-imports?q=${encodeURIComponent(query)}`); const result = await response.json();
    if (!response.ok) { setError(result.error); return; }
    setImports(result.imports); setRecords(result.records);
  }
  async function importFile(event: FormEvent) {
    event.preventDefault(); if (!file) return; setBusy(true); setError(""); setMessage("");
    try {
      const form = new FormData(); form.set("file", file);
      const uploaded = await fetch("/api/uploads", { method: "POST", body: form }); const uploadedResult = await uploaded.json();
      if (!uploaded.ok) throw new Error(uploadedResult.error);
      const response = await fetch("/api/admin/pan-imports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileId: uploadedResult.file.id }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setMessage(`${result.import.acceptedRows} new records imported. ${result.import.rejectedRows} duplicates or invalid rows were skipped.`); setFile(null); await search();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Import failed."); }
    finally { setBusy(false); }
  }
  return <section className="admin-queue pan-import"><h2><Database size={17}/> PAN data import &amp; lookup</h2><p>Upload a CSV/XLSX with <b>PAN</b> and <b>Name</b> columns. PAN values are encrypted in the database; lookups return names/status only.</p>
    <form className="pan-import-form" onSubmit={importFile}><label><Upload size={15}/><input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={event => setFile(event.target.files?.[0] ?? null)}/><span>{file?.name ?? "Choose CSV or XLSX (up to 20 MB)"}</span></label><button className="button button-green" disabled={busy || !file}>{busy ? "Importing…" : "Import data"}</button></form>
    <form className="pan-search" onSubmit={search}><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name or exact PAN"/><button type="submit" aria-label="Search"><Search size={16}/></button></form>
    {error && <div className="form-alert error-alert">{error}</div>}{message && <div className="form-alert success-alert">{message}</div>}
    {records.length > 0 && <div className="pan-records">{records.map(row => <article key={row.id}><b>{row.holderName}</b><span>{row.recordStatus}</span><small>{new Date(row.createdAt).toLocaleDateString("en-IN")}</small></article>)}</div>}
    <div className="pan-import-history"><b>Recent imports</b>{imports.length ? imports.map(row => <span key={row.id}>{new Date(row.createdAt).toLocaleDateString("en-IN")} · {row.acceptedRows} added · {row.rejectedRows} skipped</span>) : <small>No import history yet.</small>}</div>
  </section>;
}
