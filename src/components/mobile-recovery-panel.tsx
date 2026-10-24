"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, Smartphone } from "lucide-react";
import { checkMobile, typedMobile } from "@/lib/mobile-login-core";
import { secureResult } from "@/lib/secure-api-client";
import { passwordProblem, PASSWORD_MIN } from "@/lib/validation";

type Channel = "sms" | "whatsapp";
type Result = { error?: string; fields?: Record<string, string>; message?: string; resendAfter?: number; pin?: string };
type Kind = "pin" | "password";

/** A verified mobile number + actual delivered OTP is required. No provider => this panel is never rendered. */
export default function MobileRecoveryPanel({ channels }: { channels: Channel[] }) {
  const [kind, setKind] = useState<Kind>("pin");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"phone" | "code" | "done">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newPin, setNewPin] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [website, setWebsite] = useState("");

  function chooseKind(next: Kind) {
    setKind(next); setStep("phone"); setCode(""); setPassword(""); setConfirmPassword("");
    setNewPin(null); setError(""); setMessage("");
  }

  async function sendCode(channel: Channel) {
    const mobile = checkMobile(phone);
    if (!mobile.ok) { setError(mobile.error); return; }
    if (!channels.includes(channel)) { setError("This recovery channel is not enabled."); return; }
    setBusy(true); setError(""); setMessage("");
    const { ok, result } = await secureResult<Result>("F3m8J6pQ1vT9", {
      action: "send", kind, phone: mobile.e164, channel, website,
    });
    setBusy(false);
    if (!ok) { setError(result.error ?? "Mobile recovery is temporarily unavailable."); return; }
    setMessage(result.message ?? "If eligible, a recovery code was sent.");
    setStep("code");
  }

  async function confirmCode(event: FormEvent) {
    event.preventDefault();
    const mobile = checkMobile(phone);
    if (!mobile.ok) { setError(mobile.error); return; }
    if (!/^\d{6}$/.test(code)) { setError("Enter the 6-digit recovery code."); return; }
    if (kind === "password") {
      const problem = passwordProblem(password, { email: "", name: "" });
      if (problem) { setError(problem); return; }
      if (password !== confirmPassword) { setError("The two passwords do not match."); return; }
    }
    setBusy(true); setError(""); setMessage("");
    const { ok, result } = await secureResult<Result>("F3m8J6pQ1vT9", {
      action: "confirm", phone: mobile.e164, kind, code, ...(kind === "password" ? { password } : {}),
    });
    setBusy(false);
    if (!ok) { setError(result.error ?? "The recovery code is incorrect or has expired."); return; }
    if (kind === "pin" && !result.pin) { setError("Could not retrieve the new PIN. Contact our team."); return; }
    setNewPin(result.pin ?? null);
    setPassword(""); setConfirmPassword(""); setCode("");
    setMessage(result.message ?? (kind === "pin" ? "PIN reset successfully. Save it before leaving this page." : "Password reset successfully."));
    setStep("done");
  }

  if (step === "done") return <div className="auth__form" role="status">
    <p className="alert alert--success">{message}</p>
    {newPin && <div className="pin-reveal__box"><b>{newPin}</b><button type="button" className="btn btn--ghost btn--sm" onClick={() => {
      void navigator.clipboard.writeText(newPin).then(() => setCopied(true)).catch(() => setCopied(false));
    }}>{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? "Copied" : "Copy PIN"}</button></div>}
    {newPin && <p className="field__hint">Your new PIN appears only once. Never share it with anyone, including staff.</p>}
    <Link className="btn btn--primary btn--lg btn--block" href="/login">Sign in with your new {kind === "pin" ? "PIN" : "password"}</Link>
  </div>;

  return <div className="auth__form">
    <div role="group" aria-label="What do you want to reset?" className="auth__method">
      <button type="button" className="link-btn" aria-pressed={kind === "pin"} onClick={() => chooseKind("pin")}>Reset mobile PIN</button>
      <span aria-hidden="true"> · </span>
      <button type="button" className="link-btn" aria-pressed={kind === "password"} onClick={() => chooseKind("password")}>Reset password</button>
    </div>
    <label className="field"><span className="field__label"><Smartphone size={16}/> Verified mobile number</span>
      <span className="input-wrap"><span className="input-prefix">+91</span><input type="tel" autoComplete="tel-national" inputMode="numeric" maxLength={12} value={phone} onChange={(event) => { setPhone(typedMobile(event.target.value)); setStep("phone"); }} placeholder="98765 43210" required disabled={busy}/></span>
      <span className="field__hint">For security, recovery codes are sent only to a mobile number previously verified on your account.</span>
    </label>
    <div className="hp-field" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)}/></label></div>
    {step === "phone" ? <div>
      <div className="auth__links">
        {channels.includes("sms") && <button className="btn btn--primary btn--sm" type="button" disabled={busy || phone.length !== 10} onClick={() => void sendCode("sms")}>Send SMS code</button>}
        {channels.includes("whatsapp") && <button className="btn btn--ghost btn--sm" type="button" disabled={busy || phone.length !== 10} onClick={() => void sendCode("whatsapp")}>Send WhatsApp code</button>}
      </div>
      {error && <p className="alert alert--error" role="alert">{error}</p>}
    </div> : <form onSubmit={(event) => void confirmCode(event)}>
      <p className="field__hint">{message}</p>
      <label className="field"><span className="field__label">6-digit recovery code</span><input inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="otp-input" placeholder="••••••"/></label>
      {kind === "password" && <>
        <label className="field"><span className="field__label">New password</span><span className="input-wrap"><KeyRound size={17}/><input type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={PASSWORD_MIN} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)}/><button type="button" className="icon-btn" onClick={() => setShowPassword((show) => !show)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span></label>
        <label className="field"><span className="field__label">Confirm new password</span><input type={showPassword ? "text" : "password"} autoComplete="new-password" maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)}/></label>
      </>}
      {error && <p className="alert alert--error" role="alert">{error}</p>}
      <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={busy || code.length !== 6}>{busy ? "Checking…" : kind === "pin" ? "Reset PIN" : "Reset password"}</button>
      <button className="link-btn" type="button" onClick={() => { setStep("phone"); setCode(""); setError(""); }}>Request another code</button>
    </form>}
    <p className="field__hint">No access to your verified mobile? Please contact the service desk for identity-checked recovery.</p>
  </div>;
}
