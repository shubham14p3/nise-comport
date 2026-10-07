"use client";

import { FormEvent, useCallback, useEffect, useState, useSyncExternalStore } from "react";
import SiteHeader from "@/components/site-header";
import PanImportPanel from "@/components/pan-import-panel";
import WalletCreditForm from "@/components/wallet-credit-form";
import PanSavedDetails from "@/components/pan-saved-details";
import RequestExtras from "@/components/request-extras";
import { Bell, ClipboardList, Contact, Database, FolderLock, FileText, Megaphone, RefreshCw, Search, ShieldCheck, TicketPercent, UsersRound, WalletCards } from "lucide-react";
import { secureApi, secureFile } from "@/lib/secure-api-client";
import PromotionsPanel from "@/components/promotions-panel";
import CampaignsPanel from "@/components/campaigns-panel";
import ContactsPanel from "@/components/contacts-panel";
import TeamPanel from "@/components/team-panel";
import InboxPanel from "@/components/inbox-panel";
import RecordsPanel from "@/components/records-panel";
import type { Permission } from "@/lib/permissions";

type Row = { id: string; reference: string; name: string; email: string; phone: string | null; status: string; createdAt: string };
type Job = Row & { fileName: string; pageCount: number; total: string; fulfillment: string; scheduledAt: string | null };
type RequestRow = Row & { serviceName: string; fileName: string | null };
type Snapshot = { jobs: Job[]; requests: RequestRow[]; filters: { status: string; q: string } };
type RequestDetail = {
  request: { id: string; reference: string; serviceName: string; status: string; statusLabel: string; details: Record<string, unknown>; createdAt: string };
  customer: { name: string; email: string; phone: string | null; preferredContact: string };
  events: { fromStatus: string | null; toStatus: string; fromLabel: string | null; toLabel: string; note: string | null; createdAt: string; actor: string | null }[];
};

const options = ["submitted", "reviewing", "waiting_for_customer", "ready_for_pickup", "out_for_delivery", "completed", "cancelled"];
const label = (value: string) => value.replaceAll("_", " ");
const when = (value: string) => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

function RequestQueue() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
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
      setJobs(result.jobs); setRequests(result.requests);
      setStatus(result.filters.status); setQ(result.filters.q); setLoaded(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load the staff queue.");
      setLoaded(true);
    }
  }

  useEffect(() => {
    let active = true;
    secureApi<Snapshot>("J2w7L5pD9nV4", { status: "", q: "" })
      .then((result) => {
        if (!active) return;
        setJobs(result.jobs); setRequests(result.requests);
        setStatus(result.filters.status); setQ(result.filters.q); setLoaded(true);
      })
      .catch((reason) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Could not load the staff queue."); setLoaded(true);
      });
    return () => { active = false; };
  }, []);

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

  return <>
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
        <article className="pan-card"><h3>Customer request</h3><RequestExtras details={detail.request.details} fallback="No note provided."/></article>
        <article className="pan-card"><h3>History</h3>{detail.events.length ? <ol className="request-timeline">{detail.events.map((event, index) => <li key={`${event.createdAt}-${index}`}><b>{event.fromLabel ? `${event.fromLabel} → ` : ""}{event.toLabel}</b> <small>{when(event.createdAt)}{event.actor ? ` · ${event.actor}` : ""}</small>{event.note ? <p>{event.note}</p> : null}</li>)}</ol> : <p>No history recorded yet.</p>}</article>
        <button type="button" className="profile-text-button" onClick={() => setDetail(null)}>Close details</button>
      </div>}
    </section>}

    <p className="admin-note"><RefreshCw size={13}/> Status changes are recorded with your name and email the customer. If someone else changed an item first, refresh the encrypted queue.</p>
  </>;
}

type Tab = "inbox" | "requests" | "records" | "promotions" | "campaigns" | "contacts" | "team" | "pan" | "wallet";
const TABS: { id: Tab; label: string; icon: typeof ClipboardList; needs: Permission | "admin" | "staff" }[] = [
  { id: "inbox", label: "Inbox", icon: Bell, needs: "staff" },
  { id: "requests", label: "Requests", icon: ClipboardList, needs: "requests" },
  { id: "records", label: "Records", icon: FolderLock, needs: "records" },
  { id: "promotions", label: "Promotions", icon: TicketPercent, needs: "promotions" },
  { id: "campaigns", label: "WhatsApp", icon: Megaphone, needs: "campaigns" },
  { id: "contacts", label: "Contacts", icon: Contact, needs: "campaigns" },
  { id: "team", label: "Team", icon: UsersRound, needs: "admin" },
  { id: "pan", label: "PAN data", icon: Database, needs: "pan" },
  { id: "wallet", label: "Wallet", icon: WalletCards, needs: "wallet" },
];

const readHash = () => window.location.hash.slice(1);
const subscribeHash = (callback: () => void) => { window.addEventListener("hashchange", callback); return () => window.removeEventListener("hashchange", callback); };

/**
 * Staff workspace. Each tab needs a permission (see src/lib/permissions.ts); the owner sees all
 * of them plus Team, where staff are added and their access is set.
 */
export default function AdminDashboard({ me }: { me: { name: string; role: string; permissions: Permission[] } }) {
  const tabs = TABS.filter((tab) => tab.needs === "staff" ? true : tab.needs === "admin" ? me.role === "admin" : me.permissions.includes(tab.needs));
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let active = true;
    const check = () => secureApi<{ unread: number }>("I5x2N8kQ3wT6", { count: true }).then((result) => { if (active) setUnread(result.unread); }).catch(() => undefined);
    void check();
    const timer = window.setInterval(() => void check(), 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const [picked, setPicked] = useState<Tab | null>(null);
  const fromHash = tabs.find((tab) => tab.id === hash)?.id;
  const active = picked ?? fromHash ?? tabs[0]?.id;
  const clearUnread = useCallback(() => setUnread(0), []);
  function choose(tab: Tab) { setPicked(tab); window.history.replaceState(null, "", `#${tab}`); }
  return <main className="content-page"><SiteHeader/><section className="container admin-page">
    <span className="eyebrow eyebrow-muted"><ShieldCheck size={14}/> TEAM WORKSPACE · {me.role === "admin" ? "Owner" : "Staff"}</span>
    <h1>Hello {me.name.split(/\s+/)[0]}, <em>here’s the desk.</em></h1>
    <p>Private data, uploads and changes travel over the encrypted staff channel. You only see the areas the owner has given you.</p>
    {tabs.length ? <nav className="admin-tabs" aria-label="Admin sections">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={active === id ? "is-active" : undefined} aria-current={active === id ? "page" : undefined} onClick={() => choose(id)}><Icon size={16}/>{label}{id === "inbox" && unread > 0 && <span className="tab-badge" aria-label={`${unread} new`}>{unread > 99 ? "99+" : unread}</span>}</button>)}</nav>
      : <p className="alert alert--info">Your account doesn’t have access to any admin area yet. Ask the owner to add it in Team.</p>}
    {active === "inbox" && <InboxPanel onSeen={clearUnread}/>}
    {active === "requests" && <RequestQueue/>}
    {active === "records" && <RecordsPanel/>}
    {active === "promotions" && <PromotionsPanel canEdit/>}
    {active === "campaigns" && <CampaignsPanel/>}
    {active === "contacts" && <ContactsPanel/>}
    {active === "team" && <TeamPanel meRole={me.role}/>}
    {active === "pan" && <PanImportPanel/>}
    {active === "wallet" && <WalletCreditForm/>}
  </section></main>;
}
