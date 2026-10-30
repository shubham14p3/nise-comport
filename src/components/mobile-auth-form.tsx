"use client";

import { ArrowRight, Check, Copy, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { checkMobile, pinProblem, typedMobile } from "@/lib/mobile-login-core";
import { passwordProblem, PASSWORD_MIN } from "@/lib/validation";
import Link from "next/link";
import { secureResult } from "@/lib/secure-api-client";
import { whatsappHref } from "@/lib/public-contact";

type Result = { error?: string; fields?: Record<string, string>; pin?: string; hasRecords?: boolean; requiresOtp?: boolean };

/** Sign in (mobile number + 6-digit PIN) or sign up (mobile number + name → a PIN is made and shown once). */
export default function MobileAuthForm({ mode, onDone, recoveryEnabled = false }: { mode: "signin" | "signup"; onDone: () => void | Promise<void>; recoveryEnabled?: boolean }) {
  const [phone, setPhone] = useState(""); const [pin, setPin] = useState(""); const [name, setName] = useState("");
  const [whatsappConsent, setWhatsappConsent] = useState(false); const [emailConsent, setEmailConsent] = useState(false);
  const [showPin, setShowPin] = useState(false); const [busy, setBusy] = useState(false); const [website, setWebsite] = useState("");
  const [password, setPassword] = useState("");
  const [credential, setCredential] = useState<"pin" | "password">("pin");
  const [pinIdentity, setPinIdentity] = useState<"mobile" | "email">("mobile");
  const [emailPin, setEmailPin] = useState("");
  const [error, setError] = useState(""); const [fields, setFields] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<{ pin: string; hasRecords: boolean } | null>(null);
  const [saved, setSaved] = useState(false); const [copied, setCopied] = useState(false);
  const submitting = useRef(false);
  const navigating = useRef(false);

  const fieldError = (key: string) => fields[key] ? <span className="field__error" role="alert">{fields[key]}</span> : null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || navigating.current) return;
    setError("");
    const problems: Record<string, string> = {};
    const byEmailPin = mode === "signin" && credential === "pin" && pinIdentity === "email";
    const mobile = byEmailPin ? null : checkMobile(phone);
    if (byEmailPin) {
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(emailPin.trim())) problems.email = "Enter your account email address.";
    } else if (mobile && !mobile.ok) problems.phone = mobile.error;
    if (mode === "signin") {
      if (credential === "pin") { const bad = pinProblem(pin); if (bad) problems.pin = bad; }
      else if (!password) problems.password = "Enter your password.";
    } else {
      if (name.trim().length < 2) problems.name = "Enter your name (at least 2 letters).";
      if (password) {
        const problem = passwordProblem(password, { name, email: "" });
        if (problem) problems.password = problem;
      }
    }
    setFields(problems);
    if (Object.keys(problems).length || (!byEmailPin && (!mobile || !mobile.ok))) return;
    submitting.current = true;
    setBusy(true);
    try {
      const passwordSignIn = mode === "signin" && credential === "password";
      const body = mode === "signin"
        ? { action: "signin", phone: byEmailPin ? emailPin.trim().toLowerCase() : mobile!.ok ? mobile.digits : "", pin, website }
        : { action: "signup", phone: mobile!.ok ? mobile.digits : "", name, ...(password ? { password } : {}), whatsappConsent, emailConsent, website };
      const { ok, result } = await secureResult<Result>(
        passwordSignIn ? "Q7m4kP2vL9sD" : "K7m2Q9xV4cT8",
        passwordSignIn ? { email: mobile && mobile.ok ? mobile.e164 : "", password } : body,
      );
      if (!ok) { setFields(result.fields ?? {}); setError(result.error ?? "Something went wrong. Please try again."); return; }
      if (mode === "signup" && result.pin) { setCreated({ pin: result.pin, hasRecords: Boolean(result.hasRecords) }); return; }
      if (result.requiresOtp) {
        setError("Your email address must be verified first. Choose email sign-in and enter the code we sent, or sign in with your existing PIN.");
        return;
      }
      navigating.current = true;
      await onDone();
    } finally {
      submitting.current = false;
      if (!navigating.current) setBusy(false);
    }
  }

  async function copyPin() {
    if (!created) return;
    try { await navigator.clipboard.writeText(created.pin); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { /* the PIN is on screen to write down */ }
  }

  if (created) return <div className="auth__form pin-reveal">
    <span className="success-card__icon"><ShieldCheck size={28}/></span>
    <h2 className="pin-reveal__title">Your PIN</h2>
    <p>This is how you sign in next time. We show it only once and keep just a scrambled copy, so write it down or take a screenshot.</p>
    <div className="pin-reveal__box" aria-live="polite"><b>{created.pin}</b><button type="button" className="btn btn--ghost btn--sm" onClick={() => void copyPin()}>{copied ? <Check size={15}/> : <Copy size={15}/>}{copied ? "Copied" : "Copy"}</button></div>
    {created.hasRecords && <p className="alert alert--success" role="status">We found earlier work under this number. Our team will check it with you before showing it. Never share this PIN with anyone, including staff.</p>}
    <label className="check-row"><input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)}/> I have saved my PIN</label>
    <button type="button" className="btn btn--primary btn--lg btn--block" disabled={!saved || busy} onClick={() => { if (submitting.current || navigating.current) return; navigating.current = true; setBusy(true); void onDone(); }}>Continue<ArrowRight size={18}/></button>
  </div>;

  return <form onSubmit={submit} className="auth__form" aria-busy={busy} noValidate>
    {mode === "signin" && credential === "pin" && <div className="auth__method" role="group" aria-label="PIN sign-in account identifier">
      <button type="button" className="link-btn" aria-pressed={pinIdentity === "mobile"} disabled={busy} onClick={() => { setPinIdentity("mobile"); setFields({}); setError(""); }}>Mobile + PIN</button>
      <span aria-hidden="true"> · </span>
      <button type="button" className="link-btn" aria-pressed={pinIdentity === "email"} disabled={busy} onClick={() => { setPinIdentity("email"); setFields({}); setError(""); }}>Email + PIN</button>
    </div>}
    {mode === "signin" && credential === "pin" && pinIdentity === "email"
      ? <label className="field"><span className="field__label">Account email</span>
          <span className="input-wrap"><input type="email" autoComplete="username" maxLength={254} required value={emailPin} onChange={(e) => setEmailPin(e.target.value)} placeholder="you@example.com" aria-invalid={Boolean(fields.email)} autoFocus/></span>
          <span className="field__hint">Use email + PIN when several team accounts share a contact number.</span>{fieldError("email")}
        </label>
      : <label className="field"><span className="field__label">Mobile number</span>
          <span className="input-wrap"><span className="input-prefix" aria-hidden="true">+91</span>
            <input type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={14} required value={phone} onChange={(e) => setPhone(typedMobile(e.target.value))} placeholder="98765 43210" aria-invalid={Boolean(fields.phone)} autoFocus/></span>
          <span className="field__hint">10 digits, without +91 or 0.</span>{fieldError("phone")}
        </label>}
    {mode === "signin" && <div className="auth__method" role="group" aria-label="Choose mobile sign-in secret">
      <button type="button" className="link-btn" aria-pressed={credential === "pin"} disabled={busy} onClick={() => { setCredential("pin"); setError(""); setFields({}); }}>6-digit PIN</button>
      <span aria-hidden="true"> · </span>
      <button type="button" className="link-btn" aria-pressed={credential === "password"} disabled={busy} onClick={() => { setCredential("password"); setError(""); setFields({}); }}>Password</button>
    </div>}
    {mode === "signin"
      ? credential === "pin" ? <label className="field"><span className="field__label">6-digit PIN</span>
        <span className="input-wrap"><LockKeyhole size={18}/><input type={showPin ? "text" : "password"} inputMode="numeric" autoComplete="current-password" maxLength={6} required value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" aria-invalid={Boolean(fields.pin)}/>
          <button type="button" className="icon-btn" aria-label={showPin ? "Hide PIN" : "Show PIN"} onClick={() => setShowPin((value) => !value)}>{showPin ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span>
        {fieldError("pin")}
        <span className="field__hint">Forgot it? {recoveryEnabled && <><Link href="/forgot-password?method=mobile">Recover mobile PIN</Link> (verified numbers only), or </>}<a href={whatsappHref("Hello, I forgot my sign-in PIN. Please help me verify my identity and recover my account.")} target="_blank" rel="noopener noreferrer">contact our team</a>.</span></label>
      : <label className="field"><span className="field__label">Password</span>
          <span className="input-wrap"><LockKeyhole size={18}/><input type={showPin ? "text" : "password"} autoComplete="current-password" required maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your account password"/><button type="button" className="icon-btn" aria-label={showPin ? "Hide password" : "Show password"} onClick={() => setShowPin((value) => !value)}>{showPin ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span>
          {fieldError("password")}
          <span className="field__hint">Password works for accounts that have set one. <Link href="/forgot-password">Forgot password?</Link></span>
        </label>
      : <>
        <label className="field"><span className="field__label">Your name</span><span className="input-wrap"><UserRound size={18}/><input autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" aria-invalid={Boolean(fields.name)}/></span>{fieldError("name")}</label>
        <label className="check-row"><input type="checkbox" checked={whatsappConsent} onChange={(e) => setWhatsappConsent(e.target.checked)}/> Send me WhatsApp updates and reminders (birthday wishes, renewals, offers).</label>
        <label className="check-row"><input type="checkbox" checked={emailConsent} onChange={(e) => setEmailConsent(e.target.checked)}/> Send me email reminders too, once I add my email.</label>
        <label className="field"><span className="field__label">Password <em>optional</em></span>
          <span className="input-wrap"><LockKeyhole size={18}/><input type={showPin ? "text" : "password"} autoComplete="new-password" maxLength={128} minLength={PASSWORD_MIN} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Set a password for another sign-in option"/><button type="button" className="icon-btn" aria-label={showPin ? "Hide password" : "Show password"} onClick={() => setShowPin((value) => !value)}>{showPin ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span>
          {fieldError("password")}
          <span className="field__hint">Leave blank to sign in with PIN only. A password lets you also sign in with your mobile number.</span>
        </label>
        <p className="field__hint">We will make a 6-digit PIN for you and show it on the next screen.</p>
      </>}
    <div className="hp-field" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)}/></label></div>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    <button className="btn btn--primary btn--lg btn--block" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create my account"}<ArrowRight size={18}/></button>
  </form>;
}
