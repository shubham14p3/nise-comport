"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock3, Eye, FileText, LoaderCircle, ShieldCheck, WalletCards, Store, Printer, MapPin, RefreshCcw } from "lucide-react";
import { secureApi } from "@/lib/secure-api-client";
import type { CustomerVoucher } from "@/lib/promo-view";
import "./customer-preview-workspace.css";

const OP = "V2a9N6sK4rD8";
type Entry = { reference?: string; name?: string; description?: string; status?: string; kind?: string; amount?: string | number; createdAt: string; fulfillment?: string };
type Preview = {
  user: { id: string; name: string; email: string | null; phone: string | null; role: string; whatsapp?: string | null; profileSummary?: string | null; preferredContact?: string; signupMethod?: string; createdAt?: string; updatedAt?: string; emailVerified: boolean; phoneVerified: boolean; city: string | null; state: string | null; postalCode: string | null };
  requests: Entry[]; jobs: Entry[]; visits: Entry[]; wallet: Entry[];
  addresses: { id: string; label: string; line1: string; city: string; state: string; postalCode: string }[];
  expiresAt: number;
};
type Section = "overview" | "requests" | "counter" | "prints" | "wallet" | "addresses" | "records" | "history" | "vouchers" | "profile" | "security" | "help" | "messages";
const sections: { id: Section; label: string; icon: typeof Eye }[] = [
  { id: "overview", label: "Overview", icon: Eye },
  { id: "requests", label: "My requests", icon: FileText },
  { id: "records", label: "My records", icon: FileText },
  { id: "history", label: "Request history", icon: Clock3 },
  { id: "counter", label: "Counter visits", icon: Store },
  { id: "prints", label: "Print orders", icon: Printer },
  { id: "wallet", label: "Wallet", icon: WalletCards },
  { id: "vouchers", label: "Vouchers & offers", icon: WalletCards },
  { id: "addresses", label: "Saved addresses", icon: MapPin },
  { id: "profile", label: "Profile details", icon: Eye },
  { id: "security", label: "Sign-in & privacy", icon: ShieldCheck },
  { id: "help", label: "Get help", icon: Eye },
  { id: "messages", label: "Messages", icon: FileText },
];
type Extra = {
  status?: string;
  records?: { id: string; name: string; service: string; date: string | null; nextRenewal: string | null; vehicle: string | null }[];
  vouchers?: CustomerVoucher[];
  sessions?: { createdAt: string; expiresAt: string }[];
  tickets?: { id: string; subject: string; status: string; number: number; createdAt: string }[];
};
type Thread = { ticket: { subject: string }; messages: { body: string; direction: string; authorName: string | null; createdAt: string }[] };
const closed = new Set(["completed", "rejected", "cancelled", "closed"]);
function prettyDate(value: string) { return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }); }

export default function CustomerPreviewWorkspace() {
  const router = useRouter();
  const [data, setData] = useState<Preview | null>(null);
  const [section, setSection] = useState<Section>("overview");
  const [extras, setExtras] = useState<Partial<Record<Section, Extra>>>({});
  const [extraError, setExtraError] = useState("");
  const [extraLoading, setExtraLoading] = useState(false);
  const [thread, setThread] = useState<Thread | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clock, setClock] = useState(() => Date.now());
  const load = useCallback(async () => {
    setError("");
    try { setData(await secureApi<Preview>(OP, { action: "state" })); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load preview."); }
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const seconds = data ? Math.max(0, Math.ceil((data.expiresAt - clock) / 1000)) : 0;
  const expired = data !== null && seconds === 0;
  useEffect(() => {
    if (!expired) return;
    void secureApi(OP, { action: "end" }).catch(() => undefined).finally(() => {
      router.replace("/desk#customers");
      router.refresh();
    });
  }, [expired, router]);
  useEffect(() => {
    if (!data || expired || !["records", "vouchers", "security", "messages"].includes(section) || extras[section]) return;
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setExtraLoading(true); setExtraError("");
      try {
        const result = await secureApi<Extra>(OP, { action: "section", section });
        if (active) setExtras(current => ({ ...current, [section]: result }));
      } catch (e) { if (active) setExtraError(e instanceof Error ? e.message : "Could not load this section."); }
      finally { if (active) setExtraLoading(false); }
    });
    return () => { active = false; };
  }, [section, data, expired, extras]);
  async function openThread(id: string) {
    setThreadLoading(true); setExtraError("");
    try { setThread(await secureApi<Thread>(OP, { action: "section", section: "messages", ticketId: id })); }
    catch (e) { setExtraError(e instanceof Error ? e.message : "Could not load messages."); }
    finally { setThreadLoading(false); }
  }
  const remaining = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  async function end() {
    setBusy(true);
    try { await secureApi(OP, { action: "end" }); }
    catch { /* Expired previews can still return to the administrator's original session. */ }
    finally { router.replace("/desk#customers"); router.refresh(); }
  }
  async function extend() {
    if (busy || expired) return;
    setBusy(true); setError("");
    try { await secureApi(OP, { action: "extend" }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not extend the preview."); }
    finally { setBusy(false); }
  }

  function activity(items: Entry[], empty: string) {
    return items.length ? <div className="preview-list">{items.map((item, i) => <article className="preview-item" key={item.reference ?? `${item.createdAt}-${i}`}>
      <div><strong>{item.name ?? item.description ?? item.reference ?? "Account activity"}</strong>
        <small>{item.reference ? `${item.reference} · ` : ""}{prettyDate(item.createdAt)}</small></div>
      <span className="preview-status">{item.status ?? item.kind ?? "Recorded"}</span>
    </article>)}</div> : <p className="preview-empty">{empty}</p>;
  }
  return <main className="customer-preview">
    <div className="customer-preview__top">
      <div><span className="customer-preview__eyebrow"><ShieldCheck size={16}/> ADMINISTRATOR PREVIEW SESSION</span>
        <h1>{data ? `Viewing as ${data.user.name}` : "Customer account preview"}</h1>
        <p>This is a read-only view of the selected account. Your administrator login remains intact.</p></div>
      <button type="button" className="btn btn--primary" onClick={() => void end()} disabled={busy}>
        <ArrowLeft size={16}/> Return to Admin</button>
    </div>
    {data && <div className="customer-preview__banner" role="status"><Eye size={18}/>
      <span><b>Read-only customer preview</b> · {data.user.email ?? data.user.phone ?? "No contact identifier"} · {data.user.role === "customer" ? "Customer" : "Team member using customer features"}</span>
      <span className="customer-preview__timer"><Clock3 size={16}/> {remaining}</span>
      <button type="button" disabled={busy || expired} onClick={() => void extend()}><RefreshCcw size={15}/> Extend</button>
    </div>}
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    {busy && <p className="customer-preview__busy"><LoaderCircle size={18} className="api-activity__spin"/> Processing…</p>}
    {expired && <div className="customer-preview__expired"><h2>Preview expired</h2><p>The temporary viewing period has ended. Your admin account is still active.</p>
      <button type="button" className="btn btn--primary" onClick={() => void end()}>Return to Admin</button></div>}
    {!data && !error && <div className="customer-preview__busy"><LoaderCircle size={22} className="api-activity__spin"/> Loading customer records…</div>}
    {data && !expired && <>
      <div className="customer-preview__account"><h2>{data.user.name}</h2>
        <p>{data.user.email ?? "No verified email"} · {data.user.phone ?? "No registered mobile"}</p>
        <div className="customer-preview__facts"><span>Email {data.user.emailVerified ? "verified" : "unverified"}</span>
          <span>Mobile {data.user.phoneVerified ? "verified" : "unverified"}</span><span>{data.user.city ?? ""} {data.user.state ?? ""}</span></div>
      </div>
      <div className="customer-preview__grid">
        <nav aria-label="Customer preview sections">{sections.map(({ id, label, icon: Icon }) =>
          <button type="button" aria-current={section === id ? "page" : undefined} className={section === id ? "active" : ""} onClick={() => { setSection(id); setExtraError(""); }} key={id}><Icon size={18}/>{label}</button>)}</nav>
        <section className="customer-preview__main">
          {extraError && <p role="alert" className="alert alert--error">{extraError}<button type="button" onClick={() => { setExtraError(""); setExtras(current => ({ ...current })); }}>Retry</button></p>}
          {extraLoading && !extras[section] && ["records", "vouchers", "security", "messages"].includes(section) && <p role="status">Loading section…</p>}
          {section === "records" && extras.records && <><h2>My records</h2><p>Record access: {extras.records.status}. Preview does not approve or claim records.</p>{extras.records.records?.length ? extras.records.records.map(r => <article className="preview-item" key={r.id}><div><strong>{r.service} · {r.name}</strong><small>{r.date ?? ""}{r.nextRenewal ? ` · Renewal ${r.nextRenewal}` : ""}{r.vehicle ? ` · ${r.vehicle}` : ""}</small></div></article>) : <p className="preview-empty">No approved records available to this customer.</p>}</>}
          {section === "history" && <><h2>Request history</h2>{activity(data.requests.filter(r => closed.has(r.status ?? "")), "No completed or closed requests.")}<h3>Counter visits</h3>{activity(data.visits, "No counter visits.")}</>}
          {section === "vouchers" && extras.vouchers && <><h2>Vouchers & offers</h2>{extras.vouchers.vouchers?.length ? extras.vouchers.vouchers.map(v => <article className="preview-item" key={v.code}><div><strong>{v.names.en} · {v.code}</strong><small>{v.discountType === "percent" ? `${v.discount}%` : `₹${v.discount}`} off · Minimum ₹{v.minimum} · {v.startsOn} – {v.endsOn}</small><small>{v.personal ? "Personal voucher" : "Public offer"}</small></div><span className="preview-status">{v.used ? "Used" : v.live ? "Available" : "Not active"}</span></article>) : <p>No vouchers available.</p>}<p>Voucher redemption is disabled in preview.</p></>}
          {section === "profile" && <><h2>Profile details</h2><dl className="preview-details">{Object.entries({Name:data.user.name,Email:data.user.email,Mobile:data.user.phone,WhatsApp:data.user.whatsapp,City:data.user.city,State:data.user.state,"Postal code":data.user.postalCode,"Preferred contact":data.user.preferredContact,"Profile summary":data.user.profileSummary}).map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value || "Not provided"}</dd></div>)}</dl><p>Profile corrections are available from Admin → Customers.</p></>}
          {section === "security" && <><h2>Sign-in & privacy</h2><p>Email {data.user.emailVerified ? "verified" : "unverified"} · Mobile {data.user.phoneVerified ? "verified" : "unverified"}</p><p>Sign-in method: {data.user.signupMethod ?? "Not recorded"}</p><p>Password, PIN, OTP, account deletion and device sign-out controls are unavailable in read-only preview.</p>{extras.security && <><h3>Active sign-in sessions</h3>{extras.security.sessions?.length ? extras.security.sessions.map((session,i) => <article className="preview-item" key={i}><div><b>Signed in {prettyDate(session.createdAt)}</b><small>Expires {prettyDate(session.expiresAt)}</small></div></article>) : <p>No active customer sessions.</p>}</>}</>}
          {section === "help" && <><h2>Get help</h2><p>NiSE COMPORT · Kharangajhar, Telco Colony</p><p>Ground Floor, Singh Building, Shop No-3, Hanuman Mandir Road, Jamshedpur, Jharkhand 831004</p><p>Call / WhatsApp: +91 97712 19893</p><p>Customer messages can be inspected in Messages. Sending as the customer is disabled.</p></>}
          {section === "messages" && extras.messages && <><h2>Messages</h2>{threadLoading && <p role="status">Loading conversation…</p>}{thread ? <><button type="button" className="btn btn--ghost" onClick={() => setThread(null)}>All conversations</button><h3>{thread.ticket.subject}</h3>{thread.messages.map((message,i) => <article className="preview-item" key={i}><div><strong>{message.direction === "in" ? "Customer" : message.authorName ?? "Service desk"}</strong><small>{prettyDate(message.createdAt)}</small><p className="preview-message">{message.body}</p></div></article>)}</> : extras.messages.tickets?.length ? extras.messages.tickets.map(ticket => <button type="button" className="preview-item preview-ticket" key={ticket.id} disabled={threadLoading} onClick={() => void openThread(ticket.id)}><span>NC-T{ticket.number} · {ticket.subject}</span><span className="preview-status">{ticket.status}</span></button>) : <p>No customer conversations.</p>}<p className="preview-empty">Showing up to 60 conversations and the latest 100 messages per conversation. Viewing does not mark messages read or send replies.</p></>}
          {section === "overview" && <><h2>Customer dashboard</h2><p className="preview-empty">What this registered account currently has on file.</p>
            <div className="customer-preview__metrics">{[["Requests shown",data.requests.length],["Counter visits shown",data.visits.length],["Print orders shown",data.jobs.length],["Wallet entries shown",data.wallet.length]].map(([label,value])=><div key={label}><b>{value}</b><small>{label}</small></div>)}</div>
            <h3>Latest requests</h3>{activity(data.requests.slice(0,5),"No online requests for this account.")}</>}
          {section === "requests" && <><h2>Service requests</h2>{activity(data.requests.filter(r => !closed.has(r.status ?? "")),"No active requests.")}</>}
          {section === "counter" && <><h2>Counter visits</h2>{activity(data.visits,"No counter visits linked to this account yet.")}</>}
          {section === "prints" && <><h2>Print orders</h2>{activity(data.jobs,"No print orders yet.")}</>}
          {section === "wallet" && <><h2>Wallet transactions</h2>{data.wallet.length ? <div className="preview-list">{data.wallet.map((entry,i)=><div className="preview-item" key={i}><div><strong>{entry.description ?? entry.kind}</strong><small>{prettyDate(entry.createdAt)}</small></div><b>{entry.kind === "debit" ? "−" : "+"}₹{entry.amount}</b></div>)}</div> : <p className="preview-empty">No wallet entries.</p>}</>}
          {section === "addresses" && <><h2>Saved addresses</h2>{data.addresses.length ? data.addresses.map(a=><article className="preview-address" key={a.id}><b>{a.label}</b><p>{a.line1}, {a.city}, {a.state} {a.postalCode}</p></article>) : <p className="preview-empty">No saved addresses.</p>}</>}
          <p className="customer-preview__footnote">Preview is deliberately read-only. To correct customer records, return to Admin → Customers. No password, PIN or OTP has been used. This preview shows recent activity: up to 60 service requests, 60 counter visits, 50 print orders, 100 wallet entries and 20 addresses.</p>
        </section>
      </div>
    </>}
  </main>;
}
