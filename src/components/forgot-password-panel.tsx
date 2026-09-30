"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import SiteHeader from "@/components/site-header";
import { passwordProblem, PASSWORD_MIN } from "@/lib/validation";
import { secureResult } from "@/lib/secure-api-client";

type ApiResult = { error?: string; fields?: Record<string, string>; retryAfter?: number; message?: string; resendAfter?: number };

async function post(operation: string, body: unknown) {
  return secureResult<ApiResult>(operation, body);
}

/** Forgot password: email → 6-digit code + new password. All devices are signed out afterwards. */
export default function ForgotPasswordPanel({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const [stage, setStage] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const hint = password ? passwordProblem(password, { email }) : "";

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const { ok, result } = await post("V3p6J0nS8yC1", { email, website });
      if (!ok) { setError(result.error ?? "We couldn’t send a code. Please try again."); if (result.retryAfter && result.retryAfter <= 120) setResendIn(result.retryAfter); return; }
      setStage("reset"); setResendIn(result.resendAfter ?? 60); setNotice(result.message ?? "Check your inbox for a 6-digit code.");
    } finally { setBusy(false); }
  }

  async function reset(event: FormEvent) {
    event.preventDefault(); setError(""); setNotice("");
    if (hint) { setError(hint); return; }
    if (password !== confirm) { setError("The two passwords don’t match."); return; }
    setBusy(true);
    try {
      const { ok, result } = await post("L8t1B5rX9mQ4", { email, code: code.trim(), password });
      if (!ok) { setError(result.error ?? "We couldn’t reset your password."); return; }
      router.push("/profile?section=security"); router.refresh();
    } finally { setBusy(false); }
  }

  return <main className="auth-shell"><SiteHeader/><Link href="/login" className="auth-back"><ArrowLeft size={16}/> Back to sign in</Link>
    <div className="auth-layout auth-layout-single"><section className="auth-form-panel"><div className="auth-form-inner">
      <div className="auth-form-top"><span className="form-icon"><KeyRound size={19}/></span><span className="secure-label">RESET YOUR PASSWORD</span></div>
      <h1 className="auth-title">{stage === "email" ? "Forgot your password?" : "Choose a new password"}</h1>
      <p className="auth-subtitle">{stage === "email" ? "Enter the email you use for NISE COMPORT. We’ll send a 6-digit code." : <>Enter the code sent to <b>{email}</b> and your new password. Every device will be signed out.</>}</p>
      {stage === "email" ? <form className="auth-form" onSubmit={sendCode} noValidate>
        <label>Email address<div className="input-icon"><Mail size={15}/><input type="email" inputMode="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"/></div></label>
        <div className="hp-field" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)}/></label></div>
        {error && <div className="form-alert error-alert" role="alert">{error}</div>}
        <button className="button button-green auth-submit" disabled={busy || !email}>{busy ? "Sending…" : "Send reset code"}<ArrowRight size={16}/></button>
      </form> : <form className="auth-form" onSubmit={reset} noValidate>
        <label>6-digit code<input inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="otp-input"/></label>
        <label>New password<div className="input-icon"><KeyRound size={15}/><input type={show ? "text" : "password"} autoComplete="new-password" required minLength={PASSWORD_MIN} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="reset-hint"/><button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={15}/> : <Eye size={15}/>}</button></div><small id="reset-hint" className={hint ? "field-hint field-hint-warn" : "field-hint"}>{hint || `Use ${PASSWORD_MIN}+ characters.`}</small></label>
        <label>Confirm new password<input type={show ? "text" : "password"} autoComplete="new-password" required maxLength={128} value={confirm} onChange={(e) => setConfirm(e.target.value)}/></label>
        {error && <div className="form-alert error-alert" role="alert">{error}</div>}{notice && <div className="form-alert success-alert" role="status">{notice}</div>}
        <button className="button button-green auth-submit" disabled={busy || code.length !== 6}>{busy ? "Saving…" : "Reset password and sign in"}<ArrowRight size={16}/></button>
        <div className="auth-secondary-actions"><button type="button" className="resend-link" disabled={busy || resendIn > 0} onClick={() => void sendCode()}>{resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}</button><button type="button" className="resend-link" onClick={() => { setStage("email"); setCode(""); setError(""); setNotice(""); }}>Use a different email</button></div>
      </form>}
      <p className="auth-legal">Remembered it? <Link href="/login">Sign in</Link>. No account yet? <Link href="/signup">Create one</Link>.</p>
    </div></section></div></main>;
}
