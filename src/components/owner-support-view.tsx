"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { secureApi } from "@/lib/secure-api-client";

/** Owner only. Opens a customer's account for 30 minutes to help with a problem. */
export default function OwnerSupportView() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function open(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await secureApi("H5w2Zc8nR3vK", { email: email.trim() });
      router.push("/profile"); router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not open that account.");
      setBusy(false);
    }
  }

  return (
    <section className="panel owner-support" aria-labelledby="owner-support-title">
      <h2 id="owner-support-title">View a customer’s account</h2>
      <p>Use this only to fix a customer’s problem. The view lasts 30 minutes, shows a banner while open, and every opening is logged. Passwords, email and account deletion are blocked during the view.</p>
      <form onSubmit={open} className="owner-support__form">
        <label htmlFor="support-email">Customer email</label>
        <input id="support-email" type="email" inputMode="email" autoComplete="off" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com"/>
        <button type="submit" className="btn" disabled={busy}>{busy ? "Opening…" : "Open account"}</button>
      </form>
      {error ? <p role="alert" className="owner-support__error">{error}</p> : null}
    </section>
  );
}
