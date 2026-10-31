"use client";

import { Gift, MessageCircle, Smartphone, X, Mail, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { promptDue } from "@/lib/mobile-login-core";
import { secureApi, secureResult } from "@/lib/secure-api-client";

type Status = { missing: ("name" | "email" | "mobile" | "whatsapp")[]; smsEnabled: boolean; whatsappEnabled?: boolean; rewards: { phone: number; email: number }; earned: string[]; user: { name: string; email: string; phone: string; whatsapp: string } };
const SEEN_KEY = "nise-signed-in-at"; const SHOWN_KEY = "nise-verify-shown";
const read = (key: string) => { try { const value = window.localStorage.getItem(key); return value ? Number(value) : null; } catch { return null; } };
const write = (key: string, value: number) => { try { window.localStorage.setItem(key, String(value)); } catch { /* storage can be blocked */ } };

/**
 * A polite, dismissible prompt a few minutes after sign-in (and again each day) asking for a missing name, WhatsApp number,
 * verified email and verified mobile. Works the same on phones and desktops. ₹20 each for the verified mobile and email.
 */
export default function VerifyPrompt({ signedIn }: { signedIn: boolean }) {
  const [status, setStatus] = useState<Status | null>(null); const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    const now = Date.now();
    const since = read(SEEN_KEY) ?? now; if (read(SEEN_KEY) === null) write(SEEN_KEY, now);
    let timer = 0; let active = true;
    secureApi<Status>("W6c1X8kT3nJ9").then((result) => {
      if (!active || !result.missing.length) return;
      setStatus(result);
      const wait = () => {
        if (promptDue(since, read(SHOWN_KEY), Date.now())) { setOpen(true); write(SHOWN_KEY, Date.now()); return; }
        timer = window.setTimeout(wait, 20_000);
      };
      wait();
    }).catch(() => undefined);
    return () => { active = false; window.clearTimeout(timer); };
  }, [signedIn]);

  if (!open || !status) return null;
  const refresh = () => secureApi<Status>("W6c1X8kT3nJ9").then((next) => { setStatus(next); if (!next.missing.length) setOpen(false); }).catch(() => undefined);
  return <div className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="verify-title" onClick={() => setOpen(false)}>
    <div className="help-dialog__card verify-card" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="icon-btn help-dialog__close" aria-label="Close" onClick={() => setOpen(false)}><X size={20}/></button>
      <span className="chip chip--soft"><Gift size={14}/> Earn ₹{status.rewards.phone + status.rewards.email}</span>
      <h2 id="verify-title">Keep your account safe</h2>
      <p className="muted">Add these once so we can reach you and you can always get back in. Verified mobile: ₹{status.rewards.phone}. Verified email: ₹{status.rewards.email}. The reward is added to your welcome coupon (₹50 in all), which you can use on your orders.</p>
      {status.missing.includes("name") && <NameRow onSaved={refresh}/>}
      {status.missing.includes("whatsapp") && <WhatsAppRow defaultValue={status.user.phone.replace(/^\+91/, "")} onSaved={refresh}/>}
      {status.missing.includes("email") && <EmailRow reward={status.rewards.email} onVerified={refresh}/>}
      {status.missing.includes("mobile") && <MobileRow phone={status.user.phone.replace(/^\+91/, "")} smsEnabled={status.smsEnabled} whatsappEnabled={Boolean(status.whatsappEnabled)} reward={status.rewards.phone} onVerified={refresh}/>}
      <button type="button" className="btn btn--ghost btn--block" onClick={() => setOpen(false)}>Not now</button>
    </div>
  </div>;
}

function Msg({ text }: { text: string }) { return text ? <span className="field__error" role="alert">{text}</span> : null; }

function NameRow({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function save() { setBusy(true); const { ok, result } = await secureResult<{ error?: string }>("H4p7D2vR9mQ1", { name }); setBusy(false); if (!ok) setError(result.error ?? "Could not save."); else onSaved(); }
  return <div className="verify-row"><label className="field"><span className="field__label"><UserRound size={15}/> Your name</span><span className="input-wrap"><input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} autoComplete="name"/></span><Msg text={error}/></label><button type="button" className="btn btn--primary btn--sm" disabled={busy || name.trim().length < 2} onClick={() => void save()}>Save</button></div>;
}

function WhatsAppRow({ defaultValue, onSaved }: { defaultValue: string; onSaved: () => void }) {
  const [value, setValue] = useState(defaultValue); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function save() { setBusy(true); const { ok, result } = await secureResult<{ error?: string }>("H4p7D2vR9mQ1", { whatsapp: value }); setBusy(false); if (!ok) setError(result.error ?? "Could not save."); else onSaved(); }
  return <div className="verify-row"><label className="field"><span className="field__label"><MessageCircle size={15}/> WhatsApp number</span><span className="input-wrap"><span className="input-prefix">+91</span><input inputMode="numeric" maxLength={14} value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(-10))} autoComplete="tel-national"/></span><Msg text={error}/></label><button type="button" className="btn btn--primary btn--sm" disabled={busy || value.length !== 10} onClick={() => void save()}>Save</button></div>;
}

function EmailRow({ reward, onVerified }: { reward: number; onVerified: () => void }) {
  const [email, setEmail] = useState(""); const [code, setCode] = useState(""); const [sent, setSent] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function send() { setBusy(true); setError(""); const { ok, result } = await secureResult<{ error?: string }>("M1z6P9dS4kJ7", { newEmail: email }); setBusy(false); if (!ok) setError(result.error ?? "Could not send the code."); else setSent(true); }
  async function confirm() { setBusy(true); setError(""); const { ok, result } = await secureResult<{ error?: string }>("F8c2L5vN0qR3", { newEmail: email, code }); setBusy(false); if (!ok) setError(result.error ?? "That code did not work."); else onVerified(); }
  return <div className="verify-row"><label className="field"><span className="field__label"><Mail size={15}/> Email · ₹{reward}</span>
    <span className="input-wrap"><input type="email" inputMode="email" autoCapitalize="none" value={email} disabled={sent} maxLength={254} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></span>
    {sent && <span className="input-wrap"><input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code from your email" autoComplete="one-time-code"/></span>}
    <Msg text={error}/></label>
    {sent ? <button type="button" className="btn btn--primary btn--sm" disabled={busy || code.length !== 6} onClick={() => void confirm()}>Verify</button>
      : <button type="button" className="btn btn--primary btn--sm" disabled={busy || !email.includes("@")} onClick={() => void send()}>Send code</button>}</div>;
}

function MobileRow({ phone, smsEnabled, whatsappEnabled, reward, onVerified }: { phone: string; smsEnabled: boolean; whatsappEnabled: boolean; reward: number; onVerified: () => void }) {
  const [value, setValue] = useState(phone); const [code, setCode] = useState(""); const [sent, setSent] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState<("sms" | "whatsapp")[]>([]);
  const activeSms = smsEnabled && !unavailable.includes("sms");
  const activeWhatsapp = whatsappEnabled && !unavailable.includes("whatsapp");
  if (!activeSms && !activeWhatsapp) return <p className="fine"><Smartphone size={14}/> Mobile code verification is unavailable right now. Please contact the shop for help.</p>;
  async function send(channel: "sms" | "whatsapp") {
    setBusy(true); setError("");
    const { ok, status, result } = await secureResult<{ error?: string }>("M8b5C1qJ7yL2", { action: "send", phone: value, channel });
    setBusy(false);
    if (!ok) {
      if (status === 503) setUnavailable((old) => old.includes(channel) ? old : [...old, channel]);
      setError(result.error ?? "Could not send a verification code.");
    } else setSent(true);
  }
  async function confirm() { setBusy(true); setError(""); const { ok, result } = await secureResult<{ error?: string }>("M8b5C1qJ7yL2", { action: "verify", phone: value, code }); setBusy(false); if (!ok) setError(result.error ?? "That code did not work."); else onVerified(); }
  return <div className="verify-row"><label className="field"><span className="field__label"><Smartphone size={15}/> Verify mobile · ₹{reward}</span>
    <span className="input-wrap"><span className="input-prefix">+91</span><input inputMode="numeric" maxLength={14} value={value} disabled={sent} onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(-10))} autoComplete="tel-national"/></span>
    {sent && <span className="input-wrap"><input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" autoComplete="one-time-code"/></span>}
    <Msg text={error}/></label>
    {sent ? <button type="button" className="btn btn--primary btn--sm" disabled={busy || code.length !== 6} onClick={() => void confirm()}>Verify</button>
      : <span className="verify-row__send">
        {activeSms && <button type="button" className="btn btn--primary btn--sm" disabled={busy || value.length !== 10} onClick={() => void send("sms")}>Send SMS</button>}
        {activeWhatsapp && <button type="button" className="btn btn--soft btn--sm" disabled={busy || value.length !== 10} onClick={() => void send("whatsapp")}>Send on WhatsApp</button>}
      </span>}</div>;
}
