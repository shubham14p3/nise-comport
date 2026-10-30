"use client";

import { useEffect, useState } from "react";

/**
 * Admin → one request, one step at a time: Review → Check → Quote → Payment → Official reference → Done.
 * Each step shows only its own action. Typed text is kept in this browser per request (so a page
 * reload, a closed tab or a session check does not lose it) and cleared after a successful save.
 */

type Draft = { reviewNote: string; serviceFee: string; externalFee: string; quoteNote: string; officialRef: string; officialRefLabel: string };
const EMPTY: Draft = { reviewNote: "", serviceFee: "", externalFee: "0", quoteNote: "", officialRef: "", officialRefLabel: "" };
const STEPS = [
  { key: "review", label: "Review" }, { key: "check", label: "Check" }, { key: "quote", label: "Quote" },
  { key: "payment", label: "Payment" }, { key: "reference", label: "Reference" }, { key: "done", label: "Done" },
] as const;
type StepKey = (typeof STEPS)[number]["key"];

const draftKey = (reference: string) => `nc-flow-draft:${reference}`;
function readDraft(reference: string): Draft {
  try { const raw = window.localStorage.getItem(draftKey(reference)); return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) } : EMPTY; } catch { return EMPTY; }
}
function writeDraft(reference: string, draft: Draft) {
  try {
    if (JSON.stringify(draft) === JSON.stringify(EMPTY)) window.localStorage.removeItem(draftKey(reference));
    else window.localStorage.setItem(draftKey(reference), JSON.stringify(draft));
  } catch { /* private mode or storage full: the page still works */ }
}

export function stepOf(status: string, approved: boolean): StepKey {
  if (status === "completed" || status === "cancelled") return "done";
  if (["payment_received", "ready_for_pickup", "out_for_delivery"].includes(status)) return "reference";
  if (status === "awaiting_payment") return "payment";
  if (status === "waiting_for_customer") return "check";
  if (status === "reviewing") return approved ? "quote" : "check";
  return "review";
}

export type FlowDetail = {
  request: { reference: string; status: string; officialReference: string | null; officialReferenceLabel: string | null; officialReferenceSetAt: string | null; details: Record<string, unknown> };
};

export default function RequestFlow({ detail, busy, canQuote, onStart, onReview, onQuote, onOfficialRef }: {
  detail: FlowDetail; busy: boolean; canQuote: boolean;
  onStart: () => Promise<boolean>;
  onReview: (action: "changes" | "approve", note: string) => Promise<boolean>;
  onQuote: (serviceFee: number, externalFee: number, note: string) => Promise<boolean>;
  onOfficialRef: (reference: string, label: string) => Promise<boolean>;
}) {
  const { reference, status } = detail.request;
  const approved = Boolean((detail.request.details.workflow as { approvedAt?: string } | undefined)?.approvedAt);
  const step = stepOf(status, approved);
  const index = STEPS.findIndex((item) => item.key === step);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [problem, setProblem] = useState("");

  // Load the saved draft whenever another request is opened.
  useEffect(() => {
    // Deferred one tick so no state is set synchronously inside the effect body.
    const timer = window.setTimeout(() => { setDraft(readDraft(reference)); setProblem(""); }, 0);
    return () => window.clearTimeout(timer);
  }, [reference]);

  // Warn before leaving with unsaved typing.
  const dirty = JSON.stringify(draft) !== JSON.stringify(EMPTY);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function change(patch: Partial<Draft>) {
    setDraft((previous) => { const next = { ...previous, ...patch }; writeDraft(reference, next); return next; });
  }
  async function done(ok: boolean, reset: Partial<Draft>) {
    if (!ok) return;
    const next = { ...draft, ...reset };
    setDraft(next); writeDraft(reference, next);
  }

  async function quote() {
    const service = Number(draft.serviceFee), external = Number(draft.externalFee);
    if (!Number.isFinite(service) || !Number.isFinite(external) || service < 0 || external < 0 || service + external < 1 || service + external > 500000) {
      setProblem("Enter the service fee and official fee in rupees. The total must be at least ₹1."); return;
    }
    setProblem("");
    await done(await onQuote(service, external, draft.quoteNote.trim()), { serviceFee: "", externalFee: "0", quoteNote: "" });
  }

  return <div className="request-flow" aria-label="Request steps">
    <div className="case-flow__steps">{STEPS.map((item, i) => <div key={item.key} className={i < index ? "is-done" : i === index ? "is-current" : undefined} aria-current={i === index ? "step" : undefined}><span>{i + 1}</span><small>{item.label}</small></div>)}</div>

    {step === "review" && <div className="case-flow__actions">
      <h3>Step 1 of 6 · Review</h3>
      <p>Read the customer&apos;s details below. When you start, the customer sees that their request is being checked.</p>
      <div className="case-flow__buttons"><button type="button" className="btn btn--primary" disabled={busy} onClick={() => void onStart()}>Start review</button></div>
    </div>}

    {step === "check" && <div className="case-flow__actions">
      <h3>Step 2 of 6 · Check the details</h3>
      {status === "waiting_for_customer"
        ? <p>Waiting for the customer to reply. Their answer and any documents bring this request back to review.</p>
        : <>
          <p>Is everything needed here? If not, say exactly what is missing. The customer gets your note.</p>
          <label className="field"><span className="field__label">Missing details or documents (required when asking for more)</span>
            <textarea rows={3} maxLength={500} value={draft.reviewNote} onChange={(event) => change({ reviewNote: event.target.value })} placeholder="e.g. Please send a clear photo of the Aadhaar back side."/></label>
          <div className="case-flow__buttons">
            <button type="button" className="btn btn--ghost" disabled={busy || draft.reviewNote.trim().length < 5} onClick={() => void onReview("changes", draft.reviewNote.trim()).then((ok) => done(ok, { reviewNote: "" }))}>Ask customer for more</button>
            <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void onReview("approve", draft.reviewNote.trim()).then((ok) => done(ok, { reviewNote: "" }))}>Details are complete</button>
          </div>
        </>}
    </div>}

    {step === "quote" && !canQuote && <div className="case-flow__actions">
      <h3>Step 3 of 6 · Quote</h3>
      <p>Waiting for someone with payment-request access to send the quote. You can still check the details and the official reference.</p>
    </div>}
    {step === "quote" && canQuote && <div className="case-flow__quote">
      <h3>Step 3 of 6 · Quote</h3>
      <div className="admin-filters">
        <label>Service fee (₹)<input inputMode="decimal" type="number" step="0.01" min="0" max="500000" value={draft.serviceFee} onChange={(event) => change({ serviceFee: event.target.value })}/></label>
        <label>Official / external fee (₹)<input inputMode="decimal" type="number" step="0.01" min="0" max="500000" value={draft.externalFee} onChange={(event) => change({ externalFee: event.target.value })}/></label>
      </div>
      <label className="field"><span className="field__label">Note for the customer (optional)</span><input maxLength={200} value={draft.quoteNote} onChange={(event) => change({ quoteNote: event.target.value })} placeholder="How the charges are calculated"/></label>
      <p><b>Amount to request: ₹{((Number(draft.serviceFee) || 0) + (Number(draft.externalFee) || 0)).toFixed(2)}</b> · Promo discounts show on the customer&apos;s payment page.</p>
      {problem && <p className="form-error" role="alert">{problem}</p>}
      <div className="case-flow__buttons"><button type="button" className="btn btn--primary" disabled={busy} onClick={() => void quote()}>Send payment request</button></div>
    </div>}

    {step === "payment" && <div className="case-flow__actions">
      <h3>Step 4 of 6 · Waiting for payment</h3>
      <p>The quote is with the customer. Pay by UPI or the gateway. Payment is confirmed in <b>Payments</b> after you check it, not assumed.</p>
    </div>}

    {step === "reference" && <div className="case-flow__actions">
      <h3>Step 5 of 6 · Official reference</h3>
      <p className="admin-note">{reference} is our own tracking number. When the government portal or insurer gives you their application, certificate or policy number, enter it here. The customer gets it by email and WhatsApp.</p>
      {detail.request.officialReference && <p>Saved now: <b>{detail.request.officialReference}</b>{detail.request.officialReferenceLabel ? ` (${detail.request.officialReferenceLabel})` : ""}</p>}
      <div className="admin-filters">
        <label>What is it<input value={draft.officialRefLabel} onChange={(event) => change({ officialRefLabel: event.target.value })} placeholder="e.g. ServicePlus application no., EPIC no., Policy no." maxLength={60}/></label>
        <label>Official number<input value={draft.officialRef} onChange={(event) => change({ officialRef: event.target.value })} placeholder="Official number" maxLength={80}/></label>
      </div>
      <div className="case-flow__buttons"><button type="button" className="btn btn--primary" disabled={busy || !draft.officialRef.trim()} onClick={() => void onOfficialRef(draft.officialRef.trim(), draft.officialRefLabel.trim()).then((ok) => done(ok, { officialRef: "", officialRefLabel: "" }))}>Save and notify customer</button></div>
    </div>}

    {step === "done" && <div className="case-flow__actions">
      <h3>Step 6 of 6 · Done</h3>
      <p>{status === "completed" ? "This request is completed." : "This request is closed."}</p>
    </div>}
  </div>;
}
