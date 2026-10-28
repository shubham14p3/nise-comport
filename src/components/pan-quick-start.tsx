"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { secureApi, SecureApiError } from "@/lib/secure-api-client";

type QuickStartResult = { ok: boolean; reference: string; accountCreated: boolean; signedIn: boolean };
type Fields = Partial<Record<"name" | "phone" | "email", string>>;

/** Gateway code for POST /api/pan/quick-start (see src/app/api/x7q9m2/route.ts). */
const QUICK_START_OP = "Q4s8N2kV6wLc";

/**
 * Step 1 for a visitor: name, mobile and email open a PAN request and tell staff.
 * After it succeeds a popup offers to skip the queue and fill the full form now,
 * or wait for the staff call.
 */
export default function PanQuickStart() {
  const [values, setValues] = useState({ name: "", phone: "", email: "" });
  const [fields, setFields] = useState<Fields>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<QuickStartResult | null>(null);
  const [popup, setPopup] = useState(false);

  function update(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setFields((current) => ({ ...current, [key]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setMessage("");
    setBusy(true);
    try {
      const result = await secureApi<QuickStartResult>(QUICK_START_OP, values);
      setDone(result);
      setPopup(true);
    } catch (error) {
      const body = error instanceof SecureApiError ? (error.body as { fields?: Fields } | null) : null;
      if (body?.fields) setFields(body.fields);
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function openForm() {
    setPopup(false);
    document.getElementById("pan-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (done) {
    return <section className="container" style={{ paddingTop: 16 }} aria-live="polite">
      <div className="alert alert--info" role="status">
        <span>
          <b>Request {done.reference} is open.</b> Our team has been told and will contact you on WhatsApp or by phone.
          {done.accountCreated && " We’ve sent a code to your email so you can confirm it."}
        </span>
      </div>
      {popup && <div role="dialog" aria-modal="true" aria-labelledby="pan-quick-title" style={overlay}>
        <div className="callout" style={dialog}>
          <h2 id="pan-quick-title" style={{ marginTop: 0 }}>Skip the queue?</h2>
          <p>Our team will call you to check the details first. You can fill the full PAN form now instead, and staff will still contact you if anything is missing.</p>
          <div className="callout__actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn btn--primary" onClick={openForm}>Yes, fill the form now</button>
            <button type="button" className="btn btn--ghost" onClick={() => setPopup(false)}>No, wait for the call</button>
          </div>
        </div>
      </div>}
    </section>;
  }

  const err = (key: keyof Fields) => fields[key] ? <span className="field__error" role="alert">{fields[key]}</span> : null;

  return <section className="container" style={{ paddingTop: 16 }} aria-labelledby="pan-quick-heading">
    <h2 id="pan-quick-heading">Quick start</h2>
    <p>Share your name, mobile and email. That’s enough to open your request. Our team will reach out, and you can complete the full form after that.</p>
    <form onSubmit={submit} noValidate style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <label className="field"><span className="field__label">Full name</span>
        <input name="name" autoComplete="name" value={values.name} onChange={(e) => update("name", e.target.value)} aria-invalid={Boolean(fields.name)} />
        {err("name")}</label>
      <label className="field"><span className="field__label">Mobile number</span>
        <input name="phone" type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={(e) => update("phone", e.target.value)} aria-invalid={Boolean(fields.phone)} />
        {err("phone")}</label>
      <label className="field"><span className="field__label">Email</span>
        <input name="email" type="email" inputMode="email" autoComplete="email" value={values.email} onChange={(e) => update("email", e.target.value)} aria-invalid={Boolean(fields.email)} />
        {err("email")}</label>
      {message && <p className="alert alert--error" role="alert">{message}</p>}
      <div><button type="submit" className="btn btn--primary" disabled={busy}>{busy ? "Opening your request…" : "Start my request"}</button></div>
    </form>
  </section>;
}

const overlay: CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center", padding: 16, zIndex: 50 };
const dialog: CSSProperties = { background: "var(--surface, #fff)", maxWidth: 460, width: "100%", padding: 20, borderRadius: 12 };
