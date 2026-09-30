"use client";

import { FormEvent, useEffect, useState } from "react";
import SiteHeader from "@/components/site-header";
import PanImportPanel from "@/components/pan-import-panel";
import WalletCreditForm from "@/components/wallet-credit-form";
import PanSavedDetails from "@/components/pan-saved-details";
import { ClipboardList, FileText, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { secureApi, secureFile } from "@/lib/secure-api-client";

type Row = { id: string; reference: string; name: string; email: string; phone: string | null; status: string; createdAt: string };
type Job = Row & { fileName: string; pageCount: number; total: string; fulfillment: string; scheduledAt: string | null };
type RequestRow = Row & { serviceName: string; fileName: string | null };
type Snapshot = { jobs: Job[]; requests: RequestRow[]; canImport: boolean; filters: { status: string; q: string } };
type RequestDetail = {
  request: { id: string; reference: string; serviceName: string; status: string; statusLabel: string; details: Record<string, unknown>; createdAt: string };
  customer: { name: string; email: string; phone: string | null; preferredContact: string };
  events: { fromStatus: string | null; toStatus: string; fromLabel: string | null; toLabel: string; note: string | null; createdAt: string; actor: string | null }[];
};

const options = ["submitted", "reviewing", "waiting_for_customer", "ready_for_pickup", "out_for_delivery", "completed", "cancelled"];
const label = (value: string) => value.replaceAll("_", " ");
const when = (value: string) => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [canImport, setCanImport] = useState(false);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState("");
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);

  async function load(nextStatus = status, nextQ = q) {
    setError("");
    try {
      const result = await secureApi<Snapshot>("J2w7L5pD9nV4", { status: nextStatus, q: nextQ });
      setJobs(result.jobs); setRequests(result.requests); setCanImport(result.canImport);
      setStatus(result.filters.status); setQ(result.filters.q); setLoaded(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load the staff queue.");
      setLoaded(true);
    }
  }

  useEffect(() => { void load("", ""); }, []);

  async function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setDetail(null); await load(status, q);
  }

  async function update(kind: "print" | "service", id: string, current: string, nextStatus: string) {
    if (nextStatus === current) return;
    if (nextStatus === "cancelled" && !window.confirm("Cancel this item? The customer will be emailed.")) return;
    setSaving(id); setError(""); setNotice("");
    try {
      await secureApi("R1k5V8nD3sJ9", { id, kind, status: nextStatus, expectedStatus: current });
      if (kind === "print") setJobs(rows => rows.map(row => row.id === id ? { ...row, status: nextStatus } : row));
      else setRequests(rows => rows.map(row => row.id === id ? { ...row, status: nextStatus } : row));
      setNotice("Status updated. The customer will receive an email.");
      if (detail?.request.id === id) await openDetail(id);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update this status."); }
    finally { setSaving(""); }
  }

  async function openDetail(id: string) {
    setDetailBusy(true); setError("");
    try { setDetail(await secureApi<RequestDetail>("B6r1K8mQ3cT9", { id })); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not open request details."); }
    finally { setDetailBusy(false); }
  }

  async function openPrivateFile(operation: string, id: string) {
    setError("");
    try {
      const result = await secureFile(operation, { id });
      const url = URL.createObjectURL(result.blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not open the private file.");
    }
  }

  return <main className="content-page"><SiteHeader/><section className="container admin-page">
    <span className="eyebrow eyebrow-muted"><ShieldCheck size={14}/> TEAM WORKSPACE</span>
    <h1>Service desk <em>queue.</em></h1>
    <p>Private queue data, search terms, status updates and file access use the encrypted staff channel.</p>

    <form className="admin-filters" role="search" onSubmit={filter}>
      <label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option>{options.map(item => <option key={item} value={item}>{label(item)}</option>)}</select></label>
      <label>Search<input value={q} onChange={event => setQ(event.target.value)} placeholder="Reference, name, email or phone" maxLength={80}/></label>
      <button className="button button-green"><Search size={14}/> Filter</button>
      {(status || q) && <button type="button" className="profile-text-button" onClick={() => { setStatus(""); setQ(""); setDetail(null); void load("", ""); }}>Clear</button>}
    </form>

    {error && <div className="form-alert error-alert" role="alert">{error}</div>}
    {notice && <div className="form-alert success-alert" role="status">{notice}</div>}
    {!loaded && <p>Opening encrypted staff queue…</p>}

    <section className="admin-queue"><h2><FileText size={17}/> Print orders <span>{jobs.length}</span></h2>
      {jobs.length ? jobs.map(job => <article className="admin-row" key={job.id}><div>
        <b>{job.reference} · {job.fileName}</b>
        <small>{job.name} · {job.email}{job.phone ? ` · ${job.phone}` : ""} · {job.pageCount} printed pages · ₹{Number(job.total).toFixed(2)} · {job.fulfillment}{job.scheduledAt ? ` · for ${when(job.scheduledAt)}` : ""} · {when(job.createdAt)}</small>
        <button type="button" className="profile-text-button" onClick={() => void openPrivateFile("H3q7M0xP6cL2", job.id)}>Open private print file</button>
      </div><select aria-label={`Update ${job.reference} status`} value={job.status} disabled={saving === job.id} onChange={event => void update("print", job.id, job.status, event.target.value)}>{options.map(item => <option key={item} value={item}>{label(item)}</option>)}</select></article>) : loaded ? <p className="admin-empty">No print orders match.</p> : null}
    </section>

    <section className="admin-queue"><h2><ClipboardList size={17}/> Service requests <span>{requests.length}</span></h2>
      {requests.length ? requests.map(item => <article className="admin-row" key={item.id}><div>
        <b>{item.reference} · {item.serviceName}</b>
        <small>{item.name} · {item.email}{item.phone ? ` · ${item.phone}` : ""} · {when(item.createdAt)}</small>
        <button type="button" className="profile-text-button" onClick={() => void openDetail(item.id)}>Read submitted request details</button>
        {item.fileName && <button type="button" className="profile-text-button" onClick={() => void openPrivateFile("V8d4K1rF7nT5", item.id)}>Open supporting file · {item.fileName}</button>}
      </div><select aria-label={`Update ${item.reference} status`} value={item.status} disabled={saving === item.id} onChange={event => void update("service", item.id, item.status, event.target.value)}>{options.map(option => <option key={option} value={option}>{label(option)}</option>)}</select></article>) : loaded ? <p className="admin-empty">No service requests match.</p> : null}
    </section>

    {(detailBusy || detail) && <section className="admin-queue">
      <h2>Private request details</h2>
      {detailBusy && <p>Opening encrypted request details…</p>}
      {detail && <div>
        <p><b>{detail.request.serviceName}</b> · {detail.request.reference} · {detail.request.statusLabel} · {when(detail.request.createdAt)}</p>
        <p>{detail.customer.name} · <a href={`mailto:${detail.customer.email}`}>{detail.customer.email}</a>{detail.customer.phone ? <> · <a href={`tel:${detail.customer.phone}`}>{detail.customer.phone}</a></> : null}</p>
        <p>Preferred contact: {typeof detail.request.details.preferredContact === "string" ? detail.request.details.preferredContact : detail.customer.preferredContact}</p>
        <PanSavedDetails details={detail.request.details}/>
        <article className="pan-card"><h3>Customer note</h3><p>{typeof detail.request.details.description === "string" ? detail.request.details.description : "No note provided."}</p></article>
        <article className="pan-card"><h3>History</h3>{detail.events.length ? <ol className="request-timeline">{detail.events.map((event, index) => <li key={`${event.createdAt}-${index}`}><b>{event.fromLabel ? `${event.fromLabel} → ` : ""}{event.toLabel}</b> <small>{when(event.createdAt)}{event.actor ? ` · ${event.actor}` : ""}</small>{event.note ? <p>{event.note}</p> : null}</li>)}</ol> : <p>No history recorded yet.</p>}</article>
        <button type="button" className="profile-text-button" onClick={() => setDetail(null)}>Close details</button>
      </div>}
    </section>}

    {canImport && <><PanImportPanel/><WalletCreditForm/></>}
    <p className="admin-note"><RefreshCw size={13}/> Status changes are recorded with your name and email the customer. If someone else changed an item first, refresh the encrypted queue.</p>
  </section></main>;
}
