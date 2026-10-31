"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { Check, Loader2, Pencil, Search, X } from "lucide-react";
import { secureApi, SecureApiError } from "@/lib/secure-api-client";

/** Opaque gateway code for customer search and sign-in help (mapped in src/app/api/x7q9m2/route.ts). */
const CUSTOMERS_OP = "F8k3Q2mW9xLz";

type ContactChange = {
  id: string; kind: string; status: string; newEmail: string | null; newPhone: string | null; requestedAt: string; requestedById: string; requestedBy: string;
  customerName: string; customerEmail: string | null; customerPhone: string | null; decisionNote: string | null; decidedAt: string | null; decidedBy: string | null;
};

type Customer = {
  id: string; name: string; email: string | null; phone: string | null;
  emailVerified: boolean; phoneVerified: boolean; mustChangePassword: boolean; createdAt: string;
};

type Field = "email" | "phone";

const when = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });
const tenDigits = (phone: string | null) => (phone ? phone.replace(/^\+91/, "") : "");
const showPhone = (phone: string | null) => (phone ? `+91 ${tenDigits(phone)}` : null);
const kindLabel = (kind: string) => (kind === "verify-email" ? "Verify email" : kind === "verify-phone" ? "Verify mobile" : "Change email or mobile");

/** One contact line: value, verified state, and a pencil. While editing it shows the input with a tick and a cross. */
function ContactLine(props: {
  label: string; display: string | null; verified: boolean; editing: boolean; value: string; placeholder: string; numeric: boolean; busy: boolean;
  onEdit: () => void; onChange: (value: string) => void; onSave: () => void; onCancel: () => void; onToggleVerified: () => void;
}) {
  const { label, display, verified, editing, value, placeholder, numeric, busy } = props;
  function onKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") { event.preventDefault(); props.onSave(); }
    if (event.key === "Escape") props.onCancel();
  }
  return <div className="fc-line">
    <span className="fc-line__label">{label}</span>
    {editing ? <div className="fc-line__edit">
      <input type={numeric ? "tel" : "email"} inputMode={numeric ? "numeric" : "email"} value={value} placeholder={placeholder} autoComplete="off" autoFocus
        aria-label={label} maxLength={numeric ? 10 : 120} onKeyDown={onKey}
        onChange={(event) => props.onChange(numeric ? event.target.value.replace(/\D/g, "").slice(0, 10) : event.target.value.slice(0, 120))}/>
      <button type="button" className="fc-icon fc-icon--ok" aria-label={`Save ${label.toLowerCase()}`} disabled={busy} onClick={props.onSave}><Check size={16} aria-hidden="true"/></button>
      <button type="button" className="fc-icon" aria-label="Cancel" disabled={busy} onClick={props.onCancel}><X size={16} aria-hidden="true"/></button>
    </div> : <div className="fc-line__view">
      <span className="fc-line__value">{display ?? <em className="muted">Not added</em>}</span>
      {display && <span className={verified ? "fc-badge fc-badge--ok" : "fc-badge"}>{verified ? `✓ ${label} verified` : "Not verified"}</span>}
      {display && <button type="button" className="fc-link" disabled={busy} onClick={props.onToggleVerified}>{verified ? "Unverify" : "Verify"}</button>}
      <button type="button" className="fc-icon" aria-label={`Edit ${label.toLowerCase()}`} disabled={busy} onClick={props.onEdit}><Pencil size={15} aria-hidden="true"/></button>
    </div>}
  </div>;
}

/**
 * Find a customer by email or mobile number. Shows the details, lets an admin edit email or mobile
 * (staff changes wait for another admin), verify them, set a temporary password, or resend the email code.
 */
export default function FindCustomerPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [issued, setIssued] = useState<{ who: string; password: string; emailed: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editField, setEditField] = useState<Field | null>(null);
  const [editValue, setEditValue] = useState("");
  const [changes, setChanges] = useState<{ requests: ContactChange[]; me: string; isAdmin: boolean } | null>(null);
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [approvalTab, setApprovalTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const selected = results?.find((item) => item.id === selectedId) ?? null;

  async function run<T>(action: () => Promise<T>): Promise<T | null> {
    setBusy(true); setError(""); setNotice("");
    try { return await action(); }
    catch (reason) { setError(reason instanceof SecureApiError || reason instanceof Error ? reason.message : "Something went wrong. Please try again."); return null; }
    finally { setBusy(false); }
  }

  async function search(text = query) {
    const term = text.trim();
    if (term.length < 3) { setError("Type an email address or a mobile number."); return; }
    const result = await run(() => secureApi<{ customers: Customer[] }>(CUSTOMERS_OP, { action: "search", query: term }));
    if (!result) return;
    setResults(result.customers);
    setSelectedId(result.customers.length === 1 ? result.customers[0].id : null);
    setEditField(null);
    setIssued(null);
    setNotice(result.customers.length === 0 ? "No customer found with that email or mobile number." : "");
  }

  async function setTempPassword() {
    if (!selected) return;
    const result = await run(() => secureApi<{ tempPassword: string; emailed: boolean }>(CUSTOMERS_OP, {
      action: "temp-password", id: selected.id, password: password.trim() || undefined,
    }));
    if (!result) return;
    setIssued({ who: selected.name, password: result.tempPassword, emailed: result.emailed });
    setPassword("");
    await search();
  }

  async function loadChanges() {
    try { setChanges(await secureApi<{ requests: ContactChange[]; me: string; isAdmin: boolean }>(CUSTOMERS_OP, { action: "list-contact-changes" })); }
    catch { /* the list is optional; the search still works */ }
  }

  useEffect(() => {
    let active = true;
    secureApi<{ requests: ContactChange[]; me: string; isAdmin: boolean }>(CUSTOMERS_OP, { action: "list-contact-changes" })
      .then((result) => { if (active) setChanges(result); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function decideChange(id: string, decision: "approve" | "reject") {
    const result = await run(() => secureApi<{ status: string }>(CUSTOMERS_OP, {
      action: "decide-contact-change", requestId: id, decision, note: decisionNotes[id]?.trim() ?? "",
    }));
    if (!result) return;
    setDecisionNotes((current) => ({ ...current, [id]: "" }));
    await loadChanges();
    if (results) await search();
    setNotice(decision === "approve" ? "Approved. The email and mobile details are updated." : "Rejected. The customer’s details were not changed.");
  }

  function startEdit(field: Field) {
    if (!selected) return;
    setEditField(field);
    setEditValue(field === "email" ? (selected.email ?? "") : tenDigits(selected.phone));
  }

  /** Saves one field. The other field is sent unchanged. Asks "Are you sure?" first, with the new value shown. */
  async function saveField() {
    if (!selected || !editField) return;
    const value = editValue.trim();
    const label = editField === "email" ? "email address" : "mobile number";
    const shown = value ? (editField === "email" ? value : `+91 ${value}`) : "";
    const question = value ? `Are you sure? Save this ${label} as ${shown}?` : `Are you sure? This removes the ${label} from the account.`;
    if (!window.confirm(question)) return;
    const email = editField === "email" ? value : (selected.email && !selected.email.endsWith(".invalid") ? selected.email : "");
    const phone = editField === "phone" ? value : tenDigits(selected.phone);
    const result = await run(() => secureApi<{ changed: boolean; pending?: boolean }>(CUSTOMERS_OP, {
      action: "update-contact", id: selected.id, email, phone,
    }));
    if (!result) return;
    setEditField(null);
    if (result.pending) {
      await loadChanges();
      setNotice("Sent to an admin for approval. It changes only after another admin approves it.");
      return;
    }
    await search();
    setNotice(result.changed ? "Saved. A changed email or mobile must be verified again." : "Nothing changed.");
  }

  async function setVerified(channel: Field, verified: boolean) {
    if (!selected) return;
    const label = channel === "email" ? "email" : "mobile number";
    if (!window.confirm(`${verified ? "Mark" : "Unmark"} this ${label} as verified?`)) return;
    const result = await run(() => secureApi<{ ok: boolean }>(CUSTOMERS_OP, { action: "set-verified", id: selected.id, channel, verified }));
    if (!result) return;
    setNotice(`${channel === "email" ? "Email" : "Mobile"} ${verified ? "marked as verified" : "verification cleared"}.`);
    await search();
  }

  async function resendEmail() {
    if (!selected) return;
    const result = await run(() => secureApi<{ ok: boolean }>(CUSTOMERS_OP, { action: "resend-email-code", id: selected.id }));
    if (result) setNotice(`A new sign-in code was sent to ${selected.email}.`);
  }

  function onQueryKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") { event.preventDefault(); void search(); }
  }

  const emailDisplay = selected?.email ?? null;

  return <section aria-label="Find customer">
    <div className="admin-panel-title"><div>
      <p className="fc-note" role="note"><b>Note:</b> Admins change email or mobile here directly. Staff changes need another admin’s approval. Every change is logged.</p>
      <h2>Find customer</h2><p className="fc-subtitle">Search by email or mobile number. Every change here is recorded in the activity log.<br/></p>
    </div></div>

    <div className="fc-search">
      <input type="text" value={query} placeholder="Email address or 10-digit mobile" autoComplete="off" aria-label="Email or mobile number"
        onChange={(event) => setQuery(event.target.value.slice(0, 120))} onKeyDown={onQueryKey}/>
      <button type="button" className="btn btn--primary" disabled={busy} aria-busy={busy} onClick={() => void search()}>
        {busy ? <><Loader2 size={15} className="counter-desk__spin" aria-hidden="true"/> Searching…</> : <><Search size={15} aria-hidden="true"/> Search</>}
      </button>
    </div>

    {error && <p className="alert alert--error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
    {notice && <p className="alert alert--info" role="status" style={{ marginTop: 12 }}>{notice}</p>}

    {results && results.length > 0 && <div className="fc-grid" style={{ marginTop: 16 }}>
      <div>
        <p className="muted" style={{ margin: 0 }}>{results.length} found. Pick one to see details.</p>
        <ul className="fc-list">
          {results.map((item) => <li key={item.id}>
            <button type="button" className={`fc-item${item.id === selectedId ? " is-selected" : ""}`} aria-pressed={item.id === selectedId} onClick={() => { setSelectedId(item.id); setIssued(null); setNotice(""); setEditField(null); }}>
              <b>{item.name}</b><br/>
              <small className="muted">{item.email ?? "No email"} · {showPhone(item.phone) ?? "No mobile"}</small>
            </button>
          </li>)}
        </ul>
      </div>

      {selected ? <div className="fc-card">
        <h3 style={{ margin: "0 0 2px" }}>{selected.name}</h3>
        <small className="muted">Customer since {when(selected.createdAt)}</small>
        {selected.mustChangePassword && <div className="fc-badges"><span className="fc-badge">Must change password at sign-in</span></div>}

        <div className="fc-lines">
          <ContactLine label="Email" display={emailDisplay} verified={selected.emailVerified} editing={editField === "email"} value={editValue}
            placeholder="name@example.com" numeric={false} busy={busy}
            onEdit={() => startEdit("email")} onChange={setEditValue} onSave={() => void saveField()} onCancel={() => setEditField(null)}
            onToggleVerified={() => void setVerified("email", !selected.emailVerified)}/>
          <ContactLine label="Mobile" display={showPhone(selected.phone)} verified={selected.phoneVerified} editing={editField === "phone"} value={editValue}
            placeholder="98765 43210" numeric busy={busy}
            onEdit={() => startEdit("phone")} onChange={setEditValue} onSave={() => void saveField()} onCancel={() => setEditField(null)}
            onToggleVerified={() => void setVerified("phone", !selected.phoneVerified)}/>
        </div>

        <div className="fc-section">
          <b>Temporary password</b>
          <p className="muted" style={{ margin: "4px 0 8px" }}>The customer changes it at their next sign-in. Their current sessions end.</p>
          <div className="fc-row">
            <input type="text" value={password} placeholder="Leave blank to generate one" autoComplete="off" aria-label="Temporary password (optional)"
              onChange={(event) => setPassword(event.target.value.slice(0, 100))} style={{ flex: 1, minWidth: 180 }}/>
            <button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={() => void setTempPassword()}>Set temporary password</button>
          </div>
          {issued && issued.who === selected.name && <div className="fc-issued" role="status">
            <div>Temporary password for {issued.who}: <code>{issued.password}</code></div>
            <small className="muted">{issued.emailed ? "Also emailed to them." : "No email on account, so share it with them directly. It won’t be shown again."}</small>
          </div>}
        </div>

        <div className="fc-section">
          <b>Resend sign-in code</b>
          <div className="fc-row">
            <button type="button" className="btn btn--ghost btn--sm" disabled={busy || !selected.email} onClick={() => void resendEmail()}>Resend email code</button>
            <button type="button" className="btn btn--ghost btn--sm" disabled title="Not available from this panel">Resend SMS code</button>
            <button type="button" className="btn btn--ghost btn--sm" disabled title="Not available from this panel">Resend WhatsApp code</button>
          </div>
          <small className="muted">{selected.email ? "" : "Add an email to the account before a code can be sent. "}This panel resends email codes only. Customers request configured SMS/WhatsApp verification from their signed-in profile.</small>
        </div>
      </div> : <div className="fc-card"><p className="muted" style={{ margin: 0 }}>Pick a customer on the left to see their details and actions.</p></div>}
    </div>}

    {changes && <section className="fc-approvals" aria-label="Approvals">
      <div className="fc-approvals__head">
        <h3>Approvals</h3>
        <span className="muted">{changes.isAdmin ? "Staff requests wait here for an admin to decide." : "Requests you asked for wait here until an admin decides."}</span>
      </div>
      <div className="fc-tabs" role="tablist" aria-label="Filter approvals">
        {(["pending", "approved", "rejected", "all"] as const).map((tab) => {
          const count = tab === "all" ? changes.requests.length : changes.requests.filter((item) => item.status === tab).length;
          return <button key={tab} type="button" role="tab" aria-selected={approvalTab === tab} className={approvalTab === tab ? "is-active" : undefined} onClick={() => setApprovalTab(tab)}>
            {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)} <span className="fc-tabs__count">{count}</span>
          </button>;
        })}
      </div>
      {(() => {
        const shown = changes.requests.filter((item) => approvalTab === "all" || item.status === approvalTab);
        if (!shown.length) return <p className="muted">Nothing here.</p>;
        return <ul className="fc-list">
          {shown.map((item) => <li key={item.id} className="fc-change">
            <div className="fc-change__head">
              <b>{item.customerName}</b>
              <span className={`fc-pill fc-pill--${item.status}`}>{item.status === "pending" ? "Pending" : item.status === "approved" ? "Approved" : "Rejected"}</span>
            </div>
            <small className="muted">{kindLabel(item.kind)} · asked by {item.requestedBy}, {new Date(item.requestedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</small>
            <div className="fc-change__what">
              {item.kind === "change"
                ? <>
                  <small>Email: {item.customerEmail ?? "—"} → <b>{item.newEmail ?? "none"}</b></small>
                  <small>Mobile: {showPhone(item.customerPhone) ?? "—"} → <b>{showPhone(item.newPhone) ?? "none"}</b></small>
                </>
                : <small>{item.kind === "verify-email" ? `Email ${item.customerEmail ?? ""}` : `Mobile ${showPhone(item.customerPhone) ?? ""}`} to be confirmed as verified</small>}
            </div>
            {item.status !== "pending" && <small className="muted">
              {item.status === "approved" ? "Approved" : "Rejected"}{item.decidedBy ? ` by ${item.decidedBy}` : ""}{item.decidedAt ? `, ${new Date(item.decidedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}
              {item.decisionNote ? <> · <i>“{item.decisionNote}”</i></> : null}
            </small>}
            {item.status === "pending" && (changes.isAdmin && item.requestedById !== changes.me
              ? <div className="fc-row" style={{ marginTop: 8 }}>
                <input placeholder="Comment (optional)" maxLength={300} value={decisionNotes[item.id] ?? ""} aria-label="Decision comment"
                  onChange={(event) => setDecisionNotes((current) => ({ ...current, [item.id]: event.target.value }))}/>
                <button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={() => void decideChange(item.id, "approve")}>Approve</button>
                <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => void decideChange(item.id, "reject")}>Reject</button>
              </div>
              : <p className="muted" style={{ margin: "6px 0 0" }}><small>Waiting for an admin to decide.</small></p>)}
          </li>)}
        </ul>;
      })()}
    </section>}
  </section>;
}
