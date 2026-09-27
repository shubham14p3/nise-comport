"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

type Mode = "signin" | "signup";
export default function AuthPanel({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [stage, setStage] = useState<"details" | "otp">("details");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [password, setPassword] = useState(""); const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const title = mode === "signup" ? "A little help goes a long way." : "Good to see you again.";
  function successPath() { const target = new URLSearchParams(window.location.search).get("next"); return mode === "signin" && target?.startsWith("/") && !target.startsWith("//") ? target : "/profile"; }

  async function requestOtp(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      if (mode === "signin") {
        const response = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
        const result = await response.json(); if (!response.ok) throw new Error(result.error);
        if (result.requiresOtp) { setStage("otp"); setSuccess("A verification code has been sent to your email."); return; }
        router.push(successPath()); router.refresh(); return;
      }
      const response = await fetch("/api/auth/request-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, purpose: mode }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setStage("otp"); setSuccess("A verification code has been sent to your email.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "We couldn’t continue. Please try again."); }
    finally { setBusy(false); }
  }

  async function requestSignInCode() {
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/auth/request-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, purpose: "signin" }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setStage("otp"); setSuccess("A six-digit sign-in code has been sent to your email.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send a sign-in code."); }
    finally { setBusy(false); }
  }

  async function verify(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code: otp, purpose: mode, ...(mode === "signup" ? { name, password, phone } : {}) }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      router.push(successPath()); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "We couldn’t verify that code."); }
    finally { setBusy(false); }
  }

  return <main className="auth-shell"><Link href="/" className="auth-back"><ArrowLeft size={16}/> Back to NISE COMPORT</Link><div className="auth-layout"><section className="auth-brand-panel"><Link className="brand auth-brand" href="/"><span className="brand-mark">N</span><span>NISE <b>COMPORT</b><small>YOUR DIGITAL SERVICE DESK</small></span></Link><div className="auth-brand-copy"><span className="auth-kicker">YOUR ACCOUNT, YOUR WAY</span><h1>{title}</h1><p>Keep your requests, documents and updates together in one simple place.</p><div className="auth-benefits"><span><Check size={15}/> Track service requests</span><span><Check size={15}/> Manage your details securely</span><span><Check size={15}/> Get updates as things progress</span></div></div><div className="auth-quote"><ShieldCheck size={18}/><span>Your information is handled with care.<small>We only use it to help with your service requests.</small></span></div></section><section className="auth-form-panel"><div className="auth-form-inner"><div className="auth-form-top"><span className="form-icon"><LockKeyhole size={19}/></span><span className="secure-label">SECURE ACCOUNT ACCESS</span></div><h2>{stage === "otp" ? "Check your inbox." : mode === "signup" ? "Create your account" : "Sign in"}</h2><p className="auth-subtitle">{stage === "otp" ? <>We sent a six-digit code to <b>{email}</b>.</> : mode === "signup" ? "It only takes a minute to get started." : "Enter your details to continue."}</p>
      {stage === "details" ? <form onSubmit={requestOtp} className="auth-form">{mode === "signup"&&<label>Your name<input autoComplete="name" required minLength={2} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Priya Kumari"/></label>}<label>Email address<div className="input-icon"><Mail size={15}/><input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label>{mode === "signup"&&<label>Phone number <span className="optional">OPTIONAL</span><input autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Your contact number"/></label>}<label>Password<div className="input-icon"><LockKeyhole size={15}/><input type={showPassword?"text":"password"} autoComplete={mode==="signup"?"new-password":"current-password"} required minLength={mode==="signup"?10:1} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==="signup"?"At least 10 characters":"Your password"}/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff size={15}/>:<Eye size={15}/>}</button></div></label>{error&&<div className="form-alert error-alert">{error}</div>}{success&&<div className="form-alert success-alert">{success}</div>}<button className="button button-green auth-submit" disabled={busy}>{busy?"Please wait…":mode==="signup"?"Continue with email verification":"Sign in"}<ArrowRight size={16}/></button>{mode === "signin" && <button type="button" className="resend-link" disabled={busy || !email} onClick={() => void requestSignInCode()}>Sign in with an email code</button>}</form> : <form onSubmit={verify} className="auth-form"><label>6-digit verification code<input inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value)} placeholder="000000" className="otp-input"/></label>{error&&<div className="form-alert error-alert">{error}</div>}{success&&<div className="form-alert success-alert">{success}</div>}<button className="button button-green auth-submit" disabled={busy}>{busy?"Verifying…":"Verify and continue"}<ArrowRight size={16}/></button><button type="button" className="resend-link" disabled={busy} onClick={async()=>{setError("");setSuccess("");try{const response=await fetch("/api/auth/request-otp",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,purpose:mode})});const result=await response.json();if(!response.ok)throw new Error(result.error);setSuccess("A new code has been sent.")}catch(reason){setError(reason instanceof Error?reason.message:"Could not resend code.")}}}>Resend code</button></form>}
      <div className="auth-switch">{mode==="signup"?<>Already have an account? <Link href="/login">Sign in</Link></>:<>New to NISE COMPORT? <Link href="/signup">Create an account</Link></>}</div><p className="auth-legal">By continuing, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p></div></section></div></main>;
}
