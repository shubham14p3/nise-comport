"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import { secureApi } from "@/lib/secure-api-client";

/** Owner only, in the header next to the name. Opens a customer's account for 30 minutes to help with a problem. */
export default function OwnerSwitch() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) { if (wrap.current && !wrap.current.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(""); setBusy(true);
    try {
      await secureApi("H5w2Zc8nR3vK", { email: email.trim() });
      setOpen(false); setEmail("");
      router.push("/profile"); router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not open that account.");
    } finally { setBusy(false); }
  }

  return (
    <div className="owner-switch" ref={wrap}>
      <button type="button" className="owner-switch__btn" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Switch user" title="Switch user">
        <ArrowLeftRight size={16}/>
      </button>
      {open ? (
        <form className="owner-switch__panel" onSubmit={submit}>
          <label htmlFor="owner-switch-email">View a customer’s account</label>
          <p>30 minutes, shown in a banner, and logged. Password, email and deletion are blocked during the view.</p>
          <input id="owner-switch-email" type="text" inputMode="text" autoComplete="off" required maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com or 98765 43210"/>
          <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? "Opening…" : "Open account"}</button>
          {error ? <p role="alert" className="owner-switch__error">{error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
