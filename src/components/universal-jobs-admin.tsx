"use client";
import { FormEvent, useEffect, useState } from "react";
type JobRow = { code: string; serviceName: string; status: string; sourceKind: string; sourceReference: string | null; createdAt: string; missingDocuments: string[] };
type DetailedJob = JobRow & { internalNote: string | null };
type JobEvent = { id: string; kind: string; note: string | null; fromStatus: string | null; toStatus: string | null; createdAt: string };

export default function UniversalJobsAdmin() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [selected, setSelected] = useState<DetailedJob | null>(null);
  const [events, setEvents] = useState<JobEvent[]>([]);
  const [documents, setDocuments] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load(nextPage: number, search = query) {
    setBusy("list"); setError("");
    try {
      const response = await fetch(`/api/admin/jobs?page=${nextPage}&query=${encodeURIComponent(search)}`, { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error("Could not load jobs.");
      const data = await response.json() as { jobs: JobRow[] };
      setJobs(data.jobs); setPage(nextPage);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load jobs."); }
    finally { setBusy(""); }
  }

  useEffect(() => { void load(0, ""); /* owner-only lazy mount */ }, []);

  async function open(code: string) {
    setBusy("detail"); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/jobs?code=${encodeURIComponent(code)}`, { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error("Could not open job.");
      const data = await response.json() as { job: DetailedJob; events: JobEvent[] };
      setSelected(data.job); setEvents(data.events);
      setDocuments(data.job.missingDocuments.join("\n"));
      setNote(data.job.internalNote ?? "");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not open job."); }
    finally { setBusy(""); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setBusy("save"); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/jobs", {
        method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: selected.code, missingDocuments: documents.split(/\r?\n/).map(s => s.trim()).filter(Boolean), internalNote: note.trim() }),
      });
      const data = await response.json() as { error?: string; job?: DetailedJob };
      if (!response.ok || !data.job) throw new Error(data.error ?? "Could not save job notes.");
      setSelected(data.job); setNotice("Job notes saved. New missing-document labels are visible in verified customer tracking.");
      await load(page);
      await open(data.job.code);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save job notes."); }
    finally { setBusy(""); }
  }

  return <div className="panel" aria-label="Universal jobs management">
    <h2>Universal Job IDs</h2>
    <p className="muted">One ID per service. Search by Job ID, original reference or service name. Historical imported records are not automatically linked to customer accounts.</p>
    <form onSubmit={(event) => { event.preventDefault(); void load(0); }} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <input aria-label="Search jobs" value={query} onChange={event => setQuery(event.target.value)} maxLength={80} placeholder="Job ID, reference, service" style={{ flex: "1 1 200px" }}/>
      <button className="btn btn--primary btn--sm" type="submit" disabled={Boolean(busy)}>Search</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    <div className="record-list">
      {jobs.map(job => <article className="record" key={job.code}>
        <div className="record__body"><b>{job.serviceName}</b><small>{job.code} · {job.sourceKind} · {job.status}</small>
          {job.sourceReference && <small>Reference: {job.sourceReference}</small>}</div>
        <button className="btn btn--ghost btn--sm" type="button" disabled={Boolean(busy)} onClick={() => void open(job.code)}>Manage</button>
      </article>)}
    </div>
    <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
      <button type="button" className="btn btn--ghost btn--sm" disabled={Boolean(busy) || page === 0} onClick={() => void load(page - 1)}>Previous</button>
      <span>Page {page + 1}</span>
      <button type="button" className="btn btn--ghost btn--sm" disabled={Boolean(busy) || jobs.length < 20} onClick={() => void load(page + 1)}>Next</button>
    </div>
    {selected && <form onSubmit={(event) => void save(event)} className="panel" style={{ marginTop: 16 }}>
      <h3>{selected.code} · {selected.serviceName}</h3>
      <p>Status: {selected.status} · {selected.sourceKind}</p>
      <label className="field"><span>Missing documents (one label per line)</span><textarea rows={4} maxLength={2200} value={documents} onChange={event => setDocuments(event.target.value)}/></label>
      <label className="field"><span>Internal staff note (not shown to customers)</span><textarea rows={4} maxLength={2000} value={note} onChange={event => setNote(event.target.value)}/></label>
      <button className="btn btn--primary btn--sm" disabled={Boolean(busy)} type="submit">{busy === "save" ? "Saving…" : "Save job details"}</button>
      <h4>Recent history</h4>
      {events.length > 0 ? <ul>{events.map(e => <li key={e.id}>{e.kind} · {e.toStatus ?? ""} · {new Date(e.createdAt).toLocaleString("en-IN")}</li>)}</ul> : <p className="muted">No event history recorded yet.</p>}
    </form>}
  </div>;
}
