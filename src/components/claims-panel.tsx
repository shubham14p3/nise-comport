"use client";

import { Check, Copy, KeyRound, MessageCircle, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";
import { checkMobile, typedMobile } from "@/lib/mobile-login-core";
import type { StaffClaim, StaffFlag } from "@/lib/claims";

type Data = { claims: StaffClaim[]; flags: StaffFlag[] };
type Code = { id: string; code: string; message: string; whatsappUrl: string };
const when = (value: string) => new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** Admin inbox: customers waiting to see their records, "this isn't me" reports, and PIN resets. */
export default function ClaimsPanel({ onChange }: { onChange?: () => void }) {
  const [data, setData] = useState<Data | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState("");
  const [code, setCode] = useState<Code | null>(null); const [copied, setCopied] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [resetPhone, setResetPhone] = useState(""); const [resetResult, setResetResult] = useState("");

  const load = useCallback(async () => {
    try { setData(await secureApi<Data>("Z2n5G8yL6bK3")); setError(""); } catch { setHidden(true); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function act(action: "approve" | "reject" | "code" | "resolve", id: string) {
    setBusy(id + action); setError("");
    try {
      const result = await secureApi<Partial<Code>>("F8q3V6cW1tN7", { action, id });
      if (action === "code" && result.code && result.message && result.whatsappUrl) setCode({ id, code: result.code, message: result.message, whatsappUrl: result.whatsappUrl });
      await load(); onChange?.();
    } catch (e) { setError(e instanceof Error ? e.message : "That did not work."); }
    finally { setBusy(""); }
  }

  async function reset() {
    const mobile = checkMobile(resetPhone);
    if (!mobile.ok) { setResetResult(mobile.error); return; }
    setBusy("reset"); setResetResult("");
    try { const result = await secureApi<{ pin: string; name: string }>("F8q3V6cW1tN7", { action: "reset-pin", phone: mobile.digits }); setResetResult(`New PIN for ${result.name}: ${result.pin}. Send it to them on WhatsApp.`); }
    catch (e) { setResetResult(e instanceof Error ? e.message : "Could not reset."); }
    finally { setBusy(""); }
  }

  async function copy(text: string) { try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { /* select and copy by hand */ } }

  // Staff without the Records permission simply do not see this block.
  if (hidden || !data) return null;
  return <section className="claims" aria-label="Record requests">
    <h3 className="inbox__feed-title">Waiting to see their records{data.claims.length ? ` · ${data.claims.length}` : ""}</h3>
    {error && <p role="alert" className="form-error">{error}</p>}
    {!data.claims.length && <p className="muted">Nobody is waiting. When a customer signs in with a number that is in your records, they appear here.</p>}
    <div className="claims__list">{data.claims.map((claim) => <article key={claim.id} className={`claim-card${claim.waiting ? " is-overdue" : ""}`}>
      <header><b>{claim.name}</b>{claim.waiting && <span className="chip chip--warn">Waiting 2+ days</span>}</header>
      <dl>
        <div><dt>Mobile</dt><dd>{claim.mobile}</dd></div>
        {claim.email && <div><dt>Email</dt><dd>{claim.email}</dd></div>}
        <div><dt>PIN</dt><dd>{claim.pin ?? "—"}</dd></div>
        <div><dt>Records found</dt><dd>{claim.matched}</dd></div>
        <div><dt>Asked</dt><dd>{when(claim.createdAt)}</dd></div>
        <div><dt>Expires</dt><dd>{when(claim.expiresAt)}</dd></div>
      </dl>
      <div className="claim-card__actions">
        <button type="button" className="btn btn--primary btn--sm" disabled={Boolean(busy)} onClick={() => void act("approve", claim.id)}><Check size={15}/>Approve</button>
        <button type="button" className="btn btn--ghost btn--sm" disabled={Boolean(busy)} onClick={() => void act("code", claim.id)}><MessageCircle size={15}/>{claim.codeSent ? "New WhatsApp code" : "Send code on WhatsApp"}</button>
        <button type="button" className="btn btn--ghost btn--sm" disabled={Boolean(busy)} onClick={() => { if (window.confirm(`Reject ${claim.name}? They will not see any records.`)) void act("reject", claim.id); }}><X size={15}/>Reject</button>
      </div>
      {code?.id === claim.id && <div className="claim-card__code">
        <p>Code <b>{code.code}</b> (valid 48 hours). Send this message on WhatsApp:</p>
        <pre>{code.message}</pre>
        <div className="claim-card__actions">
          <a className="btn btn--primary btn--sm" href={code.whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={15}/>Open WhatsApp</a>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => void copy(code.message)}>{copied ? <Check size={15}/> : <Copy size={15}/>}{copied ? "Copied" : "Copy message"}</button>
        </div>
      </div>}
    </article>)}</div>

    {data.flags.length > 0 && <>
      <h3 className="inbox__feed-title">&ldquo;This isn&rsquo;t me&rdquo; reports · {data.flags.length}</h3>
      <div className="claims__list">{data.flags.map((flag) => <article key={flag.id} className="claim-card is-overdue">
        <header><b>{flag.name}</b><span className="muted">{when(flag.createdAt)}</span></header>
        <p>{flag.service ? `Says a ${flag.service} record is not theirs.` : "Says their records are not theirs."} {flag.mobile ?? ""}{flag.note ? ` · “${flag.note}”` : ""}</p>
        <div className="claim-card__actions"><button type="button" className="btn btn--ghost btn--sm" disabled={Boolean(busy)} onClick={() => void act("resolve", flag.id)}><Check size={15}/>Mark as handled</button></div>
      </article>)}</div>
    </>}

    <details className="claims__reset"><summary><KeyRound size={15}/> Reset a customer&rsquo;s PIN</summary>
      <div className="claims__reset-row">
        <span className="input-wrap"><span className="input-prefix">+91</span><input inputMode="numeric" maxLength={14} value={resetPhone} onChange={(e) => setResetPhone(typedMobile(e.target.value))} placeholder="Customer mobile"/></span>
        <button type="button" className="btn btn--ghost btn--sm" disabled={busy === "reset"} onClick={() => void reset()}>Make a new PIN</button>
      </div>
      {resetResult && <p role="status">{resetResult}</p>}
    </details>
  </section>;
}
