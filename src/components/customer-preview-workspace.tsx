"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock3, Eye, FileText, LoaderCircle, ShieldCheck, WalletCards, Store, Printer, MapPin, RefreshCcw } from "lucide-react";
import { secureApi } from "@/lib/secure-api-client";
import "./customer-preview-workspace.css";

const OP = "V2a9N6sK4rD8";
type Entry = { reference?: string; name?: string; description?: string; status?: string; kind?: string; amount?: string | number; createdAt: string; fulfillment?: string };
type Preview = {
  user: { id: string; name: string; email: string | null; phone: string | null; role: string; emailVerified: boolean; phoneVerified: boolean; city: string | null; state: string | null; postalCode: string | null };
  requests: Entry[]; jobs: Entry[]; visits: Entry[]; wallet: Entry[];
  addresses: { id: string; label: string; line1: string; city: string; state: string; postalCode: string }[];
  expiresAt: number;
};
type Section = "overview" | "requests" | "counter" | "prints" | "wallet" | "addresses";
const sections: { id: Section; label: string; icon: typeof Eye }[] = [
  { id: "overview", label: "Overview", icon: Eye },
  { id: "requests", label: "Requests", icon: FileText },
  { id: "counter", label: "Counter visits", icon: Store },
  { id: "prints", label: "Print orders", icon: Printer },
  { id: "wallet", label: "Wallet", icon: WalletCards },
  { id: "addresses", label: "Addresses", icon: MapPin },
];
function prettyDate(value: string) { return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }); }

export default function CustomerPreviewWorkspace() {
  const router = useRouter();
  const [data, setData] = useState<Preview | null>(null);
  const [section, setSection] = useState<Section>("overview");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clock, setClock] = useState(Date.now());
  const load = useCallback(async () => {
    setError("");
    try { setData(await secureApi<Preview>(OP, { action: "state" })); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load preview."); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const seconds = data ? Math.max(0, Math.ceil((data.expiresAt - clock) / 1000)) : 0;
  const expired = data !== null && seconds === 0;
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
          <button type="button" aria-current={section === id ? "page" : undefined} className={section === id ? "active" : ""} onClick={() => setSection(id)} key={id}><Icon size={18}/>{label}</button>)}</nav>
        <section className="customer-preview__main">
          {section === "overview" && <><h2>Customer dashboard</h2><p className="preview-empty">What this registered account currently has on file.</p>
            <div className="customer-preview__metrics">{[["Requests",data.requests.length],["Counter visits",data.visits.length],["Print orders",data.jobs.length],["Wallet entries",data.wallet.length]].map(([label,value])=><div key={label}><b>{value}</b><small>{label}</small></div>)}</div>
            <h3>Latest requests</h3>{activity(data.requests.slice(0,5),"No online requests for this account.")}</>}
          {section === "requests" && <><h2>Service requests</h2>{activity(data.requests,"No requests yet.")}</>}
          {section === "counter" && <><h2>Counter visits</h2>{activity(data.visits,"No counter visits linked to this account yet.")}</>}
          {section === "prints" && <><h2>Print orders</h2>{activity(data.jobs,"No print orders yet.")}</>}
          {section === "wallet" && <><h2>Wallet transactions</h2>{data.wallet.length ? <div className="preview-list">{data.wallet.map((entry,i)=><div className="preview-item" key={i}><div><strong>{entry.description ?? entry.kind}</strong><small>{prettyDate(entry.createdAt)}</small></div><b>{entry.kind === "debit" ? "−" : "+"}₹{entry.amount}</b></div>)}</div> : <p className="preview-empty">No wallet entries.</p>}</>}
          {section === "addresses" && <><h2>Saved addresses</h2>{data.addresses.length ? data.addresses.map(a=><article className="preview-address" key={a.id}><b>{a.label}</b><p>{a.line1}, {a.city}, {a.state} {a.postalCode}</p></article>) : <p className="preview-empty">No saved addresses.</p>}</>}
          <p className="customer-preview__footnote">Preview is deliberately read-only. To correct customer records, return to Admin → Customers. No password, PIN or OTP has been used.</p>
        </section>
      </div>
    </>}
  </main>;
}
