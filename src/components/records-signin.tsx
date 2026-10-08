"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { secureApi } from "@/lib/secure-api-client";

/** Sign in without a password: mobile number, the name on the record, and a receipt reference or PAN number. */
export default function RecordsSignIn() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [method, setMethod] = useState<"reference" | "pan">("reference");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await secureApi<{ user: unknown }>("Rec0rdLog1nQ", { mobile, name, method, value });
      router.push("/profile");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign you in.");
    } finally { setBusy(false); }
  }

  if (!open) {
    return <div className="records-signin records-signin--closed">
      <button type="button" className="link-btn" onClick={() => setOpen(true)}>Came before? Sign in with your past record</button>
    </div>;
  }

  return <section className="records-signin" aria-labelledby="records-signin-title">
    <h2 id="records-signin-title">Sign in with your past record</h2>
    <p className="field__hint">Use the mobile number, the name on your old receipt and the reference number or PAN number from it.</p>
    <form onSubmit={submit}>
      <label className="field"><span className="field__label">Mobile number</span><input inputMode="numeric" autoComplete="tel-national" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile" required/></label>
      <label className="field"><span className="field__label">Name on the record</span><input value={name} onChange={(e) => setName(e.target.value)} minLength={2} required/></label>
      <label className="field"><span className="field__label">Check with</span>
        <select value={method} onChange={(e) => setMethod(e.target.value as "reference" | "pan")}>
          <option value="reference">Reference number on my receipt</option>
          <option value="pan">My PAN number</option>
        </select>
      </label>
      <label className="field"><span className="field__label">{method === "pan" ? "PAN number" : "Reference number"}</span><input value={value} onChange={(e) => setValue(e.target.value)} required/></label>
      {error ? <p role="alert" className="field__hint field__hint--warn">{error}</p> : null}
      <button className="btn btn--primary btn--block" disabled={busy}>{busy ? "Checking…" : "Sign in"}</button>
    </form>
  </section>;
}
