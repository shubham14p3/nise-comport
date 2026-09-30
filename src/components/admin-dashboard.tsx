"use client";
import Link from "next/link";
import { useState } from "react";
import SiteHeader from "@/components/site-header";
import PanImportPanel from "@/components/pan-import-panel";
import WalletCreditForm from "@/components/wallet-credit-form";
import { ClipboardList, FileText, RefreshCw, Search, ShieldCheck } from "lucide-react";

type Row = { id: string; reference: string; name: string; email: string; phone: string | null; status: string; createdAt: string };
type Job = Row & { fileName: string; pageCount: number; total: string; fulfillment: string; scheduledAt: string | null };
type Request = Row & { serviceName: string; fileName: string | null };
const options = ["submitted", "reviewing", "waiting_for_customer", "ready_for_pickup", "out_for_delivery", "completed", "cancelled"];
const label = (value: string) => value.replaceAll("_", " ");
const when = (value: string) => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export default function AdminDashboard({ jobs: initialJobs, requests: initialRequests, canImport, filters }: { jobs: Job[]; requests: Request[]; canImport: boolean; filters: { status: string; q: string } }) {
  const [jobs, setJobs] = useState(initialJobs); const [requests, setRequests] = useState(initialRequests);
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [saving, setSaving] = useState("");

  async function update(kind: "print" | "service", id: string, current: string, status: string) {
    if (status === current) return;
    if (status === "cancelled" && !window.confirm("Cancel this item? The customer will be emailed.")) return;
    setSaving(id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/jobs/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, status, expectedStatus: current }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Could not update this status.");
      if (kind === "print") setJobs(rows => rows.map(row => row.id === id ? { ...row, status } : row));
      else setRequests(rows => rows.map(row => row.id === id ? { ...row, status } : row));
      setNotice("Status updated. The customer will receive an email.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update this status."); }
    finally { setSaving(""); }
  }

  return <main className="content-page"><SiteHeader/><section className="container admin-page"><span className="eyebrow eyebrow-muted"><ShieldCheck size={14}/> TEAM WORKSPACE</span><h1>Service desk <em>queue.</em></h1><p>Review new work, confirm details with customers and keep each order status current.</p>
    <form className="admin-filters" method="get" role="search">
      <label>Status<select name="status" defaultValue={filters.status}><option value="">All statuses</option>{options.map(item => <option key={item} value={item}>{label(item)}</option>)}</select></label>
      <label>Search<input name="q" defaultValue={filters.q} placeholder="Reference, name, email or phone" maxLength={80}/></label>
      <button className="button button-green"><Search size={14}/> Filter</button>{(filters.status || filters.q) && <Link className="profile-text-button" href="/admin">Clear</Link>}
    </form>
    {error && <div className="form-alert error-alert" role="alert">{error}</div>}{notice && <div className="form-alert success-alert" role="status">{notice}</div>}
    <section className="admin-queue"><h2><FileText size={17}/> Print orders <span>{jobs.length}</span></h2>{jobs.length ? jobs.map(job => <article className="admin-row" key={job.id}><div><b>{job.reference} · {job.fileName}</b><small>{job.name} · {job.email}{job.phone ? ` · ${job.phone}` : ""} · {job.pageCount} printed pages · ₹{Number(job.total).toFixed(2)} · {job.fulfillment}{job.scheduledAt ? ` · for ${when(job.scheduledAt)}` : ""} · {when(job.createdAt)}</small><a href={`/api/admin/jobs/${job.id}/file`} target="_blank" rel="noreferrer">Open private print file</a></div><select aria-label={`Update ${job.reference} status`} value={job.status} disabled={saving === job.id} onChange={event => void update("print", job.id, job.status, event.target.value)}>{options.map(item => <option key={item} value={item}>{label(item)}</option>)}</select></article>) : <p className="admin-empty">No print orders match.</p>}</section>
    <section className="admin-queue"><h2><ClipboardList size={17}/> Service requests <span>{requests.length}</span></h2>{requests.length ? requests.map(item => <article className="admin-row" key={item.id}><div><b>{item.reference} · {item.serviceName}</b><small>{item.name} · {item.email}{item.phone ? ` · ${item.phone}` : ""} · {when(item.createdAt)}</small><Link href={`/admin/requests/${item.id}`}>Read submitted request details</Link>{item.fileName && <a href={`/api/admin/requests/${item.id}/file`} target="_blank" rel="noreferrer">Open supporting file · {item.fileName}</a>}</div><select aria-label={`Update ${item.reference} status`} value={item.status} disabled={saving === item.id} onChange={event => void update("service", item.id, item.status, event.target.value)}>{options.map(option => <option key={option} value={option}>{label(option)}</option>)}</select></article>) : <p className="admin-empty">No service requests match.</p>}</section>
    {canImport && <><PanImportPanel/><WalletCreditForm/></>}<p className="admin-note"><RefreshCw size={13}/> Status changes are recorded with your name and email the customer. If someone else changed an item first, you’ll be asked to refresh.</p></section></main>;
}
