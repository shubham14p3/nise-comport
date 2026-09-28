"use client";
import { useState } from "react";
import SiteHeader from "@/components/site-header";
import PanImportPanel from "@/components/pan-import-panel";
import WalletCreditForm from "@/components/wallet-credit-form";
import { ClipboardList, FileText, RefreshCw, ShieldCheck } from "lucide-react";

type Row = { id: string; reference: string; name: string; email: string; status: string; createdAt: string };
type Job = Row & { fileName: string; pageCount: number; total: string; fulfillment: string };
type Request = Row & { serviceName: string; fileName: string | null };
const options = ["submitted", "reviewing", "waiting_for_customer", "ready_for_pickup", "out_for_delivery", "completed", "cancelled"];
const label = (value: string) => value.replaceAll("_", " ");
export default function AdminDashboard({ jobs: initialJobs, requests: initialRequests, canImport }: { jobs: Job[]; requests: Request[]; canImport: boolean }) {
  const [jobs, setJobs] = useState(initialJobs); const [requests, setRequests] = useState(initialRequests);
  const [error, setError] = useState(""); const [saving, setSaving] = useState("");
  async function update(kind: "print" | "service", id: string, status: string) {
    setSaving(id); setError("");
    try {
      const response = await fetch(`/api/admin/jobs/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, status }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      if (kind === "print") setJobs(rows => rows.map(row => row.id === id ? { ...row, status } : row));
      else setRequests(rows => rows.map(row => row.id === id ? { ...row, status } : row));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update this status."); }
    finally { setSaving(""); }
  }
  return <main className="content-page"><SiteHeader/><section className="container admin-page"><span className="eyebrow eyebrow-muted"><ShieldCheck size={14}/> TEAM WORKSPACE</span><h1>Service desk <em>queue.</em></h1><p>Review new work, confirm details with customers and keep each order status current.</p>{error && <div className="form-alert error-alert">{error}</div>}
    <section className="admin-queue"><h2><PrinterIcon/> Print orders <span>{jobs.length}</span></h2>{jobs.length ? jobs.map(job => <article className="admin-row" key={job.id}><div><b>{job.reference} · {job.fileName}</b><small>{job.name} · {job.email} · {job.pageCount} printed pages · ₹{Number(job.total).toFixed(2)} · {job.fulfillment}</small><a href={`/api/admin/jobs/${job.id}/file`} target="_blank" rel="noreferrer">Open private print file</a></div><select aria-label={`Update ${job.reference} status`} value={job.status} disabled={saving === job.id} onChange={event => void update("print", job.id, event.target.value)}>{options.map(item => <option key={item} value={item}>{label(item)}</option>)}</select></article>) : <p className="admin-empty">No print orders are waiting.</p>}</section>
    <section className="admin-queue"><h2><ClipboardList size={17}/> Service requests <span>{requests.length}</span></h2>{requests.length ? requests.map(item => <article className="admin-row" key={item.id}><div><b>{item.reference} · {item.serviceName}</b><small>{item.name} · {item.email} · {new Date(item.createdAt).toLocaleString("en-IN")}</small><a href={`/admin/requests/${item.id}`}>Read submitted request details</a>{item.fileName && <a href={`/api/admin/requests/${item.id}/file`} target="_blank" rel="noreferrer">Open supporting file · {item.fileName}</a>}</div><select aria-label={`Update ${item.reference} status`} value={item.status} disabled={saving === item.id} onChange={event => void update("service", item.id, event.target.value)}>{options.map(option => <option key={option} value={option}>{label(option)}</option>)}</select></article>) : <p className="admin-empty">No service requests are waiting.</p>}</section>
    {canImport && <><PanImportPanel/><WalletCreditForm/></>}<p className="admin-note"><RefreshCw size={13}/> Status changes queue an email update to the customer.</p></section></main>;
}
function PrinterIcon() { return <FileText size={17}/>; }
