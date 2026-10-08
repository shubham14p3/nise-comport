"use client";

import { useEffect, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";

type Claim = { id: string; claimedName: string; method: string; whatsappCode: string | null; createdAt: string; userName: string; userEmail: string; userPhone: string | null; candidateNames: string[]; overdue: boolean };
const METHOD: Record<string, string> = { reference: "Reference number", pan: "PAN number", whatsapp: "WhatsApp code", staff: "Asked to check" };

/** Staff: customers asking to link past records. Approve only the exact name that is theirs. */
export default function ClaimsQueue() {
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    try { setClaims((await secureApi<{ claims: Claim[] }>("Cl4imL1st7Kw", {})).claims); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load claims."); }
  }
  useEffect(() => {
    void (async () => {
      try { setClaims((await secureApi<{ claims: Claim[] }>("Cl4imL1st7Kw", {})).claims); setError(""); }
      catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load claims."); }
    })();
  }, []);

  async function decide(claim: Claim, decision: "approve" | "reject") {
    setBusy(claim.id); setError("");
    try { await secureApi("Cl4imD3c1de7Lp", { id: claim.id, decision, matchedName: decision === "approve" ? choice[claim.id] : undefined }); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save the decision."); }
    finally { setBusy(""); }
  }

  if (!claims) return null;
  if (!claims.length) return null;
  return <section className="admin-queue claims-queue" aria-label="Claims waiting for a check">
    <h3>Claims waiting for a check <span>{claims.length}</span></h3>
    <p className="field__hint">Check the WhatsApp message (sent from their number) or the PAN/reference, then pick the exact name that is theirs. Claims older than 24 hours are marked late.</p>
    {error ? <div className="alert alert--error" role="alert">{error}</div> : null}
    <ul className="claims-queue__list">
      {claims.map((claim) => <li key={claim.id} className="claims-queue__item">
        <div><b>{claim.claimedName}</b> <small>asked {new Date(claim.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })} · {METHOD[claim.method] ?? claim.method}</small>{claim.overdue ? <span className="claims-queue__late">late</span> : null}</div>
        <small>Account: {claim.userName} · {claim.userEmail}{claim.userPhone ? ` · ${claim.userPhone}` : ""}</small>
        {claim.whatsappCode ? <small>Expected WhatsApp code: <b>{claim.whatsappCode}</b></small> : null}
        <div className="claims-queue__actions">
          <select value={choice[claim.id] ?? ""} onChange={(e) => setChoice({ ...choice, [claim.id]: e.target.value })} aria-label="Name on the records">
            <option value="">{claim.candidateNames.length ? "Pick the name on the records" : "No records under this number"}</option>
            {claim.candidateNames.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <button type="button" className="btn btn--primary btn--sm" disabled={busy === claim.id || !choice[claim.id]} onClick={() => void decide(claim, "approve")}>Link</button>
          <button type="button" className="btn btn--ghost btn--sm" disabled={busy === claim.id} onClick={() => void decide(claim, "reject")}>Reject</button>
        </div>
      </li>)}
    </ul>
  </section>;
}
