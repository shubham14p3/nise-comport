"use client";

import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { secureApi, SecureApiError } from "@/lib/secure-api-client";
import { COUNTER_DISCOUNT_PERCENT } from "@/lib/counter-rules";

/** Opaque gateway code for the counter lookup, visits, top-ups and contact checks (mapped in src/app/api/x7q9m2/route.ts). */
const COUNTER_OP = "C6d1L8wN4vXs";
/** Opaque gateway code for the second-admin approvals list and decision (mapped in the same gateway). */
const APPROVALS_OP = "W5k2P8vN4rQd";

type Service = { slug: string; title: string };
type Visit = { id: string; serviceName: string; billPaise: number; discountPaise: number; walletPaise: number; collectPaise: number; createdAt: string };
type Contact = { email: string | null; emailVerified: boolean; phone: string | null; phoneVerified: boolean };
type Lookup = { ambiguous?: boolean; candidates?: { id: string; name: string; email: string | null; role: string }[]; phone: string; customer: { id: string; name: string } | null; knownName: string | null; contact: Contact | null; balancePaise: number; visits: Visit[]; visitsTotal: number; page: number; pageSize: number };
type Recorded = { billPaise: number; discountPaise: number; collectPaise: number; balanceAfterPaise: number };
type CreditRequest = {
  id: string; amount: string; reason: string; status: "pending" | "approved" | "rejected"; requestedAt: string; requestedById: string;
  decidedAt: string | null; decisionNote: string | null; customerName: string; customerPhone: string | null; requestedBy: string; decidedBy: string | null;
};
type Channel = "email" | "phone";
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
function ContactCheck({ label, value, verified, children }: { label: string; value: string | null; verified: boolean; children?: ReactNode }) {
  return <div className="counter-contact__row">
    <div className="counter-contact__top">
      <span className="counter-contact__label">{label}</span>
      <span className="counter-contact__value">{value ?? <em>Not added. Add it in Find customer.</em>}</span>
      {value && <span className={verified ? "counter-contact__ok" : "counter-contact__no"}>{verified ? <><Check size={14} aria-hidden="true"/> Verified</> : "Not verified"}</span>}
    </div>
    {value && !verified && children}
  </div>;
}

/**
 * Owner's counter desk, shown in a popup. Left: search by mobile (default) or email, pick the service and
 * the amount. Right: the customer, their email and mobile with verified ticks, the live bill summary and recent visits.
 */
export default function CounterDesk({ services }: { services: Service[]; isOwner?: boolean }) {
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
  const [confirmChannel, setConfirmChannel] = useState<Channel | null>(null);
  const [confirmTicked, setConfirmTicked] = useState(false);
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [codeValue, setCodeValue] = useState("");

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

  function resetContact() { setConfirmChannel(null); setConfirmTicked(false); setCodeSentTo(null); setCodeValue(""); }

  function switchMode(next: Mode) {
    setMode(next); setLookupText(""); setLookup(null); setSelectedAccountId(null); setEditingDetails(false); setNotice(""); setError(""); resetContact();
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
        resetContact();
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

  /** A contact action for the open customer. Refreshes the card afterwards, then shows the message. */
  async function contactAction(body: Record<string, unknown>, done: string) {
    if (!lookup?.customer) return;
    const result = await run(() => secureApi(COUNTER_OP, { ...body, userId: lookup.customer!.id }));
    if (!result) return;
    resetContact();
    await findCustomer(lookup.page);
    setNotice(done);
  }

  async function sendCode() {
    if (!lookup?.customer) return;
    const result = await run(() => secureApi<{ sentTo: string | null }>(COUNTER_OP, { action: "code-send", userId: lookup.customer!.id }));
    if (!result) return;
    setCodeSentTo(result.sentTo);
    setCodeValue("");
    setNotice("Code sent. Ask the customer to read it out.");
  }

  async function checkCode() {
    if (!lookup?.customer) return;
    const result = await run(() => secureApi(COUNTER_OP, { action: "code-check", userId: lookup.customer!.id, code: codeValue.trim() }));
    if (!result) return;
    resetContact();
    await findCustomer(lookup.page);
    setNotice("Email verified with the customer’s code.");
  }

  /** "The customer confirmed this in front of me" must be ticked before staff can verify on the spot. */
  function confirmBox(channel: Channel) {
    const label = channel === "email" ? "email" : "mobile number";
    return <div className="counter-contact__confirm">
      <label className="counter-contact__tick">
        <input type="checkbox" checked={confirmTicked} onChange={(event) => setConfirmTicked(event.target.checked)}/> The customer confirmed this {label} in front of me.
      </label>
      <div className="counter-contact__actions">
        <button type="button" className="btn btn--primary btn--sm" disabled={!confirmTicked || busy}
          onClick={() => void contactAction({ action: "confirm", channel }, `${label.charAt(0).toUpperCase()}${label.slice(1)} verified and recorded with your name.`)}>Verify now</button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => resetContact()}>Cancel</button>
      </div>
    </div>;
  }

  async function recordVisit() {
    if (!service) { setError("Choose a service first."); return; }
    if (!(billPaise > 0)) { setError("Enter the amount."); return; }
    if (!lookup) { setError("Look up the customer first."); return; }
    if (!lookup.phone) { setError("This customer has no mobile number. Add one in Find customer before recording a visit."); return; }
    const result = await run(() => secureApi<Recorded>(COUNTER_OP, {
      action: "visit", phone: lookup.phone, userId: lookup.customer?.id, name: lookup.customer ? undefined : newName, email: lookup.customer ? undefined : newEmail.trim() || undefined, serviceSlug: service.slug, amount: billPaise / 100,
    }));
    if (!result) return;
    setService(null); setServiceText(""); setAmount(""); setNewName(""); setNewEmail("");
    await findCustomer(0);
    setNotice(`Recorded. Customer pays ${rupees(result.collectPaise)}${result.discountPaise ? `, wallet covers ${rupees(result.discountPaise)}` : ""}. Balance now ${rupees(result.balanceAfterPaise)}.`);
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
            <ContactCheck label="Email" value={lookup.contact.email} verified={lookup.contact.emailVerified}>
              <div className="counter-contact__actions">
                <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => { setConfirmChannel("email"); setConfirmTicked(false); }}>Customer confirmed</button>
                <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => void sendCode()}>{codeSentTo ? "Send code again" : "Send code to email"}</button>
                <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => void contactAction({ action: "verify-request", channel: "email" }, "Sent to an admin for approval.")}>Ask admin to verify</button>
              </div>
              {confirmChannel === "email" && confirmBox("email")}
              {codeSentTo && <div className="counter-contact__confirm">
                <p>Code sent to {codeSentTo}. Ask the customer to read it out, then type it here.</p>
                <div className="counter-contact__actions">
                  <input inputMode="numeric" maxLength={6} value={codeValue} aria-label="6-digit code" placeholder="6-digit code"
                    onChange={(event) => setCodeValue(event.target.value.replace(/\D/g, "").slice(0, 6))}/>
                  <button type="button" className="btn btn--primary btn--sm" disabled={busy || codeValue.length !== 6} onClick={() => void checkCode()}>Check code</button>
                </div>
              </div>}
            </ContactCheck>
            <ContactCheck label="Mobile" value={shownPhone(lookup.contact.phone)} verified={lookup.contact.phoneVerified}>
              <div className="counter-contact__actions">
                <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => { setConfirmChannel("phone"); setConfirmTicked(false); }}>Customer confirmed</button>
                <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => void contactAction({ action: "verify-request", channel: "phone" }, "Sent to an admin for approval.")}>Ask admin to verify</button>
              </div>
              {confirmChannel === "phone" && confirmBox("phone")}
            </ContactCheck>
          </div>}

          {billPaise > 0 && <dl className="summary" style={{ marginTop: 10 }}>
            <div><dt>Bill</dt><dd>{rupees(billPaise)}</dd></div>
            <div><dt>{COUNTER_DISCOUNT_PERCENT}% off, from wallet</dt><dd>{rupees(previewDiscount)}</dd></div>
            <div><dt>Customer pays</dt><dd><b>{rupees(billPaise - previewDiscount)}</b></dd></div>
          </dl>}

          {lookup.visitsTotal > 0 && <>
            <h3 className="counter-desk__subhead">Recent visits ({lookup.visitsTotal})</h3>
            <ul className="counter-desk__visits">
              {lookup.visits.map((visit) => <li key={visit.id}>
                <b>{visit.serviceName}</b> · {when(visit.createdAt)}<br/>
                <small>Bill {rupees(visit.billPaise)} · wallet {rupees(visit.walletPaise)} · paid {rupees(visit.collectPaise)}</small>
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
    {notice && <p className="alert alert--info" role="status" style={{ marginTop: 12 }}>{notice}</p>}

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
  </div>;
}
