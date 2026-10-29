"use client";

import { useState, type KeyboardEvent } from "react";
import { Loader2, Search } from "lucide-react";
import { secureApi, SecureApiError } from "@/lib/secure-api-client";

/** Opaque gateway code for customer search and sign-in help (mapped in src/app/api/x7q9m2/route.ts). */
const CUSTOMERS_OP = "F8k3Q2mW9xLz";

type Customer = {
  id: string; name: string; email: string | null; phone: string | null;
  emailVerified: boolean; phoneVerified: boolean; mustChangePassword: boolean; createdAt: string;
};

const when = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });

function Badge({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return <span className={ok ? "fc-badge fc-badge--ok" : "fc-badge"}>{ok ? `✓ ${yes}` : no}</span>;
}

/**
 * Find a customer by email or mobile number. Shows each match with its verification state, and
 * lets staff set a temporary password or resend the email code. The mobile code is not connected yet.
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
  const [editing, setEditing] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

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
    setEditing(false);
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

  function startEdit() {
    if (!selected) return;
    setEditEmail(selected.email ?? "");
    setEditPhone(selected.phone ? selected.phone.replace(/^\+91/, "") : "");
    setEditing(true);
  }

  async function saveContact() {
    if (!selected) return;
    const result = await run(() => secureApi<{ changed: boolean }>(CUSTOMERS_OP, {
      action: "update-contact", id: selected.id, email: editEmail, phone: editPhone,
    }));
    if (!result) return;
    setEditing(false);
    setNotice(result.changed ? "Contact details saved. A changed email or mobile must be verified again." : "Nothing changed.");
    await search();
  }

  async function setVerified(channel: "email" | "phone", verified: boolean) {
    if (!selected) return;
    const label = channel === "email" ? "email" : "mobile number";
    if (!window.confirm(`${verified ? "Mark" : "Unmark"} ${selected.name}’s ${label} as verified? This is recorded in the activity log.`)) return;
    const result = await run(() => secureApi<{ ok: boolean }>(CUSTOMERS_OP, { action: "set-verified", id: selected.id, channel, verified }));
    if (!result) return;
    setNotice(`${channel === "email" ? "Email" : "Mobile"} ${verified ? "marked as verified" : "verification cleared"} for ${selected.name}.`);
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

  return <section aria-label="Find customer">
    <div className="admin-panel-title"><div>
      <p className="fc-note" role="note"><b>Note:</b> Admins can change a customer’s email or mobile number here. Every change is logged, and a changed email or number must be verified again.</p>
      <h2>Find customer</h2><p>Search by email or mobile number. Every change here is recorded in the activity log.</p>
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
            <button type="button" className={`fc-item${item.id === selectedId ? " is-selected" : ""}`} aria-pressed={item.id === selectedId} onClick={() => { setSelectedId(item.id); setIssued(null); setNotice(""); setEditing(false); }}>
              <b>{item.name}</b><br/>
              <small className="muted">{item.email ?? "No email"} · {item.phone ? `+91 ${item.phone.replace(/^\+91/, "")}` : "No mobile"}</small>
            </button>
          </li>)}
        </ul>
      </div>

      {selected ? <div className="fc-card">
        <h3 style={{ margin: "0 0 2px" }}>{selected.name}</h3>
        <small className="muted">Customer since {when(selected.createdAt)}</small>
        <div className="fc-badges">
          <Badge ok={selected.emailVerified} yes="Email verified" no={selected.email ? "Email not verified" : "No email on account"}/>
          <Badge ok={selected.phoneVerified} yes="Mobile verified" no={selected.phone ? "Mobile not verified" : "No mobile on account"}/>
          {selected.mustChangePassword && <span className="fc-badge">Must change password at sign-in</span>}
        </div>
        <p style={{ margin: "4px 0" }}><small>Email: {selected.email ?? "—"}</small><br/><small>Mobile: {selected.phone ? `+91 ${selected.phone.replace(/^\+91/, "")}` : "—"}</small></p>

        <div className="fc-section">
          <b>Email and mobile</b>
          {editing ? <>
            <div className="fc-edit">
              <label className="fc-field"><span>Email</span>
                <input type="email" value={editEmail} autoComplete="off" placeholder="name@example.com" onChange={(event) => setEditEmail(event.target.value.slice(0, 120))}/></label>
              <label className="fc-field"><span>Mobile (10 digits)</span>
                <input type="tel" inputMode="numeric" value={editPhone} autoComplete="off" placeholder="98765 43210" maxLength={10}
                  onChange={(event) => setEditPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}/></label>
            </div>
            <p className="muted" style={{ margin: "6px 0 8px" }}>A changed email or mobile is marked unverified. Verify it again below once you have checked it. The old email is told about the change.</p>
            <div className="fc-row">
              <button type="button" className="btn btn--primary btn--sm" disabled={busy} aria-busy={busy} onClick={() => void saveContact()}>Save changes</button>
              <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </> : <div className="fc-row">
            <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={startEdit}>Edit email or mobile</button>
          </div>}
        </div>

        <div className="fc-section">
          <b>Verification</b>
          <p className="muted" style={{ margin: "4px 0 8px" }}>Use this only after you have checked the customer yourself, for example by phone or in person.</p>
          <div className="fc-row">
            {selected.emailVerified
              ? <button type="button" className="btn btn--ghost btn--sm" disabled={busy || !selected.email} onClick={() => void setVerified("email", false)}>Clear email verification</button>
              : <button type="button" className="btn btn--ghost btn--sm" disabled={busy || !selected.email} onClick={() => void setVerified("email", true)}>Mark email verified</button>}
            {selected.phoneVerified
              ? <button type="button" className="btn btn--ghost btn--sm" disabled={busy || !selected.phone} onClick={() => void setVerified("phone", false)}>Clear mobile verification</button>
              : <button type="button" className="btn btn--ghost btn--sm" disabled={busy || !selected.phone} onClick={() => void setVerified("phone", true)}>Mark mobile verified</button>}
          </div>
        </div>

        <div className="fc-section">
          <b>Temporary password</b>
          <p className="muted" style={{ margin: "4px 0 8px" }}>The customer must change it at their next sign-in, and their current sessions end. If they have an email on the account, they get it there too.</p>
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
            <button type="button" className="btn btn--ghost btn--sm" disabled title="Coming soon">Resend SMS code</button>
            <button type="button" className="btn btn--ghost btn--sm" disabled title="Coming soon">Resend WhatsApp code</button>
          </div>
          <small className="muted">{selected.email ? "" : "Add an email to the account before a code can be sent. "}SMS and WhatsApp codes are coming soon.</small>
        </div>
      </div> : <div className="fc-card"><p className="muted" style={{ margin: 0 }}>Pick a customer on the left to see their details and actions.</p></div>}
    </div>}
  </section>;
}
