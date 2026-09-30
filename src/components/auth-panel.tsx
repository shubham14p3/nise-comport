"use client";
import SiteHeader from "@/components/site-header";
import BrandWordmark from "@/components/brand-wordmark";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { secureResult } from "@/lib/secure-api-client";
import { passwordProblem, PASSWORD_MIN } from "@/lib/validation";

type Mode = "signin" | "signup";
type ApiResult = { error?: string; fields?: Record<string, string>; retryAfter?: number; message?: string; requiresOtp?: boolean; resendAfter?: number };

async function post(operation: string, body: unknown): Promise<{ ok: boolean; status: number; result: ApiResult }> {
  return secureResult<ApiResult>(operation, body);
}

export default function AuthPanel({ mode, demoEnabled = false }: { mode: Mode; demoEnabled?: boolean }) {
  const router = useRouter();
  const [stage, setStage] = useState<"details" | "otp">("details");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [password, setPassword] = useState(""); const [otp, setOtp] = useState("");
  const [website, setWebsite] = useState("");
  const [showPassword, setShowPassword] = useState(false); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resendIn, setResendIn] = useState(0);
  const title = mode === "signup" ? "A little help goes a long way." : "Good to see you again.";
  const passwordHint = mode === "signup" && password ? passwordProblem(password, { email, name }) : "";

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  function showFailure(result: ApiResult, fallback: string) {
    setFieldErrors(result.fields ?? {});
    setError(result.error ?? fallback);
    if (result.retryAfter && result.retryAfter <= 120) setResendIn(result.retryAfter);
  }

  function done() { router.push("/profile"); router.refresh(); }

  async function submitDetails(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess(""); setFieldErrors({});
    try {
      if (mode === "signin") {
        const { ok, result } = await post("Q7m4kP2vL9sD", { email, password });
        if (!ok) { showFailure(result, "We couldn’t sign you in. Please try again."); return; }
        if (result.requiresOtp) { setStage("otp"); setResendIn(60); setSuccess("Please verify your email. If a code isn’t already in your inbox, we’ve just sent one."); return; }
        done(); return;
      }
      const problem = passwordProblem(password, { email, name });
      if (problem) { setFieldErrors({ password: problem }); setError(problem); return; }
      const { ok, result } = await post("N5c8R1xT6bW3", { email, purpose: "signup", website });
      if (!ok) { showFailure(result, "We couldn’t send a code. Please try again."); return; }
      setStage("otp"); setResendIn(result.resendAfter ?? 60); setSuccess(result.message ?? "Check your inbox for a 6-digit code.");
    } finally { setBusy(false); }
  }

  async function requestSignInCode() {
    if (!email) { setFieldErrors({ email: "Enter your email address first." }); return; }
    setBusy(true); setError(""); setSuccess(""); setFieldErrors({});
    try {
      const { ok, result } = await post("N5c8R1xT6bW3", { email, purpose: "signin", website });
      if (!ok) { showFailure(result, "We couldn’t send a sign-in code."); return; }
      setStage("otp"); setResendIn(result.resendAfter ?? 60); setSuccess(result.message ?? "Check your inbox for a 6-digit sign-in code.");
    } finally { setBusy(false); }
  }

  async function resend() {
    setBusy(true); setError(""); setSuccess("");
    try {
      const { ok, result } = await post("N5c8R1xT6bW3", { email, purpose: mode, website });
      if (!ok) { showFailure(result, "Could not resend the code."); return; }
      setResendIn(result.resendAfter ?? 60); setOtp(""); setSuccess("A new code is on its way. Only the newest code works.");
    } finally { setBusy(false); }
  }

  async function verify(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setFieldErrors({});
    try {
      const { ok, result } = await post("H9d2M7qK4zF8", { email, code: otp.trim(), purpose: mode, ...(mode === "signup" ? { name, password, phone } : {}) });
      if (!ok) {
        showFailure(result, "We couldn’t verify that code.");
        if (result.fields?.password || result.fields?.name || result.fields?.phone) setStage("details");
        return;
      }
      done();
    } finally { setBusy(false); }
  }

  const fieldError = (key: string) => fieldErrors[key] ? <small className="field-error" id={`${key}-error`} role="alert">{fieldErrors[key]}</small> : null;

  return <main className="auth-shell"><SiteHeader/><Link href="/" className="auth-back"><ArrowLeft size={16}/> Back to NISE COMPORT</Link><div className="auth-layout"><section className="auth-brand-panel"><Link className="brand auth-brand" href="/"><BrandWordmark/></Link><div className="auth-brand-copy"><span className="auth-kicker">YOUR ACCOUNT, YOUR WAY</span><h1>{title}</h1><p>Keep your requests, documents and updates together in one simple place.</p><div className="auth-benefits"><span><Check size={15}/> Track service requests</span><span><Check size={15}/> Manage your details securely</span><span><Check size={15}/> Get updates as things progress</span></div></div><div className="auth-quote"><ShieldCheck size={18}/><span>Your information is handled with care.<small>We only use it to help with your service requests.</small></span></div></section><section className="auth-form-panel"><div className="auth-form-inner"><div className="auth-form-top"><span className="form-icon"><LockKeyhole size={19}/></span><span className="secure-label">SECURE ACCOUNT ACCESS</span></div><h2>{stage === "otp" ? "Check your inbox." : mode === "signup" ? "Create your account" : "Sign in"}</h2><p className="auth-subtitle">{stage === "otp" ? <>Enter the 6-digit code sent to <b>{email}</b>. Check spam or promotions if you don’t see it.</> : mode === "signup" ? "It only takes a minute to get started." : "Enter your details to continue."}</p>
      {mode === "signin" && demoEnabled && stage === "details" && <div className="demo-login-card"><strong>Local preview login</strong><span>Email: <code>demo@nisecomport.test</code></span><span>Password: <code>LocalDemo#2026</code></span><button type="button" onClick={() => { setEmail("demo@nisecomport.test"); setPassword("LocalDemo#2026"); }}>Fill demo details</button><small>Preview only: this account is temporary and does not use the database or email.</small></div>}
      {stage === "details" ? <form onSubmit={submitDetails} className="auth-form" noValidate>
        {mode === "signup" && <label>Your name<input autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya Kumari" aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "name-error" : undefined}/>{fieldError("name")}</label>}
        <label>Email address<div className="input-icon"><Mail size={15}/><input type="email" autoComplete="email" inputMode="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined}/></div>{fieldError("email")}</label>
        {mode === "signup" && <label>Phone number <span className="optional">OPTIONAL</span><input type="tel" autoComplete="tel" inputMode="tel" maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 98765 43210" aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "phone-error" : undefined}/>{fieldError("phone")}</label>}
        <label>Password<div className="input-icon"><LockKeyhole size={15}/><input type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? PASSWORD_MIN : 1} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "signup" ? `At least ${PASSWORD_MIN} characters` : "Your password"} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={mode === "signup" ? "password-hint" : fieldErrors.password ? "password-error" : undefined}/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}</button></div>
          {mode === "signup" && <small id="password-hint" className={passwordHint ? "field-hint field-hint-warn" : "field-hint"}>{passwordHint || `Use ${PASSWORD_MIN}+ characters. A short phrase is easy to remember and hard to guess.`}</small>}
          {mode === "signin" && fieldError("password")}
        </label>
        {/* Honeypot for bots: hidden from people and screen readers. */}
        <div className="hp-field" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)}/></label></div>
        {error && <div className="form-alert error-alert" role="alert">{error}</div>}{success && <div className="form-alert success-alert" role="status">{success}</div>}
        <button className="button button-green auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Continue with email verification" : "Sign in"}<ArrowRight size={16}/></button>
        {mode === "signin" && <div className="auth-secondary-actions"><button type="button" className="resend-link" disabled={busy} onClick={() => void requestSignInCode()}>Sign in with an email code</button><Link className="resend-link" href="/forgot-password">Forgot password?</Link></div>}
      </form> : <form onSubmit={verify} className="auth-form" noValidate>
        <label>6-digit verification code<input inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="otp-input" aria-invalid={Boolean(fieldErrors.code)} autoFocus/></label>
        {error && <div className="form-alert error-alert" role="alert">{error}</div>}{success && <div className="form-alert success-alert" role="status">{success}</div>}
        <button className="button button-green auth-submit" disabled={busy || otp.length !== 6}>{busy ? "Verifying…" : "Verify and continue"}<ArrowRight size={16}/></button>
        <div className="auth-secondary-actions">
          <button type="button" className="resend-link" disabled={busy || resendIn > 0} onClick={() => void resend()}>{resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}</button>
          <button type="button" className="resend-link" disabled={busy} onClick={() => { setStage("details"); setOtp(""); setError(""); setSuccess(""); }}>Use a different email</button>
        </div>
        <p className="auth-legal">Codes expire after 10 minutes and allow 5 attempts. NISE COMPORT staff will never ask for this code.</p>
      </form>}
      <div className="auth-switch">{mode === "signup" ? <>Already have an account? <Link href="/login">Sign in</Link></> : <>New to NISE COMPORT? <Link href="/signup">Create an account</Link></>}</div><p className="auth-legal">By continuing, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p></div></section></div></main>;
}
