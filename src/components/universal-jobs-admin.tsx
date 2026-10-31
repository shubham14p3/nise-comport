"use client";
import { FormEvent, useEffect, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";

const ADMIN_JOBS_READ_OP = "A5j8T2mQ7nR4";
const ADMIN_JOBS_UPDATE_OP = "V9k3L6pD2tF7";
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
  const [customerUpdate, setCustomerUpdate] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load(nextPage: number, search = query) {
    setBusy("list"); setError("");
    try {
      const data = await secureApi<{ jobs: JobRow[] }>(ADMIN_JOBS_READ_OP, { page: nextPage, query: search });
      setJobs(data.jobs); setPage(nextPage);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load jobs."); }
    finally { setBusy(""); }
  }

  useEffect(() => {
    let active = true;
    void secureApi<{ jobs: JobRow[] }>(ADMIN_JOBS_READ_OP, { page: 0 })
      .then(result => { if (active) setJobs(result.jobs); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Could not load jobs."); });
    return () => { active = false; };
  }, []);

  async function open(code: string) {
    setBusy("detail"); setError(""); setNotice("");
    try {
      const data = await secureApi<{ job: DetailedJob; events: JobEvent[] }>(ADMIN_JOBS_READ_OP, { code });
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
      const data = await secureApi<{ ok: boolean; job: DetailedJob }>(ADMIN_JOBS_UPDATE_OP, {
        code: selected.code, missingDocuments: documents.split(/\r?\n/).map(s => s.trim()).filter(Boolean),
        internalNote: note.trim(), ...(customerUpdate.trim() ? { customerUpdate: customerUpdate.trim() } : {}),
      });
      if (!data.job) throw new Error("Could not save job notes.");
      setSelected(data.job);
      await load(page);
      await open(data.job.code);
      setCustomerUpdate("");
      setNotice("Saved. Customer-visible updates can be viewed by the verified owner.");
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
      <label className="field"><span>Progress update for the customer (optional; visible on WhatsApp and in their account)</span><textarea rows={3} maxLength={500} value={customerUpdate} onChange={event => setCustomerUpdate(event.target.value)} placeholder="We reviewed the file and are waiting for the issuing office."/></label>
      <button className="btn btn--primary btn--sm" disabled={Boolean(busy)} type="submit">{busy === "save" ? "Saving…" : "Save job details"}</button>
      <h4>Recent history</h4>
      {events.length > 0 ? <ul>{events.map(e => <li key={e.id}>{e.kind} · {e.toStatus ?? ""} · {new Date(e.createdAt).toLocaleString("en-IN")}</li>)}</ul> : <p className="muted">No event history recorded yet.</p>}
    </form>}
  </div>;
}
