"use client";
import CounterVisitConversation from "@/components/counter-visit-conversation";
import Link from "next/link";
import "./inbox-panel.css";

import { useEffect, useState, type KeyboardEvent } from "react";
import { Check, Loader2, X } from "lucide-react";
import { secureApi, SecureApiError } from "@/lib/secure-api-client";
import { counterAmounts, DEFAULT_COUNTER_POLICY, type CounterPolicy } from "@/lib/counter-rules";

/** Opaque gateway code for the counter lookup, visits, top-ups and contact checks (mapped in src/app/api/x7q9m2/route.ts). */
const COUNTER_OP = "C6d1L8wN4vXs";
/** Opaque gateway code for the second-admin approvals list and decision (mapped in the same gateway). */
const APPROVALS_OP = "W5k2P8vN4rQd";

type Service = { slug: string; title: string };
type Visit = { id: string; serviceName: string; billPaise: number; discountPaise: number; walletPaise: number; collectPaise: number; createdAt: string };
type Contact = { email: string | null; emailVerified: boolean; phone: string | null; phoneVerified: boolean };
type Lookup = { ambiguous?: boolean; candidates?: { id: string; name: string; email: string | null; role: string }[]; phone: string; customer: { id: string; name: string } | null; knownName: string | null; contact: Contact | null; balancePaise: number; visits: Visit[]; visitsTotal: number; page: number; pageSize: number };
type Recorded = { reference: string; jobId?: string | null; earnedPaise: number; billPaise: number; discountPaise: number; collectPaise: number; balanceAfterPaise: number };
type CreditRequest = {
  id: string; amount: string; reason: string; status: "pending" | "approved" | "rejected"; requestedAt: string; requestedById: string;
  decidedAt: string | null; decisionNote: string | null; customerName: string; customerPhone: string | null; requestedBy: string; decidedBy: string | null;
};
type Mode = "mobile" | "email";

const rupees = (paise: number) => `₹${(paise / 100).toFixed(2)}`;
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const shownPhone = (phone: string | null) => (phone ? `+91 ${phone.replace(/^\+91/, "")}` : null);

/** Keeps only digits and stops at 10. A pasted "+91" or "91" prefix is dropped, so the number can't run past 10 digits. */
function limitMobileDigits(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  return digits.slice(0, 10);
}

/** One contact line with its verified tick. The actions appear under it only while it is not verified. */
function ContactCheck({ label, value, verified }: { label: string; value: string | null; verified: boolean }) {
  return <div className="counter-contact__row">
    <div className="counter-contact__top">
      <span className="counter-contact__label">{label}</span>
      <span className="counter-contact__value">{value ?? <em>Not added. Add it in Find customer.</em>}</span>
      {value && <span className={verified ? "counter-contact__ok" : "counter-contact__no"}>{verified ? <><Check size={14} aria-hidden="true"/> Verified</> : "Not verified"}</span>}
    </div>
  </div>;
}

/**
 * Owner's counter desk, shown in a popup. Left: search by mobile (default) or email, pick the service and
 * the amount. Right: the customer, their email and mobile with verified ticks, the live bill summary and recent visits.
 */
export default function CounterDesk({ services, isOwner = false }: { services: Service[]; isOwner?: boolean }) {
  const [mode, setMode] = useState<Mode>("mobile");
  const [lookupText, setLookupText] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [editingDetails, setEditingDetails] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [mainOwner, setMainOwner] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
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

  const [showHistory, setShowHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [history, setHistory] = useState<{ rows: { id: string; customer: string; phone: string | null; service: string; reference: string; jobId?: string | null; createdAt: string; billPaise: number; discountPaise: number; earnedPaise: number; collectPaise: number; paymentStatus: string | null }[]; total: number; page: number; canCharge: boolean } | null>(null);
  async function loadHistory(page = 0) {
    const result = await run(() => secureApi<NonNullable<typeof history>>(COUNTER_OP, { action: "history", page }));
    if (result) { setHistory(result); setHistoryPage(page); setShowHistory(true); }
  }
  const [policy, setPolicy] = useState<CounterPolicy | null>(null);
  const [draftPolicy, setDraftPolicy] = useState<CounterPolicy>(DEFAULT_COUNTER_POLICY);
  const [accumulate, setAccumulate] = useState(false);
  useEffect(() => {
    let active = true;
    secureApi<{ policy: CounterPolicy }>(COUNTER_OP, { action: "wallet-policy" }).then(result => { if (active) { setPolicy(result.policy); setDraftPolicy(result.policy); } }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Could not load wallet rules."); });
    return () => { active = false; };
  }, []);
  async function savePolicy() {
    const result = await run(() => secureApi<{ policy: CounterPolicy }>(COUNTER_OP, { action: "save-wallet-policy", ...draftPolicy }));
    if (result) { setPolicy(result.policy); setDraftPolicy(result.policy); setNotice("Wallet rates saved for future visits."); }
  }
  const matches = serviceText.trim()
    ? services.filter((item) => item.title.toLowerCase().includes(serviceText.trim().toLowerCase())).slice(0, 8)
    : services.slice(0, 8);
  const parsedBill = Number(amount);
  const billPaise = Number.isFinite(parsedBill) && parsedBill > 0 && parsedBill <= 1_000_000 ? Math.round(parsedBill * 100) : 0;
  const balancePaise = lookup?.balancePaise ?? 0;
  const preview = counterAmounts(billPaise, balancePaise, accumulate ? "accumulate" : "deduct", policy ?? DEFAULT_COUNTER_POLICY);
  const previewDiscount = preview.discountPaise;

  async function run<T>(action: () => Promise<T>) {
    setBusy(true); setError(""); setNotice("");
    try { return await action(); }
    catch (reason) {
      setError(reason instanceof SecureApiError || reason instanceof Error ? reason.message : "Something went wrong. Please try again.");
      return null;
    } finally { setBusy(false); }
  }

  async function loadApprovals() {
    try {
      const result = await secureApi<{ requests: CreditRequest[]; me: string; mainOwner?: boolean; canApprove?: boolean }>(APPROVALS_OP, { action: "list" });
      setRequests(result.requests); setMe(result.me); setMainOwner(Boolean(result.mainOwner)); setCanApprove(Boolean(result.canApprove));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load approvals.");
    }
  }

  useEffect(() => {
    let active = true;
    secureApi<{ requests: CreditRequest[]; me: string; mainOwner?: boolean; canApprove?: boolean }>(APPROVALS_OP, { action: "list" })
      .then((result) => { if (active) { setRequests(result.requests); setMe(result.me); setMainOwner(Boolean(result.mainOwner)); setCanApprove(Boolean(result.canApprove)); } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load approvals."); });
    return () => { active = false; };
  }, []);


  function switchMode(next: Mode) {
    setAccumulate(false); setMode(next); setLookupText(""); setLookup(null); setSelectedAccountId(null); setEditingDetails(false); setNotice(""); setError("");
  }

  /** In mobile mode, typing "@" switches to email, so the customer's address can be pasted straight in. */
  function changeLookup(raw: string) {
    if (mode === "mobile" && raw.includes("@")) { setMode("email"); setLookupText(raw.slice(0, 120)); return; }
    setLookupText(mode === "mobile" ? limitMobileDigits(raw) : raw.slice(0, 120));
    setLookup(null); setSelectedAccountId(null); setEditingDetails(false);
  }

  async function findCustomer(page = 0, chosenId = selectedAccountId) {
    if (mode === "mobile" && lookupText.length !== 10) { setError("Enter a valid 10-digit mobile number."); return; }
    if (mode === "email" && !lookupText.includes("@")) { setError("Enter a valid email address."); return; }
    setLooking(true);
    try {
      const body = mode === "email"
        ? { action: "lookup-email", email: lookupText.trim(), page }
        : chosenId ? { action: "lookup-account", userId: chosenId, phone: lookupText, page }
          : { action: "lookup", phone: lookupText, page };
      const result = await run(() => secureApi<Lookup>(COUNTER_OP, body));
      if (result) {
        setLookup(result);
       
        if (result.ambiguous) { setNotice("Several accounts use this number. Select the exact account below before making changes."); }
        if (result.customer) {
          setSelectedAccountId(result.customer.id);
          setEditName(result.customer.name);
          setEditEmail(result.contact?.email ?? "");
          setEditingDetails(false);
        }
        if (!result.customer && result.knownName) setNewName((current) => current || result.knownName!);
        setNotice(result.customer ? "" : mode === "email"
          ? "No customer has this email. Search by mobile to add a new customer."
          : result.knownName
            ? result.knownName + " is in your records but has no account yet. Their profile is created when you record the visit."
            : "New number. Add the customer’s name below to create their profile.");
      }
    } finally { setLooking(false); }
  }

  async function chooseCustomer(id: string) {
    setSelectedAccountId(id);
    await findCustomer(0, id);
  }

  async function saveCustomerDetails() {
    if (!lookup?.customer || busy) return;
    if (!editName.trim()) { setError("Enter the customer name."); return; }
    if (!window.confirm("Update the selected customer account? Email changes require verification again. Existing service records stay attached to the same account.")) return;
    const result = await run(() => secureApi<{ changed: boolean; email: string }>(COUNTER_OP, {
      action: "update-customer", userId: lookup.customer!.id,
      name: editName, email: editEmail.trim() || undefined,
    }));
    if (!result) return;
    if (mode === "email" && result.email !== lookupText.trim().toLowerCase()) {
      setLookupText(result.email);
      const updated = await run(() => secureApi<Lookup>(COUNTER_OP, { action: "lookup-email", email: result.email, page: lookup.page }));
      if (updated) { setLookup(updated); setEditName(updated.customer?.name ?? editName); setEditEmail(updated.contact?.email ?? ""); }
    } else await findCustomer(lookup.page, lookup.customer.id);
    setNotice(result.changed ? "Customer profile updated. Their existing visits remain linked." : "No customer details changed.");
    setEditingDetails(false);
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
    if (!policy) { setError("Wallet rules must load before recording a visit. Refresh and try again."); return; }
    if (!service) { setError("Choose a service first."); return; }
    if (!(billPaise > 0)) { setError("Enter the amount."); return; }
    if (!lookup) { setError("Look up the customer first."); return; }
    if (!lookup.phone) { setError("This customer has no mobile number. Add one in Find customer before recording a visit."); return; }
    const result = await run(() => secureApi<Recorded>(COUNTER_OP, {
      action: "visit", phone: lookup.phone, userId: lookup.customer?.id, name: lookup.customer ? undefined : newName, email: lookup.customer ? undefined : newEmail.trim() || undefined, serviceSlug: service.slug, amount: billPaise / 100, walletMode: accumulate ? "accumulate" : "deduct",
    }));
    if (!result) return;
    setAccumulate(false); setService(null); setServiceText(""); setAmount(""); setNewName(""); setNewEmail("");
    await findCustomer(0);
    setNotice(`Recorded ${result.reference}${result.jobId ? ` · Job ID ${result.jobId}` : ""}. Customer pays ${rupees(result.collectPaise)}${result.discountPaise ? `, wallet covers ${rupees(result.discountPaise)}` : ""}. ${result.earnedPaise ? `Earned ${rupees(result.earnedPaise)}. ` : ""}Balance now ${rupees(result.balanceAfterPaise)}.`);
  }

  async function requestTopUp() {
    const paise = Math.round((Number(topupAmount) || 0) * 100);
    if (!(paise > 0)) { setError("Enter the top-up amount."); return; }
    if (!topupReason.trim()) { setError("Write why this top-up is being made."); return; }
    if (!lookup) { setError("Look up the customer first."); return; }
    if (!lookup.phone) { setError("This customer has no mobile number. Add one in Find customer first."); return; }
    const result = await run(() => secureApi<{ status: string }>(COUNTER_OP, {
      action: "topup", phone: lookup.phone, userId: lookup.customer?.id, name: lookup.customer ? undefined : newName, email: lookup.customer ? undefined : newEmail.trim() || undefined, amount: paise / 100, reason: topupReason,
    }));
    if (!result) return;
    setTopupAmount(""); setTopupReason("");
    await loadApprovals();
    setNotice(`Top-up of ${rupees(paise)} sent for approval. A second admin must approve it before it reaches the wallet.`);
  }

  async function decide(id: string, decision: "approve" | "reject") {
    const note = decisionNotes[id]?.trim() ?? "";
    const result = await run(() => secureApi(APPROVALS_OP, { action: "decide", id, decision, note }));
    if (!result) return;
    setDecisionNotes((current) => ({ ...current, [id]: "" }));
    await loadApprovals();
    if (lookup) await findCustomer(lookup.page);
    setNotice(decision === "approve" ? "Approved. The credit is now in the wallet." : "Rejected. Nothing was added to the wallet.");
  }

  function onAmountKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") { event.preventDefault(); void recordVisit(); }
  }

  const pending = requests.filter((item) => item.status === "pending");
  const decided = requests.filter((item) => item.status !== "pending").slice(0, 10);
  const lookupReady = mode === "mobile" ? lookupText.length === 10 : lookupText.includes("@");

  return <div aria-label="Counter desk">
    <div className="admin-panel-title"><div><h2>Counter desk</h2><p>Look up a customer by mobile or email, pick the service and enter the amount. Every visit is kept with its date and time.</p></div></div>
    {error && <p role="alert" className="form-error">{error}</p>}
    {notice && <p role="status" className="alert alert--info" style={{ overflowWrap: "anywhere" }}>{notice}</p>}
    <div className="counter-desk__modes" role="group" aria-label="Counter view"><button type="button" className={!showHistory ? 'is-active' : undefined} onClick={() => setShowHistory(false)}>Counter desk</button><button type="button" disabled={busy} className={showHistory ? 'is-active' : undefined} onClick={() => void loadHistory(0)}>History</button></div>
    {showHistory && <section aria-label="Counter history"><h3>Counter visit history · {history?.total ?? 0}</h3>
      {history?.rows.map(row => <article key={row.id} className="counter-history-card"><header><strong>{row.customer}</strong><time>{new Date(row.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</time></header><b>{row.service}</b><small>{row.reference}{row.jobId ? ` · Job ID ${row.jobId}` : ""}</small><p>Bill {rupees(row.billPaise)} · wallet used {rupees(row.discountPaise)} · earned {rupees(row.earnedPaise)} · collect {rupees(row.collectPaise)}</p>
        {row.paymentStatus ? <p>Payment: {row.paymentStatus} · <Link href="/desk#payments">Open Payments</Link></p> : <><p className="fine">No online payment ticket. Check cash/UPI collection before raising one.</p>{history.canCharge && row.collectPaise >= 100 && <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={async () => {
          if (!window.confirm(`Raise a payment request for ${rupees(row.collectPaise)} against ${row.reference}? Confirm this amount has NOT already been collected in cash or UPI.`)) return;
          const result = await run(() => secureApi<{ reference: string; path: string }>(COUNTER_OP, { action: 'raise-payment', id: row.id }));
          if (result) { await loadHistory(historyPage); setNotice(`Payment request created: ${result.reference}. Customer can open ${window.location.origin}${result.path}.`); }
        }}>Raise payment request</button>}</>}
        {row.phone && row.paymentStatus && <a className="btn btn--ghost btn--sm" href={`https://wa.me/${row.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Namaste ${row.customer}, your NiSE COMPORT payment request for ${row.service}: ${window.location.origin}/pay/${row.reference}`)}`} target="_blank" rel="noopener noreferrer">Share payment link on WhatsApp</a>}
        <CounterVisitConversation visitId={row.id}/>
      </article>)}
      {history && history.rows.length === 0 && <p>No counter visits found.</p>}
      <nav className="inbox__pager" aria-label="Counter history pages"><button type="button" className="btn btn--ghost btn--sm" disabled={busy || historyPage === 0} onClick={() => void loadHistory(historyPage - 1)}>Previous</button><span>Page {historyPage + 1} · 10 per page</span><button type="button" className="btn btn--ghost btn--sm" disabled={busy || !history || (historyPage + 1) * 10 >= history.total} onClick={() => void loadHistory(historyPage + 1)}>Next</button></nav>
    </section>}
    {!showHistory && <>
    {isOwner && policy && <details className="admin-accordion"><summary>Counter wallet rates · owner settings</summary>
      <div className="form-grid">
        <label className="field">Deduction / discount (%)<input type="number" min="0" max="100" step="0.01" value={draftPolicy.deductionPercent} onChange={event => setDraftPolicy({ ...draftPolicy, deductionPercent: Number(event.target.value) })}/></label>
        <label className="field">Accumulation / cashback (%)<input type="number" min="0" max="100" step="0.01" value={draftPolicy.accumulationPercent} onChange={event => setDraftPolicy({ ...draftPolicy, accumulationPercent: Number(event.target.value) })}/></label>
      </div><button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={() => void savePolicy()}>Save wallet rates</button>
      <p className="fine">Applies to future counter visits. Deduction is selected by default. An empty wallet earns credit instead. Spending and earning never stack on one visit.</p>
    </details>}
    <div className="counter-desk__grid">
      <div className="counter-desk__entry">
        <div className="counter-desk__modes" role="group" aria-label="Search by">
          <button type="button" className={mode === "mobile" ? "is-active" : undefined} aria-pressed={mode === "mobile"} onClick={() => switchMode("mobile")}>Mobile</button>
          <button type="button" className={mode === "email" ? "is-active" : undefined} aria-pressed={mode === "email"} onClick={() => switchMode("email")}>Email</button>
        </div>
        <label className="field"><span className="field__label">{mode === "mobile" ? "Customer mobile" : "Customer email"}</span>
          <span className="counter-desk__lookup">
            <input type={mode === "mobile" ? "tel" : "email"} inputMode={mode === "mobile" ? "numeric" : "email"} autoComplete="off" value={lookupText}
              placeholder={mode === "mobile" ? "98765 43210" : "name@example.com"} maxLength={mode === "mobile" ? 14 : 120} aria-describedby="counter-lookup-hint"
              onChange={(event) => changeLookup(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void findCustomer(); } }}/>
            <button type="button" className="btn btn--ghost btn--sm" disabled={looking || !lookupReady} onClick={() => void findCustomer()} aria-busy={looking}>
              {looking ? <><Loader2 size={15} className="counter-desk__spin" aria-hidden="true"/> Looking up…</> : "Look up"}
            </button>
          </span>
          <span id="counter-lookup-hint" className="field__hint">{mode === "mobile" ? "Enter the 10 digits only." : "Type the full email address."}</span>
        </label>

        {lookup && <>
          <label className="field" style={{ marginTop: 10 }}><span className="field__label">Service</span>
            <div className="counter-service-input"><input value={serviceText} placeholder="Type to search, then Enter" autoComplete="off" role="combobox" aria-controls="counter-service-options" aria-expanded={!service}
              onChange={(event) => { setServiceText(event.target.value); setService(null); setHighlight(0); }}
              onKeyDown={onServiceKey}/>
              {(serviceText || service) && <button type="button" className="counter-service-clear" aria-label="Clear selected service" title="Choose another service" disabled={busy} onClick={() => { setServiceText(""); setService(null); setHighlight(0); }}><X size={16}/></button>}
            </div>
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

          <label className="check-row" style={{ marginTop: 12 }}><input type="checkbox" checked={accumulate} onChange={event => setAccumulate(event.target.checked)} disabled={busy}/>Accumulate {policy?.accumulationPercent ?? 5}% in wallet instead of taking the discount</label>
          <p className="fine">Unchecked: use up to {policy?.deductionPercent ?? 10}% from the existing wallet. Empty wallet: pay the full bill and earn {policy?.accumulationPercent ?? 5}% for later.</p>
          <button type="button" className="btn btn--primary" style={{ marginTop: 12 }} disabled={busy || !policy} onClick={() => void recordVisit()}>{busy ? "Recording…" : "Record visit"}</button>

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
        {!lookup && <p className="muted">Enter a mobile number or email and press Look up. The customer, their verified contacts, wallet balance and the bill summary appear here.</p>}
        {lookup?.ambiguous && <div className="counter-desk__card" role="group" aria-label="Select matching customer account">
          <h3>Choose the correct account</h3>
          <p className="muted">This phone is shared by several people. Select the correct account; nothing will be merged automatically.</p>
          <div className="counter-account-choices">
            {(lookup.candidates ?? []).map((candidate) => <button type="button" className="btn btn--ghost btn--sm" key={candidate.id} disabled={looking || busy}
              onClick={() => void chooseCustomer(candidate.id)}>
              <b>{candidate.name}</b><small>{candidate.email ?? "Mobile-only profile"} · {candidate.role}</small>
            </button>)}
          </div>
        </div>}
        {lookup && !lookup.ambiguous && <>
          <div className="counter-desk__card">
            {lookup.customer
              ? <><b>{lookup.customer.name}</b><div className="muted">{shownPhone(lookup.contact?.phone ?? null) ?? "No mobile on account"} · wallet <b>{rupees(lookup.balancePaise)}</b></div>
                  <button type="button" className="btn btn--ghost btn--sm" style={{ marginTop: 10 }} disabled={busy}
                    onClick={() => { setEditingDetails((value) => !value); setEditName(lookup.customer!.name); setEditEmail(lookup.contact?.email ?? ""); }}>
                    {editingDetails ? "Close customer editor" : "Correct name / email"}
                  </button>
                  {editingDetails && <div className="counter-correction">
                    <p className="muted">Changes apply only to this selected customer account. Existing counter history is preserved.</p>
                    <label className="field"><span className="field__label">Customer name</span><input maxLength={100} value={editName} disabled={busy} onChange={(e) => setEditName(e.target.value)}/></label>
                    <label className="field"><span className="field__label">Email (optional)</span><input type="email" maxLength={254} value={editEmail} disabled={busy} placeholder="name@example.com" onChange={(e) => setEditEmail(e.target.value)}/></label>
                    <button type="button" className="btn btn--primary btn--sm" disabled={busy || !editName.trim() || (editName.trim() === lookup.customer.name && editEmail.trim() === (lookup.contact?.email ?? ""))}
                      onClick={() => void saveCustomerDetails()}>{busy ? "Saving…" : "Save customer details"}</button>
                  </div>}
                </>
              : <>
                <label className="field"><span className="field__label">Customer’s name (new number)</span>
                  <input value={newName} onChange={(event) => setNewName(event.target.value)} autoComplete="off"/>
                </label>
                <label className="field" style={{ marginTop: 8 }}><span className="field__label">Email (optional)</span>
                  <input type="email" inputMode="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value.trim())} autoComplete="off" placeholder="name@example.com"/>
                </label>
                <span className="field__hint">New numbers get a profile. The name goes on the receipt and the customer’s record.</span>
              </>}
          </div>

          {lookup.customer && lookup.contact && <div className="counter-contact">
            <ContactCheck label="Email" value={lookup.contact.email} verified={lookup.contact.emailVerified}/>
            <ContactCheck label="Mobile" value={shownPhone(lookup.contact.phone)} verified={lookup.contact.phoneVerified}/>
            <p className="fine">Verification status is read-only here. Manage verification in Find customer or the customer’s profile.</p>
          </div>}

          {billPaise > 0 && <dl className="summary" style={{ marginTop: 10 }}>
            <div><dt>Bill</dt><dd>{rupees(billPaise)}</dd></div>
            <div><dt>{policy?.deductionPercent ?? 10}% off, from wallet</dt><dd>{rupees(previewDiscount)}</dd></div>
            <div><dt>Wallet credit earned</dt><dd>{rupees(preview.earnedPaise)}</dd></div>
            <div><dt>Customer pays</dt><dd><b>{rupees(billPaise - previewDiscount)}</b></dd></div>
          </dl>}

          {lookup.visitsTotal > 0 && <>
            <h3 className="counter-desk__subhead">Recent visits ({lookup.visitsTotal})</h3>
            <ul className="counter-desk__visits">
              {lookup.visits.map((visit) => <li key={visit.id}>
                <b>{visit.serviceName}</b> · {when(visit.createdAt)}<br/>
                <CounterVisitConversation visitId={visit.id}/>
                <small>Bill {rupees(visit.billPaise)} · wallet {rupees(visit.walletPaise)} · collect {rupees(visit.collectPaise)}</small>
              </li>)}
            </ul>
            {lookup.visitsTotal > lookup.pageSize && <div className="counter-pager">
              <button type="button" className="btn btn--ghost btn--sm" disabled={looking || lookup.page === 0} onClick={() => void findCustomer(lookup.page - 1)}>Newer</button>
              <span className="muted">Page {lookup.page + 1} of {Math.ceil(lookup.visitsTotal / lookup.pageSize)}</span>
              <button type="button" className="btn btn--ghost btn--sm" disabled={looking || (lookup.page + 1) * lookup.pageSize >= lookup.visitsTotal} onClick={() => void findCustomer(lookup.page + 1)}>Older</button>
            </div>}
          </>}
        </>}
      </aside>
    </div>

    {error && <p className="alert alert--error" role="alert" style={{ marginTop: 12 }}>{error}</p>}


    {<section className="counter-approvals" aria-label="Wallet credit approvals">
    <details open={pending.length > 0}>
    <summary><b>Wallet credits to approve</b> <span className="counter-approvals__count">{pending.length}</span></summary>
    <p className="muted counter-approvals__hint">{!canApprove ? "You can reject a credit. Only an admin can approve it." : mainOwner ? "As the main owner you can approve any credit, including your own." : "A second admin approves each credit. You can’t approve your own request."}</p>
    {pending.length === 0 && <p className="muted">Nothing waiting.</p>}
    <ul className="counter-approvals__list">
      {pending.map((item) => <li key={item.id}>
        <div><b>{item.customerName}</b>{item.customerPhone ? ` · ${item.customerPhone}` : ""} · <b>{rupees(Math.round(Number(item.amount) * 100))}</b></div>
        <small className="muted">{item.reason} · by {item.requestedBy} · {when(item.requestedAt)}</small>
        {canApprove && item.requestedById === me && !mainOwner
          ? <p className="muted" style={{ margin: "6px 0 0" }}>Waiting for another admin to approve.</p>
          : <div className="counter-approvals__actions">
            <input placeholder="Note (optional)" value={decisionNotes[item.id] ?? ""} maxLength={300}
              onChange={(event) => setDecisionNotes((current) => ({ ...current, [item.id]: event.target.value }))}/>
            {canApprove && <button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={() => void decide(item.id, "approve")}>Approve</button>}
            <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => void decide(item.id, "reject")}>Reject</button>
          </div>}
      </li>)}
    </ul>

    {decided.length > 0 && <>
      <h3 className="counter-desk__subhead">Recent decisions</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {decided.map((item) => <li key={item.id} style={{ padding: "6px 0" }}>
          <small><b>{item.status === "approved" ? "Approved" : "Rejected"}</b> · {item.customerName} · {rupees(Math.round(Number(item.amount) * 100))} · {item.reason}<br/>
          Requested by {item.requestedBy}{item.decidedBy ? `, decided by ${item.decidedBy}` : ""}{item.decidedAt ? ` · ${when(item.decidedAt)}` : ""}{item.decisionNote ? ` · “${item.decisionNote}”` : ""}</small>
        </li>)}
      </ul>
    </>}
    </details>
    </section>}
    </>}
  </div>;
}
