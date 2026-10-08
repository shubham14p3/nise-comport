"use client";

import { serviceName, statusText } from "@/lib/i18n-forms";
import { useLocale } from "@/lib/use-locale";
import SiteHeader from "@/components/site-header";
import AddressManager from "@/components/address-manager";
import AccountSecurityPanel from "@/components/account-security-panel";
import PanSavedDetails from "@/components/pan-saved-details";
import RequestExtras from "@/components/request-extras";
import CancelRequestButton from "@/components/cancel-request-button";
import VoucherBoard from "@/components/voucher-board";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  ArrowRight, Check, CircleHelp, FileText, Gift, History, LayoutDashboard,
  MapPin, Plus, Printer, ShieldCheck, UserRound, WalletCards,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { secureApi } from "@/lib/secure-api-client";
import { isPlaceholderEmail } from "@/lib/record-account-email";
import { RECORDS_LINKED_EVENT } from "@/components/link-records";
import { whatsappHref } from "@/lib/public-contact";
import type { CustomerVoucher } from "@/lib/promo-view";

type RequestItem = { reference: string; serviceSlug: string; serviceName: string; status: string; description: string; createdAt: string };
type WalletItem = { amount: string; kind: string; description: string; reference: string | null; createdAt: string };
type PrintItem = { reference: string; status: string; total: string; fulfillment: string; createdAt: string };
type ProfileUser = {
  name: string; email: string; phone: string | null; whatsapp?: string | null; emailVerified: boolean;
  city: string; state: string; postalCode: string; profileSummary: string;
  preferredContact: "email" | "phone" | "whatsapp";
  updatedAt?: string;
};
type Coupon = CustomerVoucher;
type Snapshot = {
  user: ProfileUser; requests: RequestItem[]; jobs: PrintItem[]; wallet: WalletItem[];
  coupons: Coupon[]; activeSessions: number; openWork: number;
};
const DEMO_SNAPSHOT: Snapshot = {
  user: {
    name: "Demo Customer", email: "demo@nisecomport.test", phone: null, emailVerified: false,
    city: "", state: "", postalCode: "", profileSummary: "", preferredContact: "email", updatedAt: "",
  },
  requests: [], jobs: [], wallet: [], coupons: [], activeSessions: 1, openWork: 0,
};
type RequestDetail = {
  request: {
    reference: string; serviceSlug: string; serviceName: string; status: string; statusLabel: string;
    details: Record<string, unknown>; createdAt: string; cancellable: boolean;
  };
  files: { name: string; createdAt: string }[];
  events: { toStatus: string; label: string; createdAt: string }[];
};
type Section = "overview" | "requests" | "history" | "prints" | "wallet" | "vouchers" | "addresses" | "profile" | "security" | "help";

const navigation: { id: Section; label: string; icon: typeof UserRound }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "requests", label: "My requests", icon: FileText },
  { id: "history", label: "Request history", icon: History },
  { id: "prints", label: "Print orders", icon: Printer },
  { id: "wallet", label: "Wallet", icon: WalletCards },
  { id: "vouchers", label: "Vouchers & offers", icon: Gift },
  { id: "addresses", label: "Saved addresses", icon: MapPin },
  { id: "profile", label: "Profile details", icon: UserRound },
  { id: "security", label: "Sign-in & privacy", icon: ShieldCheck },
  { id: "help", label: "Get help", icon: CircleHelp },
];
const closedStatuses = new Set(["completed", "rejected", "cancelled", "closed"]);
const dateLabel = (value: string) => new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const dateTime = (value: string) => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
const rupees = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);

type PastRecord = { id: string; serviceLabel: string; recordDate: string | null; statusLabel: string; statusNote: string | null; fields: { label: string; value: string }[] };

/** Records made before, linked to this account (completed by the centre). One card per service, all its records inside. */
function PastRecordList({ rows }: { rows: PastRecord[] }) {
  const groups = new Map<string, PastRecord[]>();
  for (const row of rows) groups.set(row.serviceLabel, [...(groups.get(row.serviceLabel) ?? []), row]);
  return <div className="link-records__list"><h3>Past records linked to your account</h3>
    <ul className="link-records__items">{[...groups.entries()].map(([service, items]) => <li key={service}>
      <div className="link-records__head"><b>{service}</b><span className="muted">{items.length === 1 ? "1 record" : `${items.length} records`}</span></div>
      {items.map((row) => <div className="link-records__record" key={row.id}>
        <span className="status-pill">{row.statusLabel}</span>
        <dl>{row.fields.map((field) => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>
        {row.statusNote ? <p className="link-records__note">{row.statusNote}</p> : null}
      </div>)}
    </li>)}</ul>
  </div>;
}

/** Records made before, read from the server. */
const fetchPastRecords = () => secureApi<{ records: PastRecord[] }>("Cl4imMine5Rz", {}).then((value) => value.records);

export default function ProfileDashboard({ demoMode = false }: { demoMode?: boolean }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(demoMode ? DEMO_SNAPSHOT : null);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoadError("");
    try { setSnapshot(await secureApi<Snapshot>("P8a2N5dK1vR7")); }
    catch (error) { setLoadError(error instanceof Error ? error.message : "Could not load your private workspace."); }
  }, []);

  useEffect(() => {
    if (demoMode) return;
    let active = true;
    void secureApi<Snapshot>("P8a2N5dK1vR7")
      .then((result) => {
        if (!active) return;
        setSnapshot(result);
        setLoadError("");
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "Could not load your private workspace.");
      });
    return () => { active = false; };
  }, [demoMode]);

  if (!snapshot) {
    return <main className="page page--app profile"><SiteHeader/><div className="container profile__loading">
      <div className={loadError ? "profile__loading-card" : "profile__loading-card is-busy"}><span className="spinner" aria-hidden="true"/><h1>{loadError ? "We couldn’t open your account" : "Opening your account…"}</h1><p>{loadError || "Loading your requests and details over an encrypted connection."}</p>
        {loadError && <button className="btn btn--primary" type="button" onClick={() => void load()}>Try again</button>}</div>
    </div></main>;
  }

  return <ProfileWorkspace snapshot={snapshot} reload={demoMode ? async () => undefined : load} demoMode={demoMode}/>;
}

const subscribeHash = (callback: () => void) => { window.addEventListener("hashchange", callback); return () => window.removeEventListener("hashchange", callback); };
/** Sections open from links like /profile#requests (the hash never reaches the server). */
function sectionFromUrl(): Section {
  const value = window.location.hash.slice(1);
  return navigation.some((item) => item.id === value) ? value as Section : "overview";
}

function ProfileWorkspace({ snapshot, reload, demoMode }: { snapshot: Snapshot; reload: () => Promise<void>; demoMode: boolean }) {
  const [pastRecords, setPastRecords] = useState<PastRecord[] | null>(demoMode ? [] : null);
  // Past records are read once; they are read again only after a link is approved.
  useEffect(() => {
    if (demoMode) return;
    void (async () => {
      try { setPastRecords(await fetchPastRecords()); }
      catch { setPastRecords([]); }
    })();
    const again = () => {
      void (async () => {
        try { setPastRecords(await fetchPastRecords()); }
        catch { setPastRecords([]); }
      })();
    };
    window.addEventListener(RECORDS_LINKED_EVENT, again);
    return () => window.removeEventListener(RECORDS_LINKED_EVENT, again);
  }, [demoMode]);
  const locale = useLocale();
  const { user, requests, jobs, wallet, coupons, activeSessions, openWork } = snapshot;
  const urlSection = useSyncExternalStore(subscribeHash, sectionFromUrl, () => "overview" as Section);
  const [chosenSection, setSection] = useState<Section | null>(null);
  const section = chosenSection ?? urlSection;
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(user.whatsapp ?? "");
  const [city, setCity] = useState(user.city);
  const [state, setState] = useState(user.state);
  const [postalCode, setPostalCode] = useState(user.postalCode);
  const [profileSummary, setProfileSummary] = useState(user.profileSummary);
  const [preferredContact, setPreferredContact] = useState<ProfileUser["preferredContact"]>(user.preferredContact);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string>>({});
  const [updatedAt, setUpdatedAt] = useState(user.updatedAt ?? "");
  const [selectedRequest, setSelectedRequest] = useState("");
  const [requestDetail, setRequestDetail] = useState<RequestDetail | null>(null);
  const [requestDetailError, setRequestDetailError] = useState("");
  const [requestDetailBusy, setRequestDetailBusy] = useState(false);

  const firstName = user.name.trim().split(/\s+/)[0];
  const balance = wallet.reduce((total, entry) => total + (entry.kind.toLowerCase() === "debit" ? -1 : 1) * Number(entry.amount), 0);
  const activeRequests = requests.filter((item) => !closedStatuses.has(item.status.toLowerCase()));
  const historyRequests = requests.filter((item) => closedStatuses.has(item.status.toLowerCase()));
  const focusRequest = requests.find((item) => item.reference === selectedRequest);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setProfileBusy(true); setProfileMessage(""); setProfileError(""); setProfileFieldErrors({});
    if (demoMode) { setProfileBusy(false); setProfileMessage("Demo preview only — these changes are temporary and are not sent to the server."); return; }
    try {
      const result = await secureApi<{ user?: { phone?: string | null; updatedAt?: string }; fields?: Record<string, string> }>("T2f9K4pW7cL1", {
        name, phone, whatsapp, city, state, postalCode, profileSummary, preferredContact, ...(updatedAt ? { expectedUpdatedAt: updatedAt } : {}),
      });
      if (result.user?.phone !== undefined) setPhone(result.user.phone ?? "");
      if (result.user?.updatedAt) setUpdatedAt(result.user.updatedAt);
      setProfileMessage("Your profile details have been saved.");
      await reload();
    } catch (reason) {
      const body = reason && typeof reason === "object" && "body" in reason ? (reason as { body?: { fields?: Record<string, string> } }).body : undefined;
      if (body?.fields) setProfileFieldErrors(body.fields);
      setProfileError(reason instanceof Error ? reason.message : "Could not update your profile.");
    } finally { setProfileBusy(false); }
  }

  function openSection(next: Section) {
    setSection(next);
    if (next !== "requests") { setSelectedRequest(""); setRequestDetail(null); setRequestDetailError(""); }
    try { window.history.replaceState(window.history.state, "", next === "overview" ? "/profile" : `/profile#${next}`); } catch { /* ignore */ }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function viewRequest(reference: string) {
    openSection("requests"); setSelectedRequest(reference); setRequestDetail(null); setRequestDetailError(""); setRequestDetailBusy(true);
    try { setRequestDetail(await secureApi<RequestDetail>("F4m9C1xT6qH3", { reference })); }
    catch (error) { setRequestDetailError(error instanceof Error ? error.message : "Could not open this request."); }
    finally { setRequestDetailBusy(false); }
  }

  const statusClass = (status: string) => `status-pill status-pill--${closedStatuses.has(status.toLowerCase()) ? status.toLowerCase() === "completed" ? "done" : "closed" : "progress"}`;

  function RequestRows({ rows }: { rows: RequestItem[] }) {
    if (!rows.length) return <EmptyState icon={<FileText size={22}/>} title="No requests here yet" text="Send your first request in four quick steps. Its reference number and live status will appear here." action={<Link className="btn btn--primary" href="/request">Start a request <ArrowRight size={16}/></Link>} />;
    return <div className="record-list">{rows.map((item) => <article className="record" key={item.reference}>
      <span className="record__icon"><FileText size={20}/></span>
      <div className="record__body"><b>{serviceName(item.serviceSlug, item.serviceName, locale)}</b><small>{item.reference} · {dateLabel(item.createdAt)}</small>{item.description && <p>{item.description}</p>}</div>
      <span className={statusClass(item.status)}>{statusText(item.status, locale)}</span>
      <button className="btn btn--ghost btn--sm" type="button" onClick={() => void viewRequest(item.reference)}>Details <ArrowRight size={15}/></button>
    </article>)}</div>;
  }

  function EmptyState({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
    return <div className="empty-state"><span className="empty-state__icon">{icon}</span><h3>{title}</h3><p>{text}</p>{action}</div>;
  }

  function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
    return <div className="panel-head"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>;
  }

  const completion = [name, phone, city, state, postalCode].filter((value) => value.trim()).length;

  const content = (() => {
    switch (section) {
      case "overview": return <>
        <div className="metric-grid">
          <Metric icon={<FileText size={20}/>} number={activeRequests.length} label="Open requests" tone="blue" onClick={() => openSection("requests")}/>
          <Metric icon={<Printer size={20}/>} number={jobs.length} label="Print orders" tone="violet" onClick={() => openSection("prints")}/>
          <Metric icon={<WalletCards size={20}/>} number={rupees(balance)} label="Wallet balance" tone="green" onClick={() => openSection("wallet")}/>
          <Metric icon={<Gift size={20}/>} number={coupons.filter((coupon) => coupon.live && !coupon.used).length} label="Codes you can use" tone="pink" onClick={() => openSection("vouchers")}/>
        </div>
        <div className="panel"><SectionHeading eyebrow="RECENT ACTIVITY" title="Your latest requests" text="Open any request to see what you sent and its current status."/><RequestRows rows={requests.slice(0, 3)}/></div>
        <div className="quick-grid">
          <Link href="/request" className="quick tone-blue"><Plus size={20}/><span><b>Start a request</b><small>4 quick steps, any service.</small></span><ArrowRight size={18}/></Link>
          <Link href="/print" className="quick tone-cyan"><Printer size={20}/><span><b>Print from your phone</b><small>Upload, pick pages, collect.</small></span><ArrowRight size={18}/></Link>
          <button type="button" onClick={() => openSection("profile")} className="quick tone-violet"><UserRound size={20}/><span><b>Complete your profile</b><small>{completion}/5 details added.</small></span><ArrowRight size={18}/></button>
          <button type="button" onClick={() => openSection("addresses")} className="quick tone-green"><MapPin size={20}/><span><b>Saved addresses</b><small>For delivery and doorstep help.</small></span><ArrowRight size={18}/></button>
        </div>
      </>;
      case "requests": return <div className="panel"><SectionHeading eyebrow="IN PROGRESS" title="My service requests" text="Private request details load over the encrypted account connection and never appear in the page address."/>
        {focusRequest && <article className="request-detail"><div className="request-detail__top"><div><span className="eyebrow">REQUEST · {focusRequest.reference}</span><h3>{focusRequest.serviceName}</h3><small>Submitted {dateLabel(focusRequest.createdAt)}</small></div><span className={statusClass(focusRequest.status)}>{focusRequest.status.replaceAll("_", " ")}</span></div>
          {requestDetailBusy && <p className="muted">Opening private request details…</p>}
          {requestDetailError && <div className="alert alert--error">{requestDetailError}</div>}
          {requestDetail && <>
            <PanSavedDetails details={requestDetail.request.details}/>
            <RequestExtras details={requestDetail.request.details} fallback={focusRequest.description}/>
            {requestDetail.events.length > 0 && <ol className="timeline">{requestDetail.events.map((event, index) => <li key={`${event.createdAt}-${index}`}><b>{event.label}</b><small>{dateTime(event.createdAt)}</small></li>)}</ol>}
            {requestDetail.files.length > 0 && <div className="request-detail__files"><b>Supporting documents</b><ul>{requestDetail.files.map((file, index) => <li key={`${file.createdAt}-${index}`}><FileText size={16}/>{file.name} <small>· {dateLabel(file.createdAt)}</small></li>)}</ul></div>}
            <div className="request-detail__actions">{requestDetail.request.serviceSlug !== "other" && <Link className="btn btn--ghost btn--sm" href={`/services/${requestDetail.request.serviceSlug}`}>Service checklist <ArrowRight size={15}/></Link>}<a className="btn btn--wa btn--sm" href={whatsappHref(`Hi NISE COMPORT, about my request ${requestDetail.request.reference}`)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={16}/>Ask on WhatsApp</a>{requestDetail.request.cancellable && <CancelRequestButton reference={requestDetail.request.reference} onDone={async () => { setSelectedRequest(""); setRequestDetail(null); await reload(); }}/>}</div>
          </>}
        </article>}
        <RequestRows rows={activeRequests}/></div>;
      case "history": return <div className="panel"><SectionHeading eyebrow="COMPLETED & CLOSED" title="Request history" text="Completed, cancelled and otherwise closed requests, and past records linked to your account."/>
        {pastRecords && pastRecords.length > 0 && <PastRecordList rows={pastRecords}/>}
        <RequestRows rows={historyRequests}/>
        {!historyRequests.length && requests.length > 0 && <p className="muted">Your requests are still in progress. They move here once the team closes them.</p>}
        {!historyRequests.length && requests.length === 0 && pastRecords !== null && pastRecords.length === 0 && <p className="muted">No completed requests or linked records yet.</p>}
      </div>;
      case "prints": return <div className="panel"><SectionHeading eyebrow="DOCUMENT SERVICES" title="Print orders" text="Your print requests, pickup or delivery choice, the estimate and the latest status." />{jobs.length ? <div className="record-list">{jobs.map((job) => <article className="record" key={job.reference}><span className="record__icon"><Printer size={20}/></span><div className="record__body"><b>Print order · {job.fulfillment}</b><small>{job.reference} · {dateLabel(job.createdAt)}</small><p>Estimate: {rupees(Number(job.total))}</p></div><span className={statusClass(job.status)}>{statusText(job.status, locale)}</span></article>)}</div> : <EmptyState icon={<Printer size={22}/>} title="No print orders yet" text="Upload a document, choose options and request an estimate. The team confirms the final cost before printing." action={<Link href="/print" className="btn btn--primary">Start a print request <ArrowRight size={16}/></Link>}/>}</div>;
      case "wallet": return <div className="panel"><SectionHeading eyebrow="CUSTOMER REWARDS" title="Wallet & credits" text="Credits and adjustments posted by the team, with date and reference."/><div className="wallet-hero"><span>AVAILABLE BALANCE</span><strong>{rupees(balance)}</strong><small>Top-up and online wallet payment are not enabled.</small></div>{wallet.length ? <div className="ledger">{wallet.map((entry, index) => <article key={`${entry.createdAt}-${index}`}><div><b>{entry.description}</b><small>{dateLabel(entry.createdAt)}{entry.reference ? ` · ${entry.reference}` : ""}</small></div><strong className={entry.kind.toLowerCase() === "debit" ? "is-debit" : "is-credit"}>{entry.kind.toLowerCase() === "debit" ? "−" : "+"}{rupees(Number(entry.amount))}</strong></article>)}</div> : <EmptyState icon={<WalletCards size={22}/>} title="No wallet activity yet" text="Eligible promotional credits or adjustments will appear here."/>}</div>;
      case "vouchers": return <div className="panel"><SectionHeading eyebrow="SAVINGS" title="Vouchers & offers" text="Your ₹50 welcome coupon and the festival and Team India codes live today. Each code can be used once." /><VoucherBoard vouchers={coupons}/></div>;
      case "addresses": return <div className="panel"><SectionHeading eyebrow="DELIVERY & CONTACT" title="Saved addresses" text="Search with Google, use your current location or type it. Used for print delivery and doorstep help."/>{demoMode ? <EmptyState icon={<MapPin size={22}/>} title="Demo preview" text="Saved addresses are available after creating a real account."/> : <AddressManager/>}</div>;
      case "profile": return <div className="panel"><SectionHeading eyebrow="PERSONAL INFORMATION" title="Your profile details" text="Keep your contact details current. They prefill your request forms."/>
        <div className="progress-card"><div><b>Profile {Math.round((completion / 5) * 100)}% complete</b><small>{completion}/5 details added</small></div><span className="progress"><i style={{ width: `${(completion / 5) * 100}%` }}/></span></div>
        <form className="form-grid profile-form" onSubmit={saveProfile}>
          <label className="field"><span className="field__label">Full name</span><input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)}/></label>
          <label className="field"><span className="field__label">Email address</span><input value={user.email} readOnly/><span className="field__hint">Change it under “Sign-in &amp; privacy”.</span></label>
          <label className="field"><span className="field__label">Mobile number</span><input type="tel" inputMode="tel" maxLength={20} autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} aria-invalid={Boolean(profileFieldErrors.phone)}/><span className={profileFieldErrors.phone ? "field__error" : "field__hint"}>{profileFieldErrors.phone ?? "Needed for phone or WhatsApp updates."}</span></label>
          <label className="field"><span className="field__label">WhatsApp number <em>if different</em></span><input type="tel" inputMode="tel" maxLength={20} autoComplete="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="Same as mobile" aria-invalid={Boolean(profileFieldErrors.whatsapp)}/><span className={profileFieldErrors.whatsapp ? "field__error" : "field__hint"}>{profileFieldErrors.whatsapp ?? "We send updates and offers here only if you choose WhatsApp."}</span></label>
          <label className="field"><span className="field__label">Preferred update channel</span><select value={preferredContact} onChange={(event) => setPreferredContact(event.target.value as ProfileUser["preferredContact"])}><option value="email">Email</option><option value="phone">Phone call</option><option value="whatsapp">WhatsApp</option></select>{profileFieldErrors.preferredContact && <span className="field__error">{profileFieldErrors.preferredContact}</span>}</label>
          <label className="field"><span className="field__label">City</span><input maxLength={100} autoComplete="address-level2" value={city} onChange={(event) => setCity(event.target.value)}/></label>
          <label className="field"><span className="field__label">State</span><input maxLength={100} autoComplete="address-level1" value={state} onChange={(event) => setState(event.target.value)}/></label>
          <label className="field"><span className="field__label">PIN code</span><input inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} autoComplete="postal-code" value={postalCode} onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 6))} aria-invalid={Boolean(profileFieldErrors.postalCode)}/>{profileFieldErrors.postalCode && <span className="field__error">{profileFieldErrors.postalCode}</span>}</label>
          <span className="field field--spacer" aria-hidden="true"/>
          <label className="field field--full"><span className="field__label">A note for our team <em>optional</em></span><textarea maxLength={500} rows={4} value={profileSummary} onChange={(event) => setProfileSummary(event.target.value)}/><span className="field__hint">{profileSummary.length}/500 · Don’t enter passwords, OTPs or identity numbers.</span></label>
          {profileError && <div className="alert alert--error field--full">{profileError}</div>}{profileMessage && <div className="alert alert--success field--full">{profileMessage}</div>}
          <div className="form-actions field--full"><button className="btn btn--primary btn--lg" disabled={profileBusy}>{profileBusy ? "Saving…" : "Save profile details"}</button></div>
        </form></div>;
      case "security": return <div className="panel"><SectionHeading eyebrow="ACCOUNT ACCESS" title="Sign-in & privacy" text="Manage your password, sign-in email and devices. Keep access codes private."/><AccountSecurityPanel email={user.email} emailVerified={user.emailVerified} activeSessions={activeSessions} openWork={openWork} demoMode={demoMode}/></div>;
      case "help": return <div className="panel"><SectionHeading eyebrow="LOCAL SUPPORT" title="Need help with your account?" text="Contact the Kharangajhar team about a request status or your details."/><div className="help-card"><CircleHelp size={26}/><div><b>NISE COMPORT · Kharangajhar, Telco Colony</b><p>Ground Floor, Singh Building, Shop No-3, Hanuman Mandir Road, Kharangajhar, Telco Colony, Jamshedpur, Jharkhand 831004</p><div className="help-card__actions"><a className="btn btn--wa" href={whatsappHref("Hi NISE COMPORT, I need help with my account.")} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={17}/>WhatsApp</a><a className="btn btn--ghost" href="tel:+919771219893">Call +91 97712 19893</a><Link className="btn btn--ghost" href="/contact">Contact page</Link></div></div></div></div>;
    }
  })();

  const current = navigation.find((item) => item.id === section);

  return <main className="page page--app profile"><SiteHeader/>
    <section className="profile__hero">
      <div className="page-hero__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/></div>
      <div className="container profile__hero-inner">
        <span className="profile__avatar" aria-hidden="true">{firstName.slice(0, 1).toUpperCase()}</span>
        <div className="profile__hello"><span className="eyebrow eyebrow--light">MY ACCOUNT</span><h1>Hi {firstName}, <span className="grad-text grad-text--warm">good to see you.</span></h1><p>{isPlaceholderEmail(user.email) ? <span>No email added yet. Add one in Profile details.</span> : <>{user.email} · <span className={user.emailVerified ? "verified" : "unverified"}><ShieldCheck size={15}/> Email {user.emailVerified ? "verified" : "not verified"}</span></>}</p></div>
        <Link className="btn btn--primary btn--lg profile__cta" href="/request"><Plus size={18}/>New request</Link>
      </div>
    </section>
    <div className="container profile__layout">
      <aside className="profile__nav" aria-label="Account sections">
        <nav>{navigation.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={section === id ? "is-active" : undefined} aria-current={section === id ? "page" : undefined} onClick={() => openSection(id)}><Icon size={19}/><span>{label}</span>{id === "requests" && activeRequests.length > 0 && <small>{activeRequests.length}</small>}</button>)}</nav>
      </aside>
      <section className="profile__main" aria-live="polite" aria-label={current?.label}>{content}
        <p className="fine"><Check size={15}/> Account data loads over an encrypted connection. Final government and provider decisions rest with the relevant authority.</p>
      </section>
    </div>
  </main>;
}

function Metric({ icon, number, label, tone, onClick }: { icon: React.ReactNode; number: React.ReactNode; label: string; tone: string; onClick: () => void }) {
  return <button type="button" className={`metric tone-${tone}`} onClick={onClick}><span className="metric__icon">{icon}</span><span><b>{number}</b><small>{label}</small></span><ArrowRight size={18}/></button>;
}
