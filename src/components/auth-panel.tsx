"use client";
import SiteHeader from "@/components/site-header";
import LanguageMenu from "@/components/language-menu";
import CopyCode from "@/components/copy-code";
import OfferCard from "@/components/offer-card";
import { useLiveCodes } from "@/components/offers-provider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BellRing, Check, Eye, EyeOff, Gift, Languages, LockKeyhole, Mail, MapPin, PartyPopper, ShieldCheck, Smartphone, Terminal, UserRound } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import MobileAuthForm from "@/components/mobile-auth-form";
import { secureResult } from "@/lib/secure-api-client";
import { dict, fill } from "@/lib/i18n";
import { findOffer } from "@/lib/offers";
import { promoDict, shortDate } from "@/lib/promo-i18n";
import { useLocale } from "@/lib/use-locale";
import { takeReturn } from "@/lib/after-login";
import { getSessionUser, invalidateSessionCache } from "@/lib/session-client";
import { isStaffRole, STAFF_HOME } from "@/lib/staff-routes";
import { passwordProblem, PASSWORD_MIN } from "@/lib/validation";

type Mode = "signin" | "signup";
type WelcomeCoupon = { code: string; amount: number; minimum: number; expiresAt: string | null };
type ApiResult = { error?: string; fields?: Record<string, string>; retryAfter?: number; message?: string; requiresOtp?: boolean; resendAfter?: number; welcomeCoupon?: WelcomeCoupon };

const DEV = process.env.NODE_ENV !== "production";
const EXTRA = {
  en: { idLabel: "Email or mobile number", idPh: "you@example.com or 98765 43210", signinTitle: "Welcome back", signinSub: "Sign in to track your requests.", signupTitle: "Create your account", signupSub: "Start with your email. We will send a 6-digit code.", sendCode: "Send code", next: "Continue", finishTitle: "Almost done", finishSub: "Add a few details to finish.", create: "Create my account", mobileHint: "Optional. Lets you sign in with your mobile number too.", noAccount: "Don’t have an account?", haveAccount: "Already have an account?", signUpCta: "Create an account", signInCta: "Sign in", codeFirst: "Email sign-in code needs an email address.", back: "Change email", smsCode: "Send a code by SMS" },
  hi: { idLabel: "ईमेल या मोबाइल नंबर", idPh: "you@example.com या 98765 43210", signinTitle: "वापस स्वागत है", signinSub: "अपने अनुरोध देखने के लिए साइन इन करें।", signupTitle: "अपना खाता बनाएँ", signupSub: "अपने ईमेल से शुरू करें। हम 6 अंकों का कोड भेजेंगे।", sendCode: "कोड भेजें", next: "आगे बढ़ें", finishTitle: "बस थोड़ा और", finishSub: "पूरा करने के लिए कुछ जानकारी जोड़ें।", create: "मेरा खाता बनाएँ", mobileHint: "वैकल्पिक। इससे आप मोबाइल नंबर से भी साइन इन कर सकेंगे।", noAccount: "खाता नहीं है?", haveAccount: "पहले से खाता है?", signUpCta: "खाता बनाएँ", signInCta: "साइन इन", codeFirst: "ईमेल कोड से साइन इन के लिए ईमेल पता चाहिए।", back: "ईमेल बदलें", smsCode: "SMS से कोड भेजें" },
  bn: { idLabel: "ইমেইল বা মোবাইল নম্বর", idPh: "you@example.com বা 98765 43210", signinTitle: "আবার স্বাগত", signinSub: "আপনার অনুরোধ দেখতে সাইন ইন করুন।", signupTitle: "অ্যাকাউন্ট তৈরি করুন", signupSub: "ইমেইল দিয়ে শুরু করুন। আমরা ৬ অঙ্কের কোড পাঠাব।", sendCode: "কোড পাঠান", next: "এগিয়ে যান", finishTitle: "প্রায় শেষ", finishSub: "শেষ করতে কিছু তথ্য দিন।", create: "আমার অ্যাকাউন্ট তৈরি করুন", mobileHint: "ঐচ্ছিক। মোবাইল নম্বর দিয়েও সাইন ইন করতে পারবেন।", noAccount: "অ্যাকাউন্ট নেই?", haveAccount: "আগেই অ্যাকাউন্ট আছে?", signUpCta: "অ্যাকাউন্ট তৈরি করুন", signInCta: "সাইন ইন", codeFirst: "ইমেইল কোডে সাইন ইনের জন্য ইমেইল ঠিকানা লাগবে।", back: "ইমেইল বদলান", smsCode: "SMS-এ কোড পাঠান" },
} as const;
export const RESET_EMAIL_KEY = "nise-reset-email";

async function post(operation: string, body: unknown): Promise<{ ok: boolean; status: number; result: ApiResult }> {
  return secureResult<ApiResult>(operation, body);
}

/** Sign in / sign up with email verification. Interface text follows the chosen language. */
export default function AuthPanel({ mode, demoEnabled = false, smsEnabled = false, whatsappEnabled = false }: { mode: Mode; demoEnabled?: boolean; smsEnabled?: boolean; whatsappEnabled?: boolean }) {
  const router = useRouter();
  const locale = useLocale();
  const t = dict(locale).auth;
  const p = promoDict(locale);
  const x = EXTRA[locale as keyof typeof EXTRA] ?? EXTRA.en;
  const codes = useLiveCodes();
  const [stage, setStage] = useState<"details" | "otp" | "profile" | "welcome">("details");
  const [welcome, setWelcome] = useState<WelcomeCoupon | null>(null);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [password, setPassword] = useState(""); const [otp, setOtp] = useState("");
  const [website, setWebsite] = useState("");
  const [showPassword, setShowPassword] = useState(false); const [busy, setBusy] = useState(false);
  // A ref locks synchronously (before React re-renders the disabled button).
  const submitting = useRef(false);
  const navigating = useRef(false);
  function startSubmit() {
    if (submitting.current || navigating.current) return false;
    submitting.current = true;
    setBusy(true);
    return true;
  }
  function finishSubmit() {
    submitting.current = false;
    if (!navigating.current) setBusy(false);
  }
  const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resendIn, setResendIn] = useState(0);
  const [viaSms, setViaSms] = useState(false);
  const [unavailableChannels, setUnavailableChannels] = useState<("sms" | "whatsapp")[]>([]);
  const availableSms = smsEnabled && !unavailableChannels.includes("sms");
  const availableWhatsapp = whatsappEnabled && !unavailableChannels.includes("whatsapp");
  // Mobile number + PIN is the default way in; the toggle switches to email.
  const [method, setMethod] = useState<"mobile" | "email">("mobile");
  const isMobileInput = mode === "signin" && !email.includes("@") && /^[+\d\s()-]{8,}$/.test(email.trim());
  const passwordHint = mode === "signup" && password ? passwordProblem(password, { email, name }) : "";
  // Sign-up advertises the ₹50 welcome coupon; sign-in shows the festival / match code ending soonest.
  const offer = mode === "signup" ? findOffer("welcome-50") : codes[0] ?? findOffer("welcome-50");

  useEffect(() => {
    if(mode!=="signup" || new URLSearchParams(window.location.search).get("callback")!=="1")return;
    // Restored one tick after mount, so no state is set synchronously inside the effect body.
    const timer=window.setTimeout(()=>{
    setMethod("email");
    try{
      const saved=sessionStorage.getItem("nise-callback-signup");
      if(!saved)return;
      const parsed=JSON.parse(saved) as {name?:string;email?:string;phone?:string;emailCodeSent?:boolean;createdAt?:number};
      if(!parsed.createdAt || Date.now()-parsed.createdAt>30*60_000){sessionStorage.removeItem("nise-callback-signup");return;}
      if(parsed.name)setName(parsed.name);
      if(parsed.email)setEmail(parsed.email);
      if(parsed.phone)setPhone(parsed.phone);
      if(parsed.emailCodeSent && Date.now()-parsed.createdAt<8*60_000) {
        setStage("otp");
        setSuccess("A 6-digit email verification code was sent when you requested your callback. Enter that code below, then complete your profile.");
      }
    }catch{/* Normal signup remains available. */}
    },0);
    return()=>window.clearTimeout(timer);
  },[mode]);

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

  // Staff with no saved page to return to go straight to the staff desk.
  async function done() {
    navigating.current = true;
    setBusy(true);
    // Clear the anonymous session cache after successful authentication, and
    // signal persistent layout providers (offers) to load signed-in state.
    invalidateSessionCache();
    try { sessionStorage.removeItem("nise-callback-signup"); } catch {}
    let target = takeReturn();
    if (target === "/profile") {
      try {
        const user = await getSessionUser();
        if (isStaffRole(user?.role)) target = STAFF_HOME;
      } catch { /* keep the profile fallback */ }
    }
    router.push(target); router.refresh();
  }

  async function submitDetails(event: FormEvent) {
    event.preventDefault();
    if (!startSubmit()) return;
    setError(""); setSuccess(""); setFieldErrors({});
    try {
      if (mode === "signin") {
        const { ok, result } = await post("Q7m4kP2vL9sD", { email, password });
        if (!ok) { showFailure(result, t.failSignin); return; }
        if (result.requiresOtp) { setStage("otp"); setResendIn(60); setSuccess(t.sentVerify); return; }
        done(); return;
      }
      const { ok, result } = await post("N5c8R1xT6bW3", { email, purpose: "signup", website });
      if (!ok) { showFailure(result, t.failSend); return; }
      setStage("otp"); setResendIn(result.resendAfter ?? 60); setSuccess(result.message ?? t.otpSpam);
    } finally { finishSubmit(); }
  }

  async function requestSignInCode() {
    if (!email.includes("@")) { setFieldErrors({ email: x.codeFirst }); return; }
    if (!startSubmit()) return;
    setError(""); setSuccess(""); setFieldErrors({});
    try {
      const { ok, result } = await post("N5c8R1xT6bW3", { email, purpose: "signin", website });
      if (!ok) { showFailure(result, t.failSend); return; }
      setStage("otp"); setResendIn(result.resendAfter ?? 60); setSuccess(result.message ?? t.otpSpam);
    } finally { finishSubmit(); }
  }

  async function requestSmsCode(channel?: "sms" | "whatsapp") {
    if (!startSubmit()) return;
     setError(""); setSuccess(""); setFieldErrors({});
    try {
      const { ok, status, result } = await post("P3s7K1mW8xQ4", { action: "send", phone: email, website, ...(channel ? { channel } : {}) });
      if (!ok) {
        if (status === 503 && channel) setUnavailableChannels((previous) => previous.includes(channel) ? previous : [...previous, channel]);
        showFailure(result, t.failSend);
        return;
      }
      setViaSms(true); setStage("otp"); setResendIn(result.resendAfter ?? 60); setSuccess(result.message ?? "");
    } finally { finishSubmit(); }
  }

  async function resend() {
    if (submitting.current || navigating.current) return;
    if (viaSms) { await requestSmsCode(); setOtp(""); return; }
    if (!startSubmit()) return;
    setError(""); setSuccess("");
    try {
      const { ok, result } = await post("N5c8R1xT6bW3", { email, purpose: mode, website });
      if (!ok) { showFailure(result, t.failResend); return; }
      setResendIn(result.resendAfter ?? 60); setOtp(""); setSuccess(t.newCodeSent);
    } finally { finishSubmit(); }
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || navigating.current) return;
    setError(""); setFieldErrors({});
    // Sign-up: the code is checked together with the account details on the next step.
    if (viaSms) {
      if (!startSubmit()) return;
      try {
        const { ok, result } = await post("P3s7K1mW8xQ4", { action: "verify", phone: email, code: otp.trim() });
        if (!ok) { showFailure(result, t.failVerify); return; }
        await done();
      } finally { finishSubmit(); }
      return;
    }
    if (mode === "signup" && stage === "otp") { setStage("profile"); return; }
    await createOrVerify();
  }

  async function createOrVerify() {
    if (!startSubmit()) return;
    try {
      const { ok, result } = await post("H9d2M7qK4zF8", { email, code: otp.trim(), purpose: mode, ...(mode === "signup" ? { name, password, phone } : {}) });
      if (!ok) {
        showFailure(result, t.failVerify);
        if (result.fields?.password || result.fields?.name || result.fields?.phone) setStage("profile");
        else setStage("otp");
        return;
      }
      if (result.welcomeCoupon) { setWelcome(result.welcomeCoupon); setStage("welcome"); setSuccess(""); return; }
      done();
    } finally { finishSubmit(); }
  }

  async function submitProfile(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || navigating.current) return;
    setError(""); setFieldErrors({});
    const problem = passwordProblem(password, { email, name });
    if (problem) { setFieldErrors({ password: problem }); setError(problem); return; }
    await createOrVerify();
  }

  function rememberEmailForReset() {
    try { if (email) sessionStorage.setItem(RESET_EMAIL_KEY, email); } catch { /* storage unavailable */ }
  }

  const fieldError = (key: string) => fieldErrors[key] ? <span className="field__error" id={`${key}-error`} role="alert">{fieldErrors[key]}</span> : null;
  const heading = stage === "welcome" ? p.welcomeDone : stage === "otp" ? t.otpTitle : stage === "profile" ? x.finishTitle : mode === "signup" ? x.signupTitle : x.signinTitle;
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
        <h1 id="auth-heading">{heading}</h1>
        {stage !== "welcome" && <p className="auth__sub">{stage === "otp" ? <>{viaSms ? "We sent a 6-digit code to" : t.otpSub} <b>{email}</b>.{viaSms ? "" : ` ${t.otpSpam}`}</> : stage === "profile" ? x.finishSub : method === "mobile" ? (mode === "signup" ? "Start with your mobile number. We make you a 6-digit PIN." : "Enter your mobile number and 6-digit PIN.") : mode === "signup" ? x.signupSub : x.signinSub}</p>}
        {mode === "signup" && (stage === "details" || stage === "profile") && <p className="gift-strip"><Gift size={18}/><span>{p.signupGift}</span><b>₹50</b></p>}

        {mode === "signin" && demoEnabled && stage === "details" && <div className="demo-card"><strong>Local preview login</strong><span>Email: <code>demo@nisecomport.test</code></span><span>Password: <code>LocalDemo#2026</code></span><button type="button" className="btn btn--ghost btn--sm" onClick={() => { setEmail("demo@nisecomport.test"); setPassword("LocalDemo#2026"); }}>Fill demo details</button><small>Preview only: this account is temporary and does not use the database or email.</small></div>}

        {stage === "welcome" && welcome ? <div className="welcome-done">
          <div className="confetti" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <i key={index} style={{ left: `${(index * 61) % 100}%`, animationDelay: `${(index % 5) * 0.14}s` }}/>)}</div>
          <span className="success-card__icon"><PartyPopper size={30}/></span>
          <p>{fill(p.welcomeDoneText, { min: welcome.minimum, date: welcome.expiresAt ? shortDate(welcome.expiresAt.slice(0, 10), locale, true) : "" })}</p>
          <div className="big-ticket big-ticket--mini">
            <div className="big-ticket__left"><span className="big-ticket__kicker"><Gift size={15}/>{p.personal}</span><strong>₹{welcome.amount}</strong></div>
            <div className="big-ticket__right"><span className="promo-card__code-label">{p.code}</span><b className="big-ticket__code">{welcome.code}</b><CopyCode text={welcome.code} locale={locale} className="copy-btn copy-btn--light"/></div>
          </div>
          <button type="button" className="btn btn--primary btn--lg btn--block" onClick={done}>{p.continue}<ArrowRight size={18}/></button>
        </div> : stage === "profile" ? <form onSubmit={submitProfile} className="auth__form" aria-busy={busy} noValidate>
          <label className="field"><span className="field__label">{t.name}</span><span className="input-wrap"><UserRound size={18}/><input autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder={t.namePh} aria-invalid={Boolean(fieldErrors.name)} autoFocus/></span>{fieldError("name")}</label>
          <label className="field"><span className="field__label">{t.password}</span><span className="input-wrap"><LockKeyhole size={18}/><input type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={PASSWORD_MIN} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} placeholder={fill(t.newPasswordPh, { n: PASSWORD_MIN })} aria-invalid={Boolean(fieldErrors.password)} aria-describedby="password-hint"/><button type="button" className="icon-btn" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? t.hide : t.show}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span>
            <span id="password-hint" className={passwordHint ? "field__hint field__hint--warn" : "field__hint"}>{passwordHint || fill(t.passwordHint, { n: PASSWORD_MIN })}</span>
          </label>
          <label className="field"><span className="field__label">{t.phone} <em>{t.optional}</em></span><span className="input-wrap"><span className="input-prefix">+91</span><input type="tel" autoComplete="tel-national" inputMode="tel" maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} placeholder="98765 43210" aria-invalid={Boolean(fieldErrors.phone)}/></span><span className="field__hint">{x.mobileHint}</span>{fieldError("phone")}</label>
          {error && <div className="alert alert--error" role="alert">{error}</div>}
          <button className="btn btn--primary btn--lg btn--block" disabled={busy}>{busy ? t.wait : x.create}<ArrowRight size={18}/></button>
        </form> : stage === "details" && method === "mobile" ? <MobileAuthForm mode={mode} onDone={done} recoveryEnabled={availableSms || availableWhatsapp}/> : stage === "details" ? <form onSubmit={submitDetails} className="auth__form" noValidate>
          {mode === "signin"
            ? <label className="field"><span className="field__label">{x.idLabel}</span><span className="input-wrap"><Mail size={18}/><input type="text" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder={x.idPh} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined}/></span>{fieldError("email")}</label>
            : <label className="field"><span className="field__label">{t.email}</span><span className="input-wrap"><Mail size={18}/><input type="email" autoComplete="email" inputMode="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined} autoFocus/></span>{fieldError("email")}</label>}
          {mode === "signin" && <label className="field"><span className="field__label">{t.password}</span><span className="input-wrap"><LockKeyhole size={18}/><input type={showPassword ? "text" : "password"} autoComplete="current-password" required maxLength={128} value={password} onChange={e => setPassword(e.target.value)} placeholder={t.passwordPh} aria-invalid={Boolean(fieldErrors.password)}/><button type="button" className="icon-btn" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? t.hide : t.show}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span>{fieldError("password")}</label>}
          {/* Honeypot for bots: hidden from people and screen readers. */}
          <div className="hp-field" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)}/></label></div>
          {error && <div className="alert alert--error" role="alert">{error}</div>}{success && <div className="alert alert--success" role="status">{success}</div>}
          <button className="btn btn--primary btn--lg btn--block" disabled={busy}>{busy ? t.wait : mode === "signup" ? x.sendCode : t.signin}<ArrowRight size={18}/></button>
          {mode === "signin" && <div className="auth__links">{isMobileInput && (availableSms || availableWhatsapp) ? <>{availableSms && <button type="button" className="link-btn" disabled={busy} onClick={() => void requestSmsCode("sms")}>{x.smsCode}</button>}{availableWhatsapp && <button type="button" className="link-btn" disabled={busy} onClick={() => void requestSmsCode("whatsapp")}>Code on WhatsApp</button>}</> : email.includes("@") ? <button type="button" className="link-btn" disabled={busy} onClick={() => void requestSignInCode()}>{t.codeSignin}</button> : null}<Link className="link-btn" href="/forgot-password" onClick={rememberEmailForReset}>{t.forgot}</Link></div>}
        </form> : <form onSubmit={verify} className="auth__form" noValidate>
          <label className="field"><span className="field__label">{t.codeLabel}</span><input inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" className="otp-input" aria-invalid={Boolean(fieldErrors.code)} autoFocus/></label>
          {DEV && <p className="alert alert--dev"><Terminal size={18}/>{t.devHint}</p>}
          {error && <div className="alert alert--error" role="alert">{error}</div>}{success && <div className="alert alert--success" role="status">{success}</div>}
          <button className="btn btn--primary btn--lg btn--block" disabled={busy || otp.length !== 6}>{busy ? t.verifying : mode === "signup" ? x.next : t.verify}<ArrowRight size={18}/></button>
          <div className="auth__links">
            <button type="button" className="link-btn" disabled={busy || resendIn > 0} onClick={() => void resend()}>{resendIn > 0 ? fill(t.resendIn, { s: resendIn }) : t.resend}</button>
            <button type="button" className="link-btn" disabled={busy} onClick={() => { setStage("details"); setViaSms(false); setOtp(""); setError(""); setSuccess(""); }}>{mode === "signup" ? x.back : t.differentEmail}</button>
          </div>
          <p className="auth__legal">{t.codeRules}</p>
        </form>}
        {stage === "details" && <button type="button" className="link-btn auth__method" disabled={busy} onClick={() => { setMethod(method === "mobile" ? "email" : "mobile"); setError(""); setFieldErrors({}); }}>{method === "mobile" ? (mode === "signup" ? "Use email instead" : "Sign in with email instead") : "Use my mobile number instead"}</button>}
        {stage === "details" && <div className="auth__switch"><span>{mode === "signup" ? x.haveAccount : x.noAccount}</span><Link className="btn btn--ghost btn--block" href={mode === "signup" ? "/login" : "/signup"}>{mode === "signup" ? x.signInCta : x.signUpCta}</Link></div>}
        <p className="auth__legal">{t.agree} <Link href="/terms">{t.terms}</Link> {t.and} <Link href="/privacy">{t.privacy}</Link>.</p>
      </section>
    </div>
  </main>;
}
