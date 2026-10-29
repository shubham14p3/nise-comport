"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { Loader2 } from "lucide-react";
import { secureApi, SecureApiError } from "@/lib/secure-api-client";
import { COUNTER_DISCOUNT_PERCENT } from "@/lib/counter-rules";

/** Opaque gateway code for the counter lookup, visit and top-up request (mapped in src/app/api/x7q9m2/route.ts). */
const COUNTER_OP = "C6d1L8wN4vXs";
/** Opaque gateway code for the second-admin approvals list and decision (mapped in the same gateway). */
const APPROVALS_OP = "W5k2P8vN4rQd";

type Service = { slug: string; title: string };
type Visit = { id: string; serviceName: string; billPaise: number; discountPaise: number; walletPaise: number; collectPaise: number; createdAt: string };
type Lookup = { phone: string; customer: { id: string; name: string } | null; knownName: string | null; balancePaise: number; visits: Visit[] };
type Recorded = { billPaise: number; discountPaise: number; collectPaise: number; balanceAfterPaise: number };
type CreditRequest = {
  id: string; amount: string; reason: string; status: "pending" | "approved" | "rejected"; requestedAt: string; requestedById: string;
  decidedAt: string | null; decisionNote: string | null; customerName: string; customerPhone: string | null; requestedBy: string; decidedBy: string | null;
};

const rupees = (paise: number) => `₹${(paise / 100).toFixed(2)}`;
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * Owner's counter desk, shown in a popup. Left: enter the mobile number, pick a service and the amount.
 * Right: the customer, the live bill summary and recent visits. Top-ups and approvals are below.
 */
export default function CounterDesk({ services, isOwner }: { services: Service[]; isOwner: boolean }) {
  const [phone, setPhone] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [newName, setNewName] = useState("");
  const [serviceText, setServiceText] = useState("");
  const [service, setService] = useState<Service | null>(null);
  const [highlight, setHighlight] = useState(0);
  const [amount, setAmount] = useState("");
  const [topupAmount, setTopupAmount] = useState("");
  const [topupReason, setTopupReason] = useState("");
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [me, setMe] = useState("");
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const digits = phone.replace(/\D/g, "");
  const matches = serviceText.trim()
    ? services.filter((item) => item.title.toLowerCase().includes(serviceText.trim().toLowerCase())).slice(0, 8)
    : services.slice(0, 8);
  const billPaise = Math.round((Number(amount) || 0) * 100);
  const balancePaise = lookup?.balancePaise ?? 0;
  const previewDiscount = Math.min(Math.floor((billPaise * COUNTER_DISCOUNT_PERCENT) / 100), balancePaise);

  async function run<T>(action: () => Promise<T>) {
    setBusy(true); setError(""); setNotice("");
    try { return await action(); }
    catch (reason) {
      setError(reason instanceof SecureApiError || reason instanceof Error ? reason.message : "Something went wrong. Please try again.");
      return null;
    } finally { setBusy(false); }
  }

  async function loadApprovals() {
    if (!isOwner) return;
    try {
      const result = await secureApi<{ requests: CreditRequest[]; me: string }>(APPROVALS_OP, { action: "list" });
      setRequests(result.requests); setMe(result.me);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load approvals.");
    }
  }

  useEffect(() => {
    if (!isOwner) return;
    let active = true;
    secureApi<{ requests: CreditRequest[]; me: string }>(APPROVALS_OP, { action: "list" })
      .then((result) => { if (active) { setRequests(result.requests); setMe(result.me); } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load approvals."); });
    return () => { active = false; };
  }, [isOwner]);

  async function findCustomer() {
    if (digits.length < 10) { setError("Enter a 10-digit mobile number."); return; }
    setLooking(true);
    try {
      const result = await run(() => secureApi<Lookup>(COUNTER_OP, { action: "lookup", phone: digits }));
      if (result) {
        setLookup(result);
        if (!result.customer && result.knownName) setNewName((current) => current || result.knownName!);
        setNotice(result.customer ? "" : result.knownName
          ? result.knownName + " is in your records but has no account yet. Their profile is created when you record the visit."
          : "New number. Add the customer’s name below to create their profile.");
      }
    } finally { setLooking(false); }
  }

  function pickService(item: Service) {
    setService(item); setServiceText(item.title); setHighlight(0);
  }

  function onServiceKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") { event.preventDefault(); setHighlight((index) => Math.min(index + 1, matches.length - 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setHighlight((index) => Math.max(index - 1, 0)); }
    if (event.key === "Enter") {
      event.preventDefault();
      const picked = matches[highlight] ?? matches[0];
      if (picked) pickService(picked);
    }
  }

  async function recordVisit() {
    if (!service) { setError("Choose a service first."); return; }
    if (!(billPaise > 0)) { setError("Enter the amount."); return; }
    if (!lookup) { setError("Look up the mobile number first."); return; }
    const result = await run(() => secureApi<Recorded>(COUNTER_OP, {
      action: "visit", phone: digits, name: lookup.customer ? undefined : newName, serviceSlug: service.slug, amount: billPaise / 100,
    }));
    if (!result) return;
    setNotice(`Recorded. Customer pays ${rupees(result.collectPaise)}${result.discountPaise ? `, wallet covers ${rupees(result.discountPaise)}` : ""}. Balance now ${rupees(result.balanceAfterPaise)}.`);
    setService(null); setServiceText(""); setAmount(""); setNewName("");
    await findCustomer();
  }

  async function requestTopUp() {
    const paise = Math.round((Number(topupAmount) || 0) * 100);
    if (!(paise > 0)) { setError("Enter the top-up amount."); return; }
    if (topupReason.trim().length < 10) { setError("Write why this top-up is being made (at least 10 characters)."); return; }
    if (!lookup) { setError("Look up the mobile number first."); return; }
    const result = await run(() => secureApi<{ status: string }>(COUNTER_OP, {
      action: "topup", phone: digits, name: lookup.customer ? undefined : newName, amount: paise / 100, reason: topupReason,
    }));
    if (!result) return;
    setNotice(`Top-up of ${rupees(paise)} sent for approval. A second admin must approve it before it reaches the wallet.`);
    setTopupAmount(""); setTopupReason("");
    await loadApprovals();
  }

  async function decide(id: string, decision: "approve" | "reject") {
    const note = decisionNotes[id]?.trim() ?? "";
    if (note.length < 5) { setError("Add a short note for this decision."); return; }
    const result = await run(() => secureApi(APPROVALS_OP, { action: "decide", id, decision, note }));
    if (!result) return;
    setNotice(decision === "approve" ? "Approved. The credit is now in the wallet." : "Rejected. Nothing was added to the wallet.");
    setDecisionNotes((current) => ({ ...current, [id]: "" }));
    await loadApprovals();
    if (lookup) await findCustomer();
  }

  function onAmountKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") { event.preventDefault(); void recordVisit(); }
  }

  const pending = requests.filter((item) => item.status === "pending");
  const decided = requests.filter((item) => item.status !== "pending").slice(0, 10);

  return <div aria-label="Counter desk">
    <div className="admin-panel-title"><div><h2>Counter desk</h2><p>Look up a mobile number, pick the service and enter the amount. Every visit is kept with its date and time.</p></div></div>
    <div className="counter-desk__grid">
      <div className="counter-desk__entry">
        <label className="field"><span className="field__label">Customer mobile</span>
          <span className="counter-desk__lookup">
            <input type="tel" inputMode="numeric" autoComplete="off" value={phone} placeholder="98765 43210"
              onChange={(event) => setPhone(event.target.value.replace(/[^\d\s+-]/g, "").slice(0, 16))}
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void findCustomer(); } }}
              onBlur={() => { if (digits.length === 10 && lookup?.phone !== digits) void findCustomer(); }}/>
            <button type="button" className="btn btn--ghost btn--sm" disabled={looking || digits.length < 10} onClick={() => void findCustomer()} aria-busy={looking}>
              {looking ? <><Loader2 size={15} className="counter-desk__spin" aria-hidden="true"/> Looking up…</> : "Look up"}
            </button>
          </span>
        </label>

        {lookup && <>
          <label className="field" style={{ marginTop: 10 }}><span className="field__label">Service</span>
            <input value={serviceText} placeholder="Type to search, then Enter" autoComplete="off" role="combobox" aria-controls="counter-service-options" aria-expanded={!service}
              onChange={(event) => { setServiceText(event.target.value); setService(null); setHighlight(0); }}
              onKeyDown={onServiceKey}/>
            {!service && <ul role="listbox" id="counter-service-options" className="counter-desk__options">
              {matches.map((item, index) => <li key={item.slug} role="option" aria-selected={index === highlight}
                onMouseDown={(event) => { event.preventDefault(); pickService(item); }}
                className={index === highlight ? "is-highlight" : undefined}>{item.title}</li>)}
              {matches.length === 0 && <li>No service matches.</li>}
            </ul>}
          </label>

          <label className="field" style={{ marginTop: 10 }}><span className="field__label">Amount (₹)</span>
            <input inputMode="decimal" autoComplete="off" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))} onKeyDown={onAmountKey}/>
            <span className="field__hint">Press Enter to record the visit.</span>
          </label>

          <button type="button" className="btn btn--primary" style={{ marginTop: 12 }} disabled={busy} onClick={() => void recordVisit()}>{busy ? "Recording…" : "Record visit"}</button>

          <details style={{ marginTop: 18 }}>
            <summary>Request a wallet top-up</summary>
            <div className="form-grid" style={{ marginTop: 10 }}>
              <label className="field"><span className="field__label">Amount (₹)</span><input inputMode="decimal" value={topupAmount} onChange={(event) => setTopupAmount(event.target.value.replace(/[^\d.]/g, ""))}/></label>
              <label className="field"><span className="field__label">Reason (required)</span><input value={topupReason} onChange={(event) => setTopupReason(event.target.value)} maxLength={180} placeholder="Why is this credit being made?"/></label>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => void requestTopUp()} style={{ marginTop: 8 }}>Send for approval</button>
          </details>
        </>}
      </div>

      <aside className="counter-desk__side" aria-live="polite">
        {!lookup && <p className="muted">Enter a mobile number and press Look up. The customer, their wallet balance and the bill summary appear here.</p>}
        {lookup && <>
          <div className="counter-desk__card">
            {lookup.customer
              ? <><b>{lookup.customer.name}</b><div className="muted">{lookup.phone} · wallet <b>{rupees(lookup.balancePaise)}</b></div></>
              : <>
                <label className="field"><span className="field__label">Customer’s name (new number)</span>
                  <input value={newName} onChange={(event) => setNewName(event.target.value)} autoComplete="off"/>
                </label>
                <span className="field__hint">New numbers get a profile. The name goes on the receipt and the customer’s record.</span>
              </>}
          </div>

          {billPaise > 0 && <dl className="summary" style={{ marginTop: 10 }}>
            <div><dt>Bill</dt><dd>{rupees(billPaise)}</dd></div>
            <div><dt>{COUNTER_DISCOUNT_PERCENT}% off, from wallet</dt><dd>{rupees(previewDiscount)}</dd></div>
            <div><dt>Customer pays</dt><dd><b>{rupees(billPaise - previewDiscount)}</b></dd></div>
          </dl>}

          {lookup.visits.length > 0 && <>
            <h3 className="counter-desk__subhead">Recent visits</h3>
            <ul className="counter-desk__visits">
              {lookup.visits.map((visit) => <li key={visit.id}>
                <b>{visit.serviceName}</b> · {when(visit.createdAt)}<br/>
                <small>Bill {rupees(visit.billPaise)} · wallet {rupees(visit.walletPaise)} · paid {rupees(visit.collectPaise)}</small>
              </li>)}
            </ul>
          </>}
        </>}
      </aside>
    </div>

    {error && <p className="alert alert--error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
    {notice && <p className="alert alert--info" role="status" style={{ marginTop: 12 }}>{notice}</p>}

    {isOwner ? <>
    <h2 style={{ marginTop: 24 }}>Wallet credits waiting for approval</h2>
    <p className="muted">A second admin approves each credit. You can’t approve your own request.</p>
    {pending.length === 0 && <p className="muted">Nothing waiting.</p>}
    <ul style={{ listStyle: "none", padding: 0 }}>
      {pending.map((item) => <li key={item.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--line, #ddd)" }}>
        <b>{item.customerName}</b>{item.customerPhone ? ` · ${item.customerPhone}` : ""} · <b>{rupees(Math.round(Number(item.amount) * 100))}</b><br/>
        <small>Reason: {item.reason}</small><br/>
        <small>Requested by {item.requestedBy} · {when(item.requestedAt)}</small>
        {item.requestedById === me
          ? <p className="muted" style={{ marginTop: 6 }}>Waiting for another admin to approve.</p>
          : <div style={{ marginTop: 8, display: "grid", gap: 6, maxWidth: 480 }}>
            <input placeholder="Note for this decision (required)" value={decisionNotes[item.id] ?? ""} maxLength={300}
              onChange={(event) => setDecisionNotes((current) => ({ ...current, [item.id]: event.target.value }))}/>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={() => void decide(item.id, "approve")}>Approve</button>
              <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => void decide(item.id, "reject")}>Reject</button>
            </div>
          </div>}
      </li>)}
    </ul>

    {decided.length > 0 && <>
      <h3 style={{ marginTop: 20 }}>Recent decisions</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {decided.map((item) => <li key={item.id} style={{ padding: "6px 0" }}>
          <small><b>{item.status === "approved" ? "Approved" : "Rejected"}</b> · {item.customerName} · {rupees(Math.round(Number(item.amount) * 100))} · {item.reason}<br/>
          Requested by {item.requestedBy}{item.decidedBy ? `, decided by ${item.decidedBy}` : ""}{item.decidedAt ? ` · ${when(item.decidedAt)}` : ""}{item.decisionNote ? ` · “${item.decisionNote}”` : ""}</small>
        </li>)}
      </ul>
    </>}

    </> : <p className="muted" style={{ marginTop: 24 }}>Top-up requests are approved by the owner. You’ll see them in the wallet once approved.</p>}
  </div>;
}
