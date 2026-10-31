"use client";
import { useEffect, useState } from "react";

type Job = { code: string; serviceName: string; status: string; missingDocuments: string[]; createdAt: string; updatedAt: string };
type JobDetail = { job: Job & { sourceReference?: string | null }; events: { kind: string; toStatus: string | null; note: string | null; createdAt: string }[] };

export default function UniversalJobsPanel() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let active = true;
    void fetch("/api/jobs", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error("Could not load your jobs."); return response.json() as Promise<{ jobs: Job[] }>; })
      .then((data) => { if (active) setJobs(data.jobs); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load jobs."); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);

  async function openJob(code: string) {
    if (selected === code) { setSelected(null); setDetail(null); return; }
    setSelected(code);
    setDetail(null);
    setError("");
    try {
      const response = await fetch(`/api/jobs?code=${encodeURIComponent(code)}`, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error("Could not open job details.");
      const result = await response.json() as JobDetail;
      setDetail(result);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not open the job."); }
  }

  const query = search.trim().toLowerCase();
  const visible = jobs.filter((job) => !query || `${job.code} ${job.serviceName} ${job.status}`.toLowerCase().includes(query));
  return <section className="panel" aria-label="My universal Job IDs">
    <h2>All my jobs</h2>
    <p className="muted">Every online request, print order and linked Counter visit has its own Job ID. Use it to ask about the same work on WhatsApp. Historical records require an ownership check first.</p>
    <label className="field"><span className="field__label">Find a job</span><input value={search} maxLength={100} onChange={(event) => setSearch(event.target.value)} placeholder="Job ID or service name"/></label>
    {busy && <p>Loading jobs…</p>}
    {error && <p role="alert">{error}</p>}
    {!busy && !error && jobs.length === 0 && <p>No jobs are linked to your account yet.</p>}
    {!busy && <div className="record-list">
      {visible.map((job) => <article className="record" key={job.code}>
        <div className="record__body">
          <b>{job.serviceName}</b>
          <small>Job ID: <strong>{job.code}</strong> · {new Date(job.createdAt).toLocaleDateString("en-IN")}</small>
          <small>Status: {job.status.replaceAll("_", " ")}</small>
          {job.missingDocuments.length > 0 && <p>Missing: {job.missingDocuments.join(", ")}</p>}
          {selected === job.code && detail?.job.code === job.code && <div>
            {detail.job.sourceReference && <small>Original reference: {detail.job.sourceReference}</small>}
            {detail.events.length > 0 && <ul>{detail.events.map((event, index) => <li key={index}>{event.toStatus || event.kind} · {new Date(event.createdAt).toLocaleDateString("en-IN")}</li>)}</ul>}
          </div>}
        </div>
        <button className="btn btn--ghost btn--sm" type="button" onClick={() => void openJob(job.code)}>{selected === job.code ? "Hide" : "Details"}</button>
      </article>)}
    </div>}
    {!busy && jobs.length >= 50 && <p className="muted">Showing the most recent 50 jobs. Ask the service desk for older records.</p>}
  </section>;
}
