"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { KeyRound, LogOut, Mail, ShieldCheck, Trash2 } from "lucide-react";
import { passwordProblem, PASSWORD_MIN } from "@/lib/validation";
import { secureResult } from "@/lib/secure-api-client";

type ApiResult = { error?: string; message?: string; signedOut?: number; email?: string };

async function call(operation: string, body?: unknown) {
  return secureResult<ApiResult>(operation, body ?? {});
}

function Alert({ error, message }: { error: string; message: string }) {
  return <>{error && <div className="form-alert error-alert" role="alert">{error}</div>}{message && <div className="form-alert success-alert" role="status">{message}</div>}</>;
}

/** Profile → "Sign-in & privacy": password, email, devices and account deletion. */
export default function AccountSecurityPanel({ email, emailVerified, activeSessions, openWork, demoMode = false }: { email: string; emailVerified: boolean; activeSessions: number; openWork: number; demoMode?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  const [currentPassword, setCurrentPassword] = useState(""); const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState(""); const [passwordMessage, setPasswordMessage] = useState("");

  const [newEmail, setNewEmail] = useState(""); const [emailPassword, setEmailPassword] = useState(""); const [emailCode, setEmailCode] = useState("");
  const [emailStage, setEmailStage] = useState<"start" | "code">("start");
  const [emailError, setEmailError] = useState(""); const [emailMessage, setEmailMessage] = useState("");

  const [sessionsError, setSessionsError] = useState(""); const [sessionsMessage, setSessionsMessage] = useState("");

  const [deletePassword, setDeletePassword] = useState(""); const [confirmation, setConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const hint = newPassword ? passwordProblem(newPassword, { email }) : "";
  const disabled = demoMode;

  async function changePassword(event: FormEvent) {
    event.preventDefault(); setPasswordError(""); setPasswordMessage("");
    if (hint) { setPasswordError(hint); return; }
    setBusy("password");
    const { ok, result } = await call("B7n3Q8xH5rV0", { currentPassword, newPassword });
    setBusy("");
    if (!ok) { setPasswordError(result.error ?? "Could not change your password."); return; }
    setCurrentPassword(""); setNewPassword(""); setPasswordMessage(result.message ?? "Password changed.");
  }

  async function startEmailChange(event: FormEvent) {
    event.preventDefault(); setEmailError(""); setEmailMessage(""); setBusy("email");
    const { ok, result } = await call("M1z6P9dS4kJ7", { newEmail, password: emailPassword });
    setBusy("");
    if (!ok) { setEmailError(result.error ?? "Could not start the email change."); return; }
    setEmailPassword(""); setEmailStage("code"); setEmailMessage(result.message ?? "Check the new inbox for a code.");
  }

  async function confirmEmailChange(event: FormEvent) {
    event.preventDefault(); setEmailError(""); setEmailMessage(""); setBusy("email");
    const { ok, result } = await call("F8c2L5vN0qR3", { newEmail, code: emailCode });
    setBusy("");
    if (!ok) { setEmailError(result.error ?? "Could not confirm the new email."); return; }
    setEmailStage("start"); setEmailCode(""); setEmailMessage(`Your sign-in email is now ${result.email ?? newEmail}.`); setNewEmail("");
    router.refresh();
  }

  async function signOutOthers() {
    setSessionsError(""); setSessionsMessage(""); setBusy("sessions");
    const { ok, result } = await call("Y4h7T1mK6pD9");
    setBusy("");
    if (!ok) { setSessionsError(result.error ?? "Could not sign out other devices."); return; }
    setSessionsMessage(result.signedOut ? `Signed out of ${result.signedOut} other device${result.signedOut === 1 ? "" : "s"}.` : "No other devices were signed in.");
  }

  async function deleteAccount(event: FormEvent) {
    event.preventDefault(); setDeleteError("");
    if (confirmation.trim().toUpperCase() !== "DELETE") { setDeleteError("Type DELETE to confirm."); return; }
    setBusy("delete");
    const { ok, result } = await call("J9r5W2bC8nX1", { password: deletePassword, confirmation });
    setBusy("");
    if (!ok) { setDeleteError(result.error ?? "Could not delete your account."); return; }
    router.push("/?account=deleted"); router.refresh();
  }

  return <div className="security-panels">
    {demoMode && <p className="form-alert">These settings need a real account. The local demo can’t change passwords or delete data.</p>}
    <article className="security-card"><header><ShieldCheck size={19}/><div><h3>Email verification</h3><p>{emailVerified ? `Verified: ${email}` : "Not verified yet. Sign in with an email code to verify."}</p></div></header></article>

    <article className="security-card"><header><KeyRound size={19}/><div><h3>Change password</h3><p>Other devices are signed out after a change, and we email you a confirmation.</p></div></header>
      <form onSubmit={changePassword} className="security-form" noValidate>
        <label>Current password<input type="password" autoComplete="current-password" required maxLength={128} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={disabled}/></label>
        <label>New password<input type="password" autoComplete="new-password" required minLength={PASSWORD_MIN} maxLength={128} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={disabled} aria-describedby="new-password-hint"/><small id="new-password-hint" className={hint ? "field-hint field-hint-warn" : "field-hint"}>{hint || `At least ${PASSWORD_MIN} characters.`}</small></label>
        <Alert error={passwordError} message={passwordMessage}/>
        <button className="button button-green" disabled={disabled || busy === "password" || !currentPassword || !newPassword}>{busy === "password" ? "Saving…" : "Change password"}</button>
      </form>
    </article>

    <article className="security-card"><header><Mail size={19}/><div><h3>Change sign-in email</h3><p>We send a code to the new address, and tell the old address after the change.</p></div></header>
      {emailStage === "start" ? <form onSubmit={startEmailChange} className="security-form" noValidate>
        <label>New email address<input type="email" inputMode="email" autoComplete="email" required maxLength={254} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} disabled={disabled}/></label>
        <label>Your password<input type="password" autoComplete="current-password" required maxLength={128} value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} disabled={disabled}/></label>
        <Alert error={emailError} message={emailMessage}/>
        <button className="button button-outline" disabled={disabled || busy === "email" || !newEmail || !emailPassword}>{busy === "email" ? "Sending…" : "Send code to new email"}</button>
      </form> : <form onSubmit={confirmEmailChange} className="security-form" noValidate>
        <label>Code sent to {newEmail}<input inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={emailCode} onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="otp-input"/></label>
        <Alert error={emailError} message={emailMessage}/>
        <div className="security-actions"><button className="button button-green" disabled={busy === "email" || emailCode.length !== 6}>{busy === "email" ? "Confirming…" : "Confirm new email"}</button><button type="button" className="profile-text-button" onClick={() => { setEmailStage("start"); setEmailCode(""); setEmailError(""); setEmailMessage(""); }}>Cancel</button></div>
      </form>}
    </article>

    <article className="security-card"><header><LogOut size={19}/><div><h3>Signed-in devices</h3><p>{activeSessions > 1 ? `You’re signed in on ${activeSessions} devices or browsers.` : "You’re signed in on this device only."} Lost a phone? Sign out everywhere else.</p></div></header>
      <Alert error={sessionsError} message={sessionsMessage}/>
      <button type="button" className="button button-outline" onClick={() => void signOutOthers()} disabled={disabled || busy === "sessions"}>{busy === "sessions" ? "Signing out…" : "Sign out of other devices"}</button>
    </article>

    <article className="security-card security-danger"><header><Trash2 size={19}/><div><h3>Delete account</h3><p>Removes your name, email, phone and saved addresses. Records we must keep for completed services stay, without your contact details. This can’t be undone.</p></div></header>
      {openWork > 0 ? <p className="form-alert">You have {openWork} open request{openWork === 1 ? "" : "s"}. Cancel {openWork === 1 ? "it" : "them"} or wait until {openWork === 1 ? "it’s" : "they’re"} completed before deleting your account.</p> :
        <form onSubmit={deleteAccount} className="security-form" noValidate>
          <label>Your password<input type="password" autoComplete="current-password" required maxLength={128} value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} disabled={disabled}/></label>
          <label>Type DELETE to confirm<input required maxLength={10} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} disabled={disabled} autoComplete="off"/></label>
          <Alert error={deleteError} message=""/>
          <button className="button button-danger" disabled={disabled || busy === "delete" || !deletePassword}>{busy === "delete" ? "Deleting…" : "Delete my account"}</button>
        </form>}
    </article>
    <p className="profile-security-tip"><b>Safety reminder:</b> Never share your email code, password, Aadhaar OTP, banking PIN or card details with anyone, including our staff.</p>
  </div>;
}
