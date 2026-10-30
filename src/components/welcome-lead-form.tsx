"use client";

import { useState } from "react";
import Link from "next/link";
import { secureApi } from "@/lib/secure-api-client";

/** Opaque gateway code for POST /api/leads (mapped in src/app/api/x7q9m2/route.ts). */
const LEAD_OP = "Q3n7B1xK5vR8";

/** Optional "call me back" box on the welcome page. Nothing is sent until the person ticks the consent box and presses the button. */
export default function WelcomeLeadForm({ source = "qr" }: { source?: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(""); setState("busy");
    try {
      await secureApi(LEAD_OP, { name: name.trim() || undefined, phone: phone.trim(), topic: "QR welcome", message: "Asked for a call back from the welcome QR page.", page: `/welcome?src=${encodeURIComponent(source)}`, source: "form" });
      setState("done");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send."); setState("idle"); }
  }

  if (state === "done") return <p className="welcome__thanks" role="status">Thank you! Welcome to NiSE COMPORT. Our team will call or message you soon.</p>;
  return <form className="welcome__form" onSubmit={submit}>
    <h2>Prefer a call back?</h2>
    <label className="field"><span className="field__label">Your name</span><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={120}/></label>
    <label className="field"><span className="field__label">Mobile / WhatsApp number</span><input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" required minLength={6} maxLength={30}/></label>
    <label className="welcome__agree"><input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)}/> <span>I agree that NiSE COMPORT may save my name and number to contact me about my enquiry and note that I came from the QR code. See the <Link href="/privacy">privacy policy</Link>.</span></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="btn btn--primary" type="submit" disabled={!agree || !phone.trim() || state === "busy"}>{state === "busy" ? "Sending…" : "Call me back"}</button>
  </form>;
}
