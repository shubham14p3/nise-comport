"use client";

import { AdminPager } from "@/components/admin-pager";
import { FormEvent, useCallback, useEffect, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import SiteHeader from "@/components/site-header";

import { WhatsAppIcon } from "@/components/icons";


import PanSavedDetails from "@/components/pan-saved-details";
import RequestExtras from "@/components/request-extras";
import { ArrowRight, Bell, Cake, ClipboardList, Contact, Database, FolderLock, LayoutTemplate, PhoneCall, Phone, Mail, FileText, Megaphone, RefreshCw, Search, ShieldCheck, Star, TicketPercent, UsersRound, WalletCards, Images, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { secureApi, secureFile } from "@/lib/secure-api-client";




















import { STAFF_PERMISSIONS, type Permission } from "@/lib/permissions";
import Link from "next/link";

const SystemConnectionsPanel = dynamic(() => import("@/components/system-connections-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const PanImportPanel = dynamic(() => import("@/components/pan-import-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const WalletCreditForm = dynamic(() => import("@/components/wallet-credit-form"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const PromotionsPanel = dynamic(() => import("@/components/promotions-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const CampaignsPanel = dynamic(() => import("@/components/campaigns-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const ContactsPanel = dynamic(() => import("@/components/contacts-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const OutreachPanel = dynamic(() => import("@/components/outreach-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const TeamPanel = dynamic(() => import("@/components/team-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const SiteTeamPanel = dynamic(() => import("@/components/site-team-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const PaymentsPanel = dynamic(() => import("@/components/payments-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const PricesPanel = dynamic(() => import("@/components/prices-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const HardwarePanel = dynamic(() => import("@/components/hardware-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const CouponUsagePanel = dynamic(() => import("@/components/coupon-usage-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const QrScansPanel = dynamic(() => import("@/components/qr-scans-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const LegalPanel = dynamic(() => import("@/components/legal-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const MailClient = dynamic(() => import("@/components/mail-client"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const LoyaltyPanel = dynamic(() => import("@/components/loyalty-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const ChatsPanel = dynamic(() => import("@/components/chats-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const InboxPanel = dynamic(() => import("@/components/inbox-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const SiteContentPanel = dynamic(() => import("@/components/site-content-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const GalleryPanel = dynamic(() => import("@/components/gallery-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const TestimonialsPanel = dynamic(() => import("@/components/testimonials-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });
const RecordsPanel = dynamic(() => import("@/components/records-panel"), { ssr: false, loading: () => <p className="admin-loading">Loading section…</p> });

type Row = { id: string; reference: string; name: string; email: string; phone: string | null; whatsapp?: string | null; status: string; createdAt: string };
type Job = Row & { fileName: string; pageCount: number; total: string; fulfillment: string; scheduledAt: string | null };
type RequestRow = Row & { serviceName: string; fileName: string | null; officialReference: string | null; officialReferenceLabel: string | null };
type Snapshot = { jobs: Job[]; requests: RequestRow[]; counts: { jobs: number; requests: number }; filters: { status: string; q: string } };
type RequestDetail = {
  request: { id: string; reference: string; serviceName: string; status: string; statusLabel: string; details: Record<string, unknown>; createdAt: string; officialReference: string | null; officialReferenceLabel: string | null; officialReferenceSetAt: string | null };
  customer: { name: string; email: string; phone: string | null; whatsapp?: string | null; preferredContact: string };
  review: { rating: number; feedback: string | null; postedGoogleReview: boolean; createdAt: string } | null;
  events: { fromStatus: string | null; toStatus: string; fromLabel: string | null; toLabel: string; note: string | null; createdAt: string; actor: string | null }[];
};

const options = ["submitted", "reviewing", "waiting_for_customer", "awaiting_payment", "payment_received", "ready_for_pickup", "out_for_delivery", "completed", "cancelled"];
const label = (value: string) => { const text = value.replaceAll("_", " "); return text.charAt(0).toUpperCase() + text.slice(1); };
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
  const [officialRef, setOfficialRef] = useState("");
  const [officialRefLabel, setOfficialRefLabel] = useState("");
  const [officialRefSaving, setOfficialRefSaving] = useState(false);
  const [jobPage, setJobPage] = useState(0);
  const [requestPage, setRequestPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [counts, setCounts] = useState({ jobs: 0, requests: 0 });

  async function load(nextStatus = status, nextQ = q, jp = jobPage, rp = requestPage, size = pageSize) {
    setError("");
    try {
      const result = await secureApi<Snapshot>("J2w7L5pD9nV4", { status: nextStatus, q: nextQ, jobPage: jp, requestPage: rp, pageSize: size });
      setJobs(result.jobs); setRequests(result.requests); setCounts(result.counts);
      setStatus(result.filters.status); setQ(result.filters.q); setLoaded(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load the staff queue.");
      setLoaded(true);
    }
  }

  useEffect(() => {
    let active = true;
    secureApi<Snapshot>("J2w7L5pD9nV4", { status: "", q: "", jobPage: 0, requestPage: 0, pageSize: 20 })
      .then((result) => {
        if (!active) return;
        setJobs(result.jobs); setRequests(result.requests); setCounts(result.counts);
        setStatus(result.filters.status); setQ(result.filters.q); setLoaded(true);
      })
      .catch((reason) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Could not load the staff queue."); setLoaded(true);
      });
    return () => { active = false; };
  }, []);

  async function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setDetail(null); setJobPage(0); setRequestPage(0); await load(status, q, 0, 0);
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
      await load();
      if (detail?.request.id === id) await openDetail(id);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update this status."); }
    finally { setSaving(""); }
  }

  async function openDetail(id: string) {
    setDetailBusy(true); setError("");
    try {
      const result = await secureApi<RequestDetail>("B6r1K8mQ3cT9", { id });
      setDetail(result);
      setOfficialRef(result.request.officialReference ?? "");
      setOfficialRefLabel(result.request.officialReferenceLabel ?? "");
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not open request details."); }
    finally { setDetailBusy(false); }
  }

  async function saveOfficialReference() {
    if (!detail) return;
    const id = detail.request.id;
    setOfficialRefSaving(true); setError(""); setNotice("");
    try {
      await secureApi("R1k5V8nD3sJ9", {
        id, kind: "service", status: detail.request.status, expectedStatus: detail.request.status,
        officialReference: officialRef.trim(), officialReferenceLabel: officialRefLabel.trim(),
      });
      setRequests(rows => rows.map(row => row.id === id ? { ...row, officialReference: officialRef.trim() || null, officialReferenceLabel: officialRefLabel.trim() || null } : row));
      setNotice(officialRef.trim() ? "Official reference saved. The customer will be notified." : "Official reference cleared.");
      await openDetail(id);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save the official reference."); }
    finally { setOfficialRefSaving(false); }
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
      <label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Active only (default)</option><option value="history">History: cancelled &amp; completed</option>{options.map(item => <option key={item} value={item}>{label(item)}</option>)}</select></label>
      <label>Search<input value={q} onChange={event => setQ(event.target.value)} placeholder="Reference, name, email or phone" maxLength={80}/></label>
      <button className="btn btn--primary btn--sm"><Search size={14}/> Filter</button>
      {(status || q) && <button type="button" className="profile-text-button" onClick={() => { setStatus(""); setQ(""); setDetail(null); setJobPage(0); setRequestPage(0); void load("", "", 0, 0); }}>Clear</button>}
    </form>

    {error && <div className="form-alert error-alert" role="alert">{error}</div>}
    {notice && <div className="form-alert success-alert" role="status">{notice}</div>}
    {!loaded && <p>Opening encrypted staff queue…</p>}

    <section className="admin-queue"><h2><FileText size={17}/> Print orders <span>{counts.jobs}</span></h2>
      <AdminPager page={jobPage} pageSize={pageSize} total={counts.jobs} onPage={(next) => { setJobPage(next); void load(status, q, next, requestPage); }} onPageSize={(size) => { setPageSize(size); setJobPage(0); setRequestPage(0); void load(status, q, 0, 0, size); }} label="print orders"/>
      {jobs.length ? jobs.map(job => <article className="admin-row" key={job.id}><div>
        <b>{job.reference} · {job.fileName}</b>
        <small>{job.name} · {job.pageCount} printed pages · ₹{Number(job.total).toFixed(2)} · {job.fulfillment}{job.scheduledAt ? ` · for ${when(job.scheduledAt)}` : ""} · {when(job.createdAt)}</small>
        <ContactLinks name={job.name} phone={job.phone} whatsapp={job.whatsapp} email={job.email} reference={job.reference}/>
        <button type="button" className="profile-text-button" onClick={() => void openPrivateFile("H3q7M0xP6cL2", job.id)}>Open private print file</button>
      </div><select className={`status-select status-select--${job.status}`} aria-label={`Update ${job.reference} status`} value={job.status} disabled={saving === job.id} onChange={event => void update("print", job.id, job.status, event.target.value)}>{options.map(item => <option key={item} value={item}>{label(item)}</option>)}</select></article>) : loaded ? <p className="admin-empty">No print orders match.</p> : null}
      {counts.jobs > pageSize && <AdminPager page={jobPage} pageSize={pageSize} total={counts.jobs} onPage={(next) => { setJobPage(next); void load(status, q, next, requestPage); }} label="print orders"/>}
    </section>

    <section className="admin-queue"><h2><ClipboardList size={17}/> Service requests <span>{counts.requests}</span></h2>
      <AdminPager page={requestPage} pageSize={pageSize} total={counts.requests} onPage={(next) => { setRequestPage(next); void load(status, q, jobPage, next); }} onPageSize={(size) => { setPageSize(size); setJobPage(0); setRequestPage(0); void load(status, q, 0, 0, size); }} label="service requests"/>
      {requests.length ? requests.map(item => <article className="admin-row" key={item.id}><div>
        <b>{item.reference} · {item.serviceName}</b>
        <small>{item.name} · {when(item.createdAt)}{item.officialReference ? ` · ${item.officialReferenceLabel || "Official ref"}: ${item.officialReference}` : " · Official ref: not yet submitted"}</small>
        <ContactLinks name={item.name} phone={item.phone} whatsapp={item.whatsapp} email={item.email} reference={item.reference}/>
        <button type="button" className="profile-text-button" onClick={() => void openDetail(item.id)}>Read submitted request details</button>
        {item.fileName && <button type="button" className="profile-text-button" onClick={() => void openPrivateFile("V8d4K1rF7nT5", item.id)}>Open supporting file · {item.fileName}</button>}
      </div><select className={`status-select status-select--${item.status}`} aria-label={`Update ${item.reference} status`} value={item.status} disabled={saving === item.id} onChange={event => void update("service", item.id, item.status, event.target.value)}>{options.map(option => <option key={option} value={option}>{label(option)}</option>)}</select></article>) : loaded ? <p className="admin-empty">No service requests match.</p> : null}
      {counts.requests > pageSize && <AdminPager page={requestPage} pageSize={pageSize} total={counts.requests} onPage={(next) => { setRequestPage(next); void load(status, q, jobPage, next); }} label="service requests"/>}
    </section>

    {(detailBusy || detail) && <section className="admin-queue">
      <h2>Private request details</h2>
      {detailBusy && <p>Opening encrypted request details…</p>}
      {detail && <div>
        <p><b>{detail.request.serviceName}</b> · {detail.request.reference} · {detail.request.statusLabel} · {when(detail.request.createdAt)}</p>
        <p><b>{detail.customer.name}</b></p>
        <ContactLinks name={detail.customer.name} phone={detail.customer.phone} whatsapp={detail.customer.whatsapp} email={detail.customer.email} reference={detail.request.reference}/>
        <p>Preferred contact: {typeof detail.request.details.preferredContact === "string" ? detail.request.details.preferredContact : detail.customer.preferredContact}</p>
        <article className="pan-card">
          <h3>Official reference</h3>
          <p className="admin-note" style={{ margin: "0 0 10px" }}>
            {detail.request.reference} is our own internal tracking number. Once this is actually filed with the government portal or insurer, enter their official application/certificate/policy number here — the customer gets an email and WhatsApp with both numbers.
          </p>
          <div className="admin-filters" style={{ marginBottom: 0 }}>
            <label>What is it<input value={officialRefLabel} onChange={event => setOfficialRefLabel(event.target.value)} placeholder="e.g. ServicePlus application no., EPIC no., Policy no." maxLength={60}/></label>
            <label>Official reference<input value={officialRef} onChange={event => setOfficialRef(event.target.value)} placeholder="Leave blank to clear" maxLength={80}/></label>
            <button type="button" className="btn btn--primary btn--sm" disabled={officialRefSaving} onClick={() => void saveOfficialReference()}>{officialRefSaving ? "Saving…" : "Save official reference"}</button>
          </div>
          {detail.request.officialReferenceSetAt && <small>Last set {when(detail.request.officialReferenceSetAt)}</small>}
        </article>
        {detail.review && <article className="pan-card">
          <h3>Customer rating</h3>
          <p>{"★".repeat(detail.review.rating)}{"☆".repeat(5 - detail.review.rating)} ({detail.review.rating}/5) · {when(detail.review.createdAt)}</p>
          {detail.review.feedback && <p>“{detail.review.feedback}”</p>}
        </article>}
        <PanSavedDetails details={detail.request.details}/>
        <article className="pan-card"><h3>Customer request</h3><RequestExtras details={detail.request.details} fallback="No note provided."/></article>
        <article className="pan-card"><h3>History</h3>{detail.events.length ? <ol className="request-timeline">{detail.events.map((event, index) => <li key={`${event.createdAt}-${index}`}><b>{event.fromLabel ? `${event.fromLabel} → ` : ""}{event.toLabel}</b> <small>{when(event.createdAt)}{event.actor ? ` · ${event.actor}` : ""}</small>{event.note ? <p>{event.note}</p> : null}</li>)}</ol> : <p>No history recorded yet.</p>}</article>
        <button type="button" className="profile-text-button" onClick={() => setDetail(null)}>Close details</button>
      </div>}
    </section>}

    <p className="admin-note"><RefreshCw size={13}/> Status changes are recorded with your name and email the customer. If someone else changed an item first, refresh the encrypted queue.</p>
  </>;
}

type Tab = "integrations" | "inbox" | "requests" | "records" | "promotions" | "content" | "gallery" | "testimonials" | "campaigns" | "contacts" | "team" | "pan" | "wallet" | "payments" | "prices" | "hardware" | "couponuse" | "qrscans" | "legal" | "loyalty" | "chats" | "mail" | "outreach";
const TABS: { id: Tab; label: string; icon: typeof ClipboardList; needs: Permission | "admin" | "staff" }[] = [
  { id: "inbox", label: "Inbox", icon: Bell, needs: "staff" },
  { id: "mail", label: "Messages", icon: Mail, needs: "mail" },
  { id: "requests", label: "Requests", icon: ClipboardList, needs: "requests" },
  { id: "records", label: "Records", icon: FolderLock, needs: "records" },
  { id: "promotions", label: "Promotions", icon: TicketPercent, needs: "promotions" },
  { id: "couponuse", label: "Coupon use", icon: TicketPercent, needs: "promotions" },
  { id: "qrscans", label: "QR scans", icon: Megaphone, needs: "campaigns" },
  { id: "content", label: "Site content", icon: LayoutTemplate, needs: "content" },
  { id: "gallery", label: "Gallery photos", icon: Images, needs: "content" },
  { id: "testimonials", label: "Testimonials", icon: Star, needs: "content" },
  { id: "campaigns", label: "WhatsApp", icon: Megaphone, needs: "campaigns" },
  { id: "chats", label: "WhatsApp chats", icon: Megaphone, needs: "campaigns" },
  { id: "contacts", label: "Contacts", icon: Contact, needs: "campaigns" },
  { id: "outreach", label: "Birthdays & renewals", icon: Cake, needs: "staff" },
  { id: "integrations", label: "System & connections", icon: ShieldCheck, needs: "admin" },
  { id: "team", label: "Team", icon: UsersRound, needs: "admin" },
  { id: "pan", label: "PAN data", icon: Database, needs: "pan" },
  { id: "wallet", label: "Wallet", icon: WalletCards, needs: "wallet" },
  { id: "prices", label: "Service prices", icon: TicketPercent, needs: "content" },
  { id: "hardware", label: "Hardware parts", icon: Database, needs: "content" },
  { id: "loyalty", label: "Loyalty credit", icon: WalletCards, needs: "wallet" },
  { id: "legal", label: "Legal pages", icon: LayoutTemplate, needs: "content" },
  { id: "payments", label: "Payments", icon: WalletCards, needs: "requests" },
];

const NAV_SECTIONS = [
  { id: "work", title: "Work & messages", tabs: ["inbox", "mail", "requests", "chats", "payments"] },
  { id: "people", title: "Customers & records", tabs: ["records", "pan", "contacts", "wallet", "loyalty", "team"] },
  { id: "marketing", title: "Offers & campaigns", tabs: ["promotions", "couponuse", "campaigns", "outreach", "qrscans"] },
  { id: "website", title: "Website & setup", tabs: ["content", "gallery", "testimonials", "prices", "hardware", "legal", "integrations"] },
] as const;

const readHash = () => window.location.hash.slice(1);
const subscribeHash = (callback: () => void) => { window.addEventListener("hashchange", callback); return () => window.removeEventListener("hashchange", callback); };

/**
 * Staff workspace. Each tab needs a permission (see src/lib/permissions.ts); the owner sees all
 * of them plus Team, where staff are added and their access is set.
 */
export default function AdminDashboard({ me, viewAsStaff = false }: { me: { id?: string; name: string; role: string; permissions: Permission[] }; viewAsStaff?: boolean }) {
  // The owner can preview the desk as a staff member would see it (hides the owner-only Team
  // tab) via "Staff view" in the account menu, without actually losing any access — they can
  // always switch back to "Admin view". Only meaningful when me.role is "admin"; for a real
  // staff account viewAsStaff is always false and changes nothing.
  const isOwner = me.role === "admin" && !viewAsStaff;
  const effectivePermissions = viewAsStaff ? [...STAFF_PERMISSIONS] : me.permissions;
  const tabs = TABS.filter((tab) => tab.needs === "staff" ? true : tab.needs === "admin" ? isOwner : isOwner || effectivePermissions.includes(tab.needs));
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const [picked, setPicked] = useState<Tab | null>(null);
  const fromHash = tabs.find((tab) => tab.id === hash)?.id;
  const active = picked ?? fromHash ?? tabs[0]?.id;
  const [summary, setSummary] = useState<{ unread: number; waiting: number; callbacks: number } | null>(null);
  const unread = summary?.unread ?? 0;
  useEffect(() => {
    if (active !== "inbox") return;
    let alive = true;
    const check = () => secureApi<{ unread: number; waiting: number; callbacks: number }>("I5x2N8kQ3wT6", { count: true }).then((result) => { if (alive) setSummary(result); }).catch(() => undefined);
    void check();
    const poll = () => { if (document.visibilityState === "visible") void check(); };
    const timer = window.setInterval(poll, 60_000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [active]);
  const canMail = isOwner || effectivePermissions.includes("mail");
  const [mailUnread, setMailUnread] = useState(0);
  useEffect(() => {
    if (!canMail || active !== "mail") return;
    let alive = true;
    const check = () => secureApi<{ unread: number }>("Q3x8M5wT2kB7", { view: "meta" }).then((result) => { if (alive) setMailUnread(result.unread); }).catch(() => undefined);
    void check();
    const poll = () => { if (document.visibilityState === "visible") void check(); };
    const timer = window.setInterval(poll, 60_000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [canMail, active]);
  const clearUnread = useCallback(() => setSummary((value) => value ? { ...value, unread: 0 } : value), []);
  const [railOpen, setRailOpen] = useState(true);
  useEffect(() => { try { if (window.localStorage.getItem("nc-desk-rail") === "0") queueMicrotask(() => setRailOpen(false)); } catch { /* ignore */ } }, []);
  function toggleRail() { setRailOpen((open) => { try { window.localStorage.setItem("nc-desk-rail", open ? "0" : "1"); } catch { /* ignore */ } return !open; }); }
  function choose(tab: Tab) { setPicked(tab); window.history.replaceState(null, "", `#${tab}`); window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }
  const first = me.name.split(/\s+/)[0] || "there";
  const current = tabs.find((tab) => tab.id === active);
  const can = (permission: Permission) => isOwner || effectivePermissions.includes(permission);
  return <main className="page page--app profile admin-desk"><SiteHeader/>
    <section className="profile__hero">
      <div className="page-hero__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/></div>
      <div className="container profile__hero-inner">
        <span className="profile__avatar profile__avatar--staff" aria-hidden="true">{first.slice(0, 1).toUpperCase()}</span>
        <div className="profile__hello">
          <span className="eyebrow eyebrow--light"><ShieldCheck size={13}/> TEAM WORKSPACE · {isOwner ? "OWNER" : "STAFF"}</span>
          <h1>Hi {first}, <span className="grad-text grad-text--warm">here’s the desk.</span></h1>
          <p>Private data travels over the encrypted staff channel. You see only the areas the owner has given you.</p>
        </div>
        {me.role === "admin" && <div className="profile__hero-switch">
          {viewAsStaff
            ? <><span className="chip chip--soft">Viewing as staff</span><Link className="btn btn--ghost btn--sm" href="/desk">Switch to admin view</Link></>
            : <Link className="btn btn--ghost btn--sm" href="/desk?view=staff">Preview staff view</Link>}
        </div>}
      </div>
    </section>
    <div className={railOpen ? "container profile__layout" : "container profile__layout profile__layout--rail"}>
      <aside className="profile__nav" aria-label="Admin sections">
        <button type="button" className="profile__nav-toggle" onClick={toggleRail} aria-expanded={railOpen} title={railOpen ? "Hide the menu" : "Show the menu"}>{railOpen ? <PanelLeftClose size={19}/> : <PanelLeftOpen size={19}/>}<span>Hide menu</span></button>
        <nav className="admin-nav-groups">{NAV_SECTIONS.map((section) => { const visible = tabs.filter((tab) => (section.tabs as readonly string[]).includes(tab.id)); return visible.length > 0 && <details key={section.id} className="admin-nav-group" defaultOpen={(section.tabs as readonly string[]).includes(active)}>
          <summary>{section.title}<span>{visible.length}</span></summary>
          <div>{visible.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={active === id ? "is-active" : undefined} aria-current={active === id ? "page" : undefined} onClick={() => choose(id)} title={label}>
            <Icon size={18}/><span>{label}</span>{id === "inbox" && unread > 0 && <small aria-label={`${unread} new`}>{unread > 99 ? "99+" : unread}</small>}{id === "mail" && mailUnread > 0 && <small aria-label={`${mailUnread} unread`}>{mailUnread > 99 ? "99+" : mailUnread}</small>}
          </button>)}</div>
        </details>; })}</nav>
      </aside>
      <section className="profile__main admin-page" aria-live="polite" aria-label={current?.label}>
        {!tabs.length && <p className="alert alert--info">Your account doesn’t have access to any admin area yet. Ask the owner to add it in Team.</p>}
        {active === "inbox" && summary && <div className="metric-grid">
          {can("requests") && <AdminMetric tone="blue" icon={<ClipboardList size={22}/>} number={summary.waiting} label="Requests waiting" onClick={() => choose("requests")}/>}
          {can("requests") && <AdminMetric tone="pink" icon={<PhoneCall size={22}/>} number={summary.callbacks} label="People to call back" onClick={() => document.querySelector(".inbox__leads")?.scrollIntoView({ behavior: "smooth" })}/>}
          <AdminMetric tone="violet" icon={<Bell size={22}/>} number={summary.unread} label="New in the inbox" onClick={() => document.querySelector(".inbox__feed")?.scrollIntoView({ behavior: "smooth" })}/>
          {can("records") && <AdminMetric tone="green" icon={<FolderLock size={22}/>} number="Search" label="Customer records" onClick={() => choose("records")}/>}
        </div>}
        {active === "inbox" && <InboxPanel onSeen={clearUnread}/>}
        {active === "mail" && <MailClient mode="staff" onUnread={setMailUnread}/>}
        {active === "requests" && <RequestQueue/>}
        {active === "records" && <RecordsPanel/>}
        {active === "promotions" && <PromotionsPanel canEdit/>}
        {active === "content" && <SiteContentPanel/>}
        {active === "gallery" && <GalleryPanel/>}
        {active === "testimonials" && <TestimonialsPanel/>}
        {active === "campaigns" && <CampaignsPanel/>}
        {active === "contacts" && <ContactsPanel/>}
        {active === "outreach" && <OutreachPanel/>}
        {active === "chats" && <ChatsPanel/>}
        {active === "prices" && <PricesPanel/>}
        {active === "hardware" && <HardwarePanel/>}
        {active === "couponuse" && <CouponUsagePanel/>}
        {active === "qrscans" && <QrScansPanel/>}
        {active === "legal" && <LegalPanel/>}
        {active === "loyalty" && <LoyaltyPanel/>}
        {active === "payments" && <PaymentsPanel/>}
        {active === "integrations" && <SystemConnectionsPanel/>}
        {active === "team" && <><TeamPanel meRole={me.role} meId={me.id}/><SiteTeamPanel/></>}
        {active === "pan" && <PanImportPanel/>}
        {active === "wallet" && <WalletCreditForm canCorrect={isOwner}/>}
      </section>
    </div>
  </main>;
}

function AdminMetric({ icon, number, label, tone, onClick }: { icon: React.ReactNode; number: React.ReactNode; label: string; tone: string; onClick: () => void }) {
  return <button type="button" className={`metric tone-${tone}`} onClick={onClick}><span className="metric__icon">{icon}</span><span><b>{number}</b><small>{label}</small></span><ArrowRight size={18}/></button>;
}

const prettyPhone = (phone: string) => phone.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");
/** One-tap ways to reach the customer: call, WhatsApp (with the reference filled in) and email. */
function ContactLinks({ name, phone, whatsapp, email, reference }: { name: string; phone: string | null; whatsapp?: string | null; email: string; reference: string }) {
  const digits = (whatsapp || phone)?.replace(/\D/g, "") ?? "";
  return <span className="contact-links">
    {phone && <a href={`tel:${phone}`}><Phone size={13}/>{prettyPhone(phone)}</a>}
    {digits.length >= 10 && <a className="contact-links__wa" href={`https://wa.me/${digits}?text=${encodeURIComponent(`Namaste ${name.split(/\s+/)[0]}, NISE COMPORT here about your request ${reference}.`)}`} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={13}/>{whatsapp ? prettyPhone(whatsapp) : "WhatsApp"}</a>}
    <a href={`mailto:${email}?subject=${encodeURIComponent(`Your request ${reference}`)}`}><Mail size={13}/>{email}</a>
  </span>;
}
