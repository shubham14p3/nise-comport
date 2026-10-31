"use client";
import Link from "next/link";
import MobileRecoveryPanel from "@/components/mobile-recovery-panel";
import { whatsappHref } from "@/lib/public-contact";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, KeyRound, Languages, Mail, Terminal } from "lucide-react";
import { FormEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import SiteHeader from "@/components/site-header";
import LanguageMenu from "@/components/language-menu";
import { RESET_EMAIL_KEY } from "@/components/auth-panel";
import { dict, fill } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import { passwordProblem, PASSWORD_MIN } from "@/lib/validation";
import { secureResult } from "@/lib/secure-api-client";
import { invalidateSessionCache } from "@/lib/session-client";

type ApiResult = { error?: string; fields?: Record<string, string>; retryAfter?: number; message?: string; resendAfter?: number };
const DEV = process.env.NODE_ENV !== "production";

async function post(operation: string, body: unknown) {
  return secureResult<ApiResult>(operation, body);
}

const noopSubscribe = () => () => undefined;
function storedEmail() { try { return sessionStorage.getItem(RESET_EMAIL_KEY) ?? ""; } catch { return ""; } }

/** Forgot password: email → 6-digit code + new password. All devices are signed out afterwards. */
export default function ForgotPasswordPanel({ channels = [], initialMethod = "email" }: { channels?: ("sms" | "whatsapp")[]; initialMethod?: "email" | "mobile" }) {
  const router = useRouter();
  const locale = useLocale();
  const t = dict(locale).auth;
  const remembered = useSyncExternalStore(noopSubscribe, storedEmail, () => "");
  const [stage, setStage] = useState<"email" | "reset">("email");
  const [method, setMethod] = useState<"email" | "mobile">(initialMethod === "mobile" && channels.length ? "mobile" : "email");
  const [typedEmail, setTypedEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const navigating = useRef(false);
  function startSubmit() {
    if (submitting.current || navigating.current) return false;
    submitting.current = true;
    setBusy(true);
    return true;
  }
  function endSubmit() {
    submitting.current = false;
    if (!navigating.current) setBusy(false);
  }
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const email = typedEmail ?? remembered;
  const hint = password ? passwordProblem(password, { email }) : "";

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    if (!startSubmit()) return; setError(""); setNotice("");
    try {
      const { ok, result } = await post("V3p6J0nS8yC1", { email, website });
      if (!ok) { setError(result.error ?? t.failSend); if (result.retryAfter && result.retryAfter <= 120) setResendIn(result.retryAfter); return; }
      setStage("reset"); setResendIn(result.resendAfter ?? 60); setNotice(result.message ?? t.otpSpam);
    } finally { endSubmit(); }
  }

  async function reset(event: FormEvent) {
    event.preventDefault(); setError(""); setNotice("");
    if (hint) { setError(hint); return; }
    if (password !== confirm) { setError("The two passwords don’t match."); return; }
    if (!startSubmit()) return;
    try {
      const { ok, result } = await post("L8t1B5rX9mQ4", { email, code: code.trim(), password });
      if (!ok) { setError(result.error ?? "We couldn’t reset your password."); return; }
      try { sessionStorage.removeItem(RESET_EMAIL_KEY); } catch { /* storage unavailable */ }
      invalidateSessionCache();
      navigating.current = true;
      setBusy(true);
      router.push("/profile"); router.refresh();
    } finally { endSubmit(); }
  }

  return <main className="auth auth--single"><SiteHeader/>
    <div className="auth__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/></div>
    <div className="container auth__wrap auth__wrap--single">
      <section className="auth__card">
        <div className="auth__lang"><span><Languages size={17}/>{t.language}</span><LanguageMenu locale={locale} label={t.language} inline/></div>
        <span className="auth__icon"><KeyRound size={26}/></span>
        <h1>{method === "mobile" ? "Recover mobile sign-in" : stage === "email" ? t.resetTitle : t.resetCodeTitle}</h1>
        <p className="auth__sub">{method === "mobile" ? "Recover your mobile PIN or password using a code sent to your previously verified number." : stage === "email" ? t.resetSub : <>{t.otpSub} <b>{email}</b>.</>}</p>
        <div className="auth__method" role="group" aria-label="Choose recovery method">
          <button type="button" className="link-btn" aria-pressed={method === "email"} onClick={() => setMethod("email")}>Reset via email</button>
          {channels.length > 0 && <button type="button" className="link-btn" aria-pressed={method === "mobile"} onClick={() => setMethod("mobile")}>Reset via verified mobile</button>}
        </div>
        {method === "mobile" ? <MobileRecoveryPanel channels={channels}/> : stage === "email" ? <form className="auth__form" aria-busy={busy} onSubmit={sendCode} noValidate>
          <label className="field"><span className="field__label">{t.email}</span><span className="input-wrap"><Mail size={18}/><input type="email" inputMode="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setTypedEmail(e.target.value)} placeholder="you@example.com"/></span></label>
          <div className="hp-field" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)}/></label></div>
          {error && <div className="alert alert--error" role="alert">{error}</div>}
          <button className="btn btn--primary btn--lg btn--block" disabled={busy || !email}>{busy ? t.wait : t.resetSend}<ArrowRight size={18}/></button>
        </form> : <form className="auth__form" aria-busy={busy} onSubmit={reset} noValidate>
          <label className="field"><span className="field__label">{t.codeLabel}</span><input inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" className="otp-input"/></label>
          <label className="field"><span className="field__label">{t.newPassword}</span><span className="input-wrap"><KeyRound size={18}/><input type={show ? "text" : "password"} autoComplete="new-password" required minLength={PASSWORD_MIN} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="reset-hint"/><button type="button" className="icon-btn" onClick={() => setShow(!show)} aria-label={show ? t.hide : t.show}>{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span><span id="reset-hint" className={hint ? "field__hint field__hint--warn" : "field__hint"}>{hint || fill(t.passwordHint, { n: PASSWORD_MIN })}</span></label>
          <label className="field"><span className="field__label">{t.newPassword} ✓</span><span className="input-wrap"><input type={show ? "text" : "password"} autoComplete="new-password" required maxLength={128} value={confirm} onChange={(e) => setConfirm(e.target.value)}/><button type="button" className="icon-btn" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span></label>
          {DEV && <p className="alert alert--dev"><Terminal size={18}/>{t.devHint}</p>}
          {error && <div className="alert alert--error" role="alert">{error}</div>}{notice && <div className="alert alert--success" role="status">{notice}</div>}
          <button className="btn btn--primary btn--lg btn--block" disabled={busy || code.length !== 6}>{busy ? t.wait : t.resetSave}<ArrowRight size={18}/></button>
          <div className="auth__links"><button type="button" className="link-btn" disabled={busy || resendIn > 0} onClick={() => void sendCode()}>{resendIn > 0 ? fill(t.resendIn, { s: resendIn }) : t.resend}</button><button type="button" className="link-btn" onClick={() => { setStage("email"); setCode(""); setError(""); setNotice(""); }}>{t.differentEmail}</button></div>
        </form>}
        {channels.length === 0 && <p className="field__hint">Mobile PIN recovery by SMS/WhatsApp is coming soon. For a lost PIN, <a href={whatsappHref("Hello, I need to recover access to my NISE COMPORT account. Please help me verify my identity.")} target="_blank" rel="noopener noreferrer">contact the service desk</a> for identity-checked help.</p>}
        <p className="auth__switch"><Link prefetch={false} href="/login">{t.backToSignin}</Link> · <Link prefetch={false} href="/signup">{t.createAccount}</Link></p>
      </section>
    </div>
  </main>;
}
