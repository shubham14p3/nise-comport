"use client";
import SiteHeader from "@/components/site-header";
import LanguageMenu from "@/components/language-menu";
import OfferCard from "@/components/offer-card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BellRing, Check, Eye, EyeOff, Languages, LockKeyhole, Mail, MapPin, ShieldCheck, Smartphone, Terminal, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { secureResult } from "@/lib/secure-api-client";
import { dict, fill } from "@/lib/i18n";
import { liveOffers } from "@/lib/offers";
import { useLocale } from "@/lib/use-locale";
import { takeReturn } from "@/lib/after-login";
import { passwordProblem, PASSWORD_MIN } from "@/lib/validation";

type Mode = "signin" | "signup";
type ApiResult = { error?: string; fields?: Record<string, string>; retryAfter?: number; message?: string; requiresOtp?: boolean; resendAfter?: number };

const DEV = process.env.NODE_ENV !== "production";
export const RESET_EMAIL_KEY = "nise-reset-email";

async function post(operation: string, body: unknown): Promise<{ ok: boolean; status: number; result: ApiResult }> {
  return secureResult<ApiResult>(operation, body);
}

/** Sign in / sign up with email verification. Interface text follows the chosen language. */
export default function AuthPanel({ mode, demoEnabled = false }: { mode: Mode; demoEnabled?: boolean }) {
  const router = useRouter();
  const locale = useLocale();
  const t = dict(locale).auth;
  const [stage, setStage] = useState<"details" | "otp">("details");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [password, setPassword] = useState(""); const [otp, setOtp] = useState("");
  const [website, setWebsite] = useState("");
  const [showPassword, setShowPassword] = useState(false); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resendIn, setResendIn] = useState(0);
  const passwordHint = mode === "signup" && password ? passwordProblem(password, { email, name }) : "";
  const offer = liveOffers().find((item) => item.badge === "LIVE");

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

  function done() { router.push(takeReturn()); router.refresh(); }

  async function submitDetails(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess(""); setFieldErrors({});
    try {
      if (mode === "signin") {
        const { ok, result } = await post("Q7m4kP2vL9sD", { email, password });
        if (!ok) { showFailure(result, t.failSignin); return; }
        if (result.requiresOtp) { setStage("otp"); setResendIn(60); setSuccess(t.sentVerify); return; }
        done(); return;
      }
      const problem = passwordProblem(password, { email, name });
      if (problem) { setFieldErrors({ password: problem }); setError(problem); return; }
      const { ok, result } = await post("N5c8R1xT6bW3", { email, purpose: "signup", website });
      if (!ok) { showFailure(result, t.failSend); return; }
      setStage("otp"); setResendIn(result.resendAfter ?? 60); setSuccess(result.message ?? t.otpSpam);
    } finally { setBusy(false); }
  }

  async function requestSignInCode() {
    if (!email) { setFieldErrors({ email: t.enterEmailFirst }); return; }
    setBusy(true); setError(""); setSuccess(""); setFieldErrors({});
    try {
      const { ok, result } = await post("N5c8R1xT6bW3", { email, purpose: "signin", website });
      if (!ok) { showFailure(result, t.failSend); return; }
      setStage("otp"); setResendIn(result.resendAfter ?? 60); setSuccess(result.message ?? t.otpSpam);
    } finally { setBusy(false); }
  }

  async function resend() {
    setBusy(true); setError(""); setSuccess("");
    try {
      const { ok, result } = await post("N5c8R1xT6bW3", { email, purpose: mode, website });
      if (!ok) { showFailure(result, t.failResend); return; }
      setResendIn(result.resendAfter ?? 60); setOtp(""); setSuccess(t.newCodeSent);
    } finally { setBusy(false); }
  }

  async function verify(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setFieldErrors({});
    try {
      const { ok, result } = await post("H9d2M7qK4zF8", { email, code: otp.trim(), purpose: mode, ...(mode === "signup" ? { name, password, phone } : {}) });
      if (!ok) {
        showFailure(result, t.failVerify);
        if (result.fields?.password || result.fields?.name || result.fields?.phone) setStage("details");
        return;
      }
      done();
    } finally { setBusy(false); }
  }

  function rememberEmailForReset() {
    try { if (email) sessionStorage.setItem(RESET_EMAIL_KEY, email); } catch { /* storage unavailable */ }
  }

  const fieldError = (key: string) => fieldErrors[key] ? <span className="field__error" id={`${key}-error`} role="alert">{fieldErrors[key]}</span> : null;
  const heading = stage === "otp" ? t.otpTitle : mode === "signup" ? t.signupTitle : t.signinTitle;
  const benefitIcons = [BellRing, MapPin, Smartphone];

  return <main className="auth"><SiteHeader/>
    <div className="auth__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/><span className="blob blob--3"/></div>
    <div className="container auth__wrap">
      <section className="auth__visual">
        <span className="pill pill--glass"><i className="live-dot"/>{t.panelKicker}</span>
        <h2>{t.panelTitle}</h2>
        <ul className="auth__benefits">{t.benefits.map((benefit, index) => { const Icon = benefitIcons[index] ?? Check; return <li key={benefit}><span><Icon size={18}/></span>{benefit}</li>; })}</ul>
        <div className="auth__mock" aria-hidden="true">
          <div className="auth__mock-row"><span className="mini-icon tone-blue"><UserRound size={15}/></span><div><b>My requests</b><small>3 active · 5 completed</small></div></div>
          <div className="auth__mock-row"><span className="mini-icon tone-green"><Check size={15}/></span><div><b>Income certificate</b><small>Ready to collect</small></div><span className="status-pill status-pill--done">Ready</span></div>
        </div>
        {offer && <OfferCard offer={offer} locale={locale} variant="rail"/>}
        <p className="auth__safe"><ShieldCheck size={18}/>{t.safe}</p>
      </section>

      <section className="auth__card" aria-labelledby="auth-heading">
        <div className="auth__lang"><span><Languages size={17}/>{t.language}</span><LanguageMenu locale={locale} label={t.language} inline/></div>
        {stage === "details" && <div className="auth__tabs" role="tablist">
          <Link role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "is-active" : undefined} href="/login">{t.signinLink}</Link>
          <Link role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "is-active" : undefined} href="/signup">{t.createAccount}</Link>
        </div>}
        <h1 id="auth-heading">{heading}</h1>
        <p className="auth__sub">{stage === "otp" ? <>{t.otpSub} <b>{email}</b>. {t.otpSpam}</> : mode === "signup" ? t.signupSub : t.signinSub}</p>

        {mode === "signin" && demoEnabled && stage === "details" && <div className="demo-card"><strong>Local preview login</strong><span>Email: <code>demo@nisecomport.test</code></span><span>Password: <code>LocalDemo#2026</code></span><button type="button" className="btn btn--ghost btn--sm" onClick={() => { setEmail("demo@nisecomport.test"); setPassword("LocalDemo#2026"); }}>Fill demo details</button><small>Preview only: this account is temporary and does not use the database or email.</small></div>}

        {stage === "details" ? <form onSubmit={submitDetails} className="auth__form" noValidate>
          {mode === "signup" && <label className="field"><span className="field__label">{t.name}</span><span className="input-wrap"><UserRound size={18}/><input autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder={t.namePh} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "name-error" : undefined}/></span>{fieldError("name")}</label>}
          <label className="field"><span className="field__label">{t.email}</span><span className="input-wrap"><Mail size={18}/><input type="email" autoComplete="email" inputMode="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined}/></span>{fieldError("email")}</label>
          {mode === "signup" && <label className="field"><span className="field__label">{t.phone} <em>{t.optional}</em></span><span className="input-wrap"><span className="input-prefix">+91</span><input type="tel" autoComplete="tel-national" inputMode="tel" maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} placeholder="98765 43210" aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "phone-error" : undefined}/></span>{fieldError("phone")}</label>}
          <label className="field"><span className="field__label">{t.password}</span><span className="input-wrap"><LockKeyhole size={18}/><input type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? PASSWORD_MIN : 1} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "signup" ? fill(t.newPasswordPh, { n: PASSWORD_MIN }) : t.passwordPh} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={mode === "signup" ? "password-hint" : fieldErrors.password ? "password-error" : undefined}/><button type="button" className="icon-btn" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? t.hide : t.show}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span>
            {mode === "signup" && <span id="password-hint" className={passwordHint ? "field__hint field__hint--warn" : "field__hint"}>{passwordHint || fill(t.passwordHint, { n: PASSWORD_MIN })}</span>}
            {mode === "signin" && fieldError("password")}
          </label>
          {/* Honeypot for bots: hidden from people and screen readers. */}
          <div className="hp-field" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)}/></label></div>
          {error && <div className="alert alert--error" role="alert">{error}</div>}{success && <div className="alert alert--success" role="status">{success}</div>}
          <button className="btn btn--primary btn--lg btn--block" disabled={busy}>{busy ? t.wait : mode === "signup" ? t.signup : t.signin}<ArrowRight size={18}/></button>
          {mode === "signin" && <div className="auth__links"><button type="button" className="link-btn" disabled={busy} onClick={() => void requestSignInCode()}>{t.codeSignin}</button><Link className="link-btn" href="/forgot-password" onClick={rememberEmailForReset}>{t.forgot}</Link></div>}
        </form> : <form onSubmit={verify} className="auth__form" noValidate>
          <label className="field"><span className="field__label">{t.codeLabel}</span><input inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" className="otp-input" aria-invalid={Boolean(fieldErrors.code)} autoFocus/></label>
          {DEV && <p className="alert alert--dev"><Terminal size={18}/>{t.devHint}</p>}
          {error && <div className="alert alert--error" role="alert">{error}</div>}{success && <div className="alert alert--success" role="status">{success}</div>}
          <button className="btn btn--primary btn--lg btn--block" disabled={busy || otp.length !== 6}>{busy ? t.verifying : t.verify}<ArrowRight size={18}/></button>
          <div className="auth__links">
            <button type="button" className="link-btn" disabled={busy || resendIn > 0} onClick={() => void resend()}>{resendIn > 0 ? fill(t.resendIn, { s: resendIn }) : t.resend}</button>
            <button type="button" className="link-btn" disabled={busy} onClick={() => { setStage("details"); setOtp(""); setError(""); setSuccess(""); }}>{t.differentEmail}</button>
          </div>
          <p className="auth__legal">{t.codeRules}</p>
        </form>}
        <p className="auth__switch">{mode === "signup" ? <>{t.haveAccount} <Link href="/login">{t.signinLink}</Link></> : <>{t.newHere} <Link href="/signup">{t.createAccount}</Link></>}</p>
        <p className="auth__legal">{t.agree} <Link href="/terms">{t.terms}</Link> {t.and} <Link href="/privacy">{t.privacy}</Link>.</p>
      </section>
    </div>
  </main>;
}
