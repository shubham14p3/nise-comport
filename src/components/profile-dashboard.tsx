"use client";

import SiteHeader from "@/components/site-header";
import AddressManager from "@/components/address-manager";
import AccountSecurityPanel from "@/components/account-security-panel";
import PanSavedDetails from "@/components/pan-saved-details";
import CancelRequestButton from "@/components/cancel-request-button";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowRight, Bell, Check, CircleHelp, FileText, Gift, History,
  MapPin, Printer, ShieldCheck, UserRound, WalletCards,
} from "lucide-react";
import { secureApi } from "@/lib/secure-api-client";

type RequestItem = { reference: string; serviceSlug: string; serviceName: string; status: string; description: string; createdAt: string };
type WalletItem = { amount: string; kind: string; description: string; reference: string | null; createdAt: string };
type PrintItem = { reference: string; status: string; total: string; fulfillment: string; createdAt: string };
type ProfileUser = {
  name: string; email: string; phone: string | null; emailVerified: boolean;
  city: string; state: string; postalCode: string; profileSummary: string;
  preferredContact: "email" | "phone" | "whatsapp";
  updatedAt?: string;
};
type Coupon = { code: string; discountType: string; discountValue: string; minimumAmount: string; expiresAt: string | null };
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
  { id: "overview", label: "Overview", icon: UserRound },
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

export default function ProfileDashboard({ demoMode = false }: { demoMode?: boolean }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(demoMode ? DEMO_SNAPSHOT : null);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoadError("");
    try { setSnapshot(await secureApi<Snapshot>("P8a2N5dK1vR7")); }
    catch (error) { setLoadError(error instanceof Error ? error.message : "Could not load your private workspace."); }
  }, []);

  useEffect(() => { if (!demoMode) void load(); }, [demoMode, load]);

  if (!snapshot) {
    return <main className="profile-page"><SiteHeader/><div className="container profile-container">
      <header className="profile-page-heading"><div><span className="eyebrow eyebrow-muted">CUSTOMER ACCOUNT</span><h1>Your private<br/><em>workspace.</em></h1><p>{loadError || "Opening your encrypted account workspace…"}</p></div></header>
      {loadError && <button className="button button-green" type="button" onClick={() => void load()}>Try again</button>}
    </div></main>;
  }

  return <ProfileWorkspace snapshot={snapshot} reload={demoMode ? async () => undefined : load} demoMode={demoMode}/>;
}

function ProfileWorkspace({ snapshot, reload, demoMode }: { snapshot: Snapshot; reload: () => Promise<void>; demoMode: boolean }) {
  const { user, requests, jobs, wallet, coupons, activeSessions, openWork } = snapshot;
  const [section, setSection] = useState<Section>("overview");
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
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
        name, phone, city, state, postalCode, profileSummary, preferredContact, ...(updatedAt ? { expectedUpdatedAt: updatedAt } : {}),
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
  }

  async function viewRequest(reference: string) {
    setSection("requests"); setSelectedRequest(reference); setRequestDetail(null); setRequestDetailError(""); setRequestDetailBusy(true);
    try { setRequestDetail(await secureApi<RequestDetail>("F4m9C1xT6qH3", { reference })); }
    catch (error) { setRequestDetailError(error instanceof Error ? error.message : "Could not open this request."); }
    finally { setRequestDetailBusy(false); }
  }

  function RequestRows({ rows }: { rows: RequestItem[] }) {
    if (!rows.length) return <EmptyState icon={<FileText size={20}/>} title="No requests here yet" text="When you submit a service enquiry, its reference and staff updates will appear in this section." action={<Link className="button button-green" href="/services">Browse service guides <ArrowRight size={15}/></Link>} />;
    return <div className="profile-record-list">{rows.map((item) => <article className="profile-record" key={item.reference}>
      <span className="request-icon"><FileText size={18}/></span>
      <div className="profile-record-copy"><b>{item.serviceName}</b><small>{item.reference} · {dateLabel(item.createdAt)}</small><p>{item.description || "You did not add a note to this request."}</p></div>
      <span className={`request-status status-${item.status.toLowerCase().replaceAll(" ", "-")}`}><i/>{item.status}</span>
      <button className="profile-text-button" type="button" onClick={() => void viewRequest(item.reference)}>View details <ArrowRight size={14}/></button>
    </article>)}</div>;
  }

  function EmptyState({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
    return <div className="profile-empty-state"><span>{icon}</span><h3>{title}</h3><p>{text}</p>{action}</div>;
  }

  function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
    return <div className="profile-panel-heading"><span className="eyebrow eyebrow-muted">{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>;
  }

  const content = (() => {
    switch (section) {
      case "overview": return <>
        <section className="profile-welcome-card"><div><span className="eyebrow">YOUR CUSTOMER SPACE</span><h2>Good to see you,<br/><em>{firstName}.</em></h2><p>See your service progress, update your details, or start with a local service guide.</p><Link href="/services" className="button button-cream">Browse services <ArrowRight size={15}/></Link></div><div className="profile-welcome-art"><FileText size={47} strokeWidth={1}/><i/><i/><i/></div></section>
        <section className="profile-metric-grid"><Metric icon={<FileText size={18}/>} number={activeRequests.length} label="Open requests"/><Metric icon={<Printer size={18}/>} number={jobs.length} label="Print orders"/><Metric icon={<WalletCards size={18}/>} number={rupees(balance)} label="Wallet balance"/></section>
        <div className="profile-panel profile-overview-panel"><SectionHeading eyebrow="RECENT ACTIVITY" title="Your latest requests" text="Open any request to see the information you submitted and its current status."/><RequestRows rows={requests.slice(0, 3)}/></div>
        <div className="profile-quick-links"><Link href="/pan"><FileText size={17}/><span><b>PAN assistance</b><small>Guides, common request form and official tracking.</small></span><ArrowRight size={15}/></Link><button onClick={() => openSection("profile")}><UserRound size={17}/><span><b>Complete your profile</b><small>Add a phone number and local contact details.</small></span><ArrowRight size={15}/></button><button onClick={() => openSection("addresses")}><MapPin size={17}/><span><b>Manage saved addresses</b><small>Keep addresses for print pickup or delivery.</small></span><ArrowRight size={15}/></button><Link href="/print"><Printer size={17}/><span><b>Request a print estimate</b><small>Choose your pages and options before sending it.</small></span><ArrowRight size={15}/></Link></div>
      </>;
      case "requests": return <div className="profile-panel"><SectionHeading eyebrow="IN PROGRESS" title="My service requests" text="Private request details load through the encrypted account channel and are not placed in the page URL."/>
        {focusRequest && <article className="selected-request-card"><div className="selected-request-top"><div><span className="eyebrow eyebrow-muted">REQUEST DETAILS · {focusRequest.reference}</span><h3>{focusRequest.serviceName}</h3><small>Submitted {dateLabel(focusRequest.createdAt)}</small></div><span className={`request-status status-${focusRequest.status.toLowerCase().replaceAll(" ", "-")}`}><i/>{focusRequest.status}</span></div>
          {requestDetailBusy && <p>Opening private request details…</p>}
          {requestDetailError && <div className="form-alert error-alert">{requestDetailError}</div>}
          {requestDetail && <>
            <PanSavedDetails details={requestDetail.request.details}/>
            <p>{typeof requestDetail.request.details.description === "string" ? requestDetail.request.details.description : focusRequest.description || "No additional note was submitted."}</p>
            {requestDetail.events.length > 0 && <ol className="request-timeline">{requestDetail.events.map((event, index) => <li key={`${event.createdAt}-${index}`}><b>{event.label}</b> <small>{dateTime(event.createdAt)}</small></li>)}</ol>}
            {requestDetail.files.length > 0 && <div><b>Supporting documents</b><ul>{requestDetail.files.map((file, index) => <li key={`${file.createdAt}-${index}`}>{file.name} <small>· {dateLabel(file.createdAt)}</small></li>)}</ul></div>}
            <div className="selected-request-actions"><Link href={`/services/${requestDetail.request.serviceSlug}`}>Service checklist <ArrowRight size={14}/></Link>{requestDetail.request.cancellable && <CancelRequestButton reference={requestDetail.request.reference} onDone={async () => { setSelectedRequest(""); setRequestDetail(null); await reload(); }}/>}</div>
          </>}
        </article>}
        <RequestRows rows={activeRequests}/></div>;
      case "history": return <div className="profile-panel"><SectionHeading eyebrow="COMPLETED & CLOSED" title="Request history" text="A record of completed, rejected, cancelled, or otherwise closed service requests."/><RequestRows rows={historyRequests}/>{!historyRequests.length && requests.length > 0 && <p className="profile-inline-note">Your requests are still in progress. They’ll move into history after the team closes them.</p>}</div>;
      case "prints": return <div className="profile-panel"><SectionHeading eyebrow="DOCUMENT SERVICES" title="Print orders" text="Track print requests, pickup or delivery selection, the estimate, and the latest fulfilment status." />{jobs.length ? <div className="profile-record-list">{jobs.map((job) => <article className="profile-record" key={job.reference}><span className="request-icon"><Printer size={18}/></span><div className="profile-record-copy"><b>Print order · {job.fulfillment}</b><small>{job.reference} · {dateLabel(job.createdAt)}</small><p>Estimate recorded: {rupees(Number(job.total))}</p></div><span className={`request-status status-${job.status.toLowerCase().replaceAll(" ", "-")}`}><i/>{job.status}</span></article>)}</div> : <EmptyState icon={<Printer size={20}/>} title="No print orders yet" text="Upload a document, choose print options, and request an estimate. The team confirms the final cost before printing." action={<Link href="/print" className="button button-green">Start a print request <ArrowRight size={15}/></Link>}/>}</div>;
      case "wallet": return <div className="profile-panel"><SectionHeading eyebrow="CUSTOMER REWARDS" title="Wallet & credits" text="Credits and adjustments posted by the service team appear here with their date and reference."/><div className="profile-wallet-summary"><span>AVAILABLE BALANCE</span><strong>{rupees(balance)}</strong><small>Wallet top-up and online wallet payment are not enabled.</small></div>{wallet.length ? <div className="wallet-ledger">{wallet.map((entry, index) => <article key={`${entry.createdAt}-${index}`}><div><b>{entry.description}</b><small>{dateLabel(entry.createdAt)}{entry.reference ? ` · ${entry.reference}` : ""}</small></div><strong className={entry.kind.toLowerCase() === "debit" ? "debit-value" : "credit-value"}>{entry.kind.toLowerCase() === "debit" ? "−" : "+"}{rupees(Number(entry.amount))}</strong></article>)}</div> : <EmptyState icon={<WalletCards size={20}/>} title="No wallet activity yet" text="Any eligible promotional credit or adjustment will be recorded here by staff."/>}</div>;
      case "vouchers": return <div className="profile-panel"><SectionHeading eyebrow="SAVINGS & PROMOTIONS" title="Available vouchers" text="Active public coupon codes from the store. Eligibility is checked again when you request a print estimate." />{coupons.length ? coupons.map((coupon) => <article className="pan-card" key={coupon.code}><h3>{coupon.code}</h3><p>{coupon.discountType === "percent" ? `${coupon.discountValue}%` : rupees(Number(coupon.discountValue))} off · Minimum order {rupees(Number(coupon.minimumAmount))}</p><p>{coupon.expiresAt ? `Expires ${dateLabel(coupon.expiresAt)}` : "No expiry configured"}</p><Link href="/print">Use with a print request →</Link></article>) : <p>No active coupon codes are available. <Link href="/offers">See public offers</Link>.</p>}</div>;
      case "addresses": return <div className="profile-panel"><SectionHeading eyebrow="DELIVERY & CONTACT" title="Saved addresses" text="Save an address for a print delivery request. You can choose pickup instead when sending a print job."/>{demoMode ? <EmptyState icon={<MapPin size={20}/>} title="Demo preview" text="Saved addresses are available after creating a real account."/> : <AddressManager/>}</div>;
      case "profile": return <div className="profile-panel"><SectionHeading eyebrow="PERSONAL INFORMATION" title="Your profile details" text="Keep your contact and location information current."/><div className="profile-completion"><b>Profile readiness: {[name, phone, city, state, postalCode].filter((value) => value.trim()).length}/5 details completed</b><p>Your contact information can prefill assistance forms after the private workspace opens.</p></div><form className="profile-edit-form profile-edit-grid" onSubmit={saveProfile}>
        <label>Full name<input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)}/></label>
        <label>Email address<input value={user.email} readOnly/><small>To change it, open “Sign-in & privacy”.</small></label>
        <label>Mobile number<input type="tel" inputMode="tel" maxLength={20} autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} aria-invalid={Boolean(profileFieldErrors.phone)}/><small>{profileFieldErrors.phone ?? "Needed for phone or WhatsApp updates."}</small></label>
        <label>City<input maxLength={100} autoComplete="address-level2" value={city} onChange={(event) => setCity(event.target.value)}/></label>
        <label>State<input maxLength={100} autoComplete="address-level1" value={state} onChange={(event) => setState(event.target.value)}/></label>
        <label>PIN code<input inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} autoComplete="postal-code" value={postalCode} onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 6))} aria-invalid={Boolean(profileFieldErrors.postalCode)}/>{profileFieldErrors.postalCode && <small className="field-error">{profileFieldErrors.postalCode}</small>}</label>
        <label>Preferred update channel<select value={preferredContact} onChange={(event) => setPreferredContact(event.target.value as ProfileUser["preferredContact"])}><option value="email">Email</option><option value="phone">Phone call</option><option value="whatsapp">WhatsApp</option></select><small>{profileFieldErrors.preferredContact}</small></label>
        <label className="profile-summary-field">A note for your profile <span>OPTIONAL</span><textarea maxLength={500} rows={4} value={profileSummary} onChange={(event) => setProfileSummary(event.target.value)}/><small>{profileSummary.length}/500 characters. Don’t enter passwords, OTPs or identity numbers.</small></label>
        {profileError && <div className="form-alert error-alert profile-form-message">{profileError}</div>}{profileMessage && <div className="form-alert success-alert profile-form-message">{profileMessage}</div>}
        <div className="profile-form-actions"><button className="button button-green" disabled={profileBusy}>{profileBusy ? "Saving…" : "Save profile details"}</button></div>
      </form></div>;
      case "security": return <div className="profile-panel"><SectionHeading eyebrow="ACCOUNT ACCESS" title="Sign-in & privacy" text="Manage your password, sign-in email and devices. Keep access codes private."/><AccountSecurityPanel email={user.email} emailVerified={user.emailVerified} activeSessions={activeSessions} openWork={openWork} demoMode={demoMode}/></div>;
      case "help": return <div className="profile-panel"><SectionHeading eyebrow="LOCAL SUPPORT" title="Need help with your account?" text="Contact the Kharangajhar team if a request status needs clarification or your profile details need an update."/><div className="profile-help-card"><CircleHelp size={24}/><div><b>NISE COMPORT · Kharangajhar, Telco Colony</b><p>Ground Floor, Singh Building, Shop No-3, Hanuman Mandir Road, Kharangajhar, Telco Colony, Jamshedpur, Jharkhand 831004</p><a href="tel:+919771219893">+91 97712 19893</a><div><Link className="button button-green" href="/contact">Contact the team <ArrowRight size={15}/></Link><a className="button button-outline" href="https://wa.me/919771219893" target="_blank" rel="noreferrer">WhatsApp</a></div></div></div></div>;
    }
  })();

  return <main className="profile-page"><SiteHeader/><div className="container profile-container">
    <header className="profile-page-heading"><div><span className="eyebrow eyebrow-muted">CUSTOMER ACCOUNT</span><h1>Your profile,<br/><em>your service desk.</em></h1><p>Welcome, {firstName}. Choose a section to see just the information you need.</p></div></header>
    <div className="profile-workspace"><aside className="profile-sidebar"><div className="profile-identity"><div className="profile-avatar"><UserRound size={24}/></div><div><b>{user.name}</b><small>{user.email}</small></div></div><span className="verified-badge"><ShieldCheck size={13}/> Email {user.emailVerified ? "verified" : "not verified"}</span><div className="sidebar-divider"/><nav className="profile-section-nav" aria-label="Profile sections">{navigation.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={section === id ? "active" : ""} onClick={() => openSection(id)}><Icon size={16}/><span>{label}</span>{id === "requests" && activeRequests.length > 0 && <small>{activeRequests.length}</small>}</button>)}</nav><div className="sidebar-help"><span><Bell size={15}/></span><div><b>Need a hand?</b><small>Local team support</small><button onClick={() => openSection("help")}>Get help <ArrowRight size={12}/></button></div></div></aside>
      <section className="profile-main-panel" aria-live="polite"><div className="profile-mobile-section-select"><label htmlFor="profile-section">Profile section</label><select id="profile-section" value={section} onChange={(event) => openSection(event.target.value as Section)}>{navigation.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>{content}</section>
    </div>
    <p className="profile-footnote"><Check size={14}/> Private account data is loaded through the encrypted account channel; final government/provider decisions remain with the relevant authority.</p>
  </div></main>;
}

function Metric({ icon, number, label }: { icon: React.ReactNode; number: React.ReactNode; label: string }) {
  return <article className="profile-metric"><span>{icon}</span><div><b>{number}</b><small>{label}</small></div></article>;
}
