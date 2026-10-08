import nodemailer, { type Transporter } from "nodemailer";
import { PublicError } from "@/lib/errors";
import { site } from "@/lib/site";

let cachedTransporter: Transporter | null = null;

export function smtpConfigured() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASSWORD && SMTP_FROM);
}

function transporter() {
  if (!smtpConfigured()) throw new PublicError("Email is not configured on this server yet. Please contact the service desk.", 503, { code: "smtp_not_configured" });
  if (cachedTransporter) return cachedTransporter;
  const port = Number(process.env.SMTP_PORT);
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    // If the mail server's certificate is issued to another name than SMTP_HOST (common on shared
    // hosting), set SMTP_TLS_SERVERNAME to the name on the certificate.
    ...(process.env.SMTP_TLS_SERVERNAME?.trim() ? { tls: { servername: process.env.SMTP_TLS_SERVERNAME.trim() } } : {}),
    // Never let a slow mail server hang a sign-in request.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return cachedTransporter;
}

export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

type Mail = { to: string; subject: string; heading: string; paragraphs: string[]; code?: string; action?: { label: string; href: string }; footer?: string };

function render(mail: Mail) {
  const footer = mail.footer ?? `${site.name} · ${site.address.oneLine} · ${site.phones.primary.display}`;
  const text = [mail.heading, "", ...mail.paragraphs, ...(mail.code ? ["", `Code: ${mail.code}`] : []), ...(mail.action ? ["", `${mail.action.label}: ${mail.action.href}`] : []), "", footer].join("\n");
  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f7f5ed"><div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;margin:0 auto;padding:32px 24px;color:#202923">
<p style="color:#24533c;font-weight:bold;letter-spacing:2px;margin:0 0 24px">${escapeHtml(site.name)}</p>
<h1 style="font-size:22px;margin:0 0 16px">${escapeHtml(mail.heading)}</h1>
${mail.paragraphs.map((paragraph) => `<p style="line-height:1.55;margin:0 0 14px">${escapeHtml(paragraph)}</p>`).join("\n")}
${mail.code ? `<p style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#fffefa;border:1px solid #e5e7df;padding:18px;text-align:center;margin:20px 0">${escapeHtml(mail.code)}</p>` : ""}
${mail.action ? `<p style="margin:24px 0"><a href="${escapeHtml(mail.action.href)}" style="background:#24533c;color:#fffefa;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">${escapeHtml(mail.action.label)}</a></p>` : ""}
<p style="color:#737970;font-size:12px;line-height:1.5;margin-top:32px;border-top:1px solid #e5e7df;padding-top:16px">${escapeHtml(footer)}</p>
</div></body></html>`;
  return { text, html };
}

/**
 * Local development without SMTP: print the email (including any code) in the terminal running
 * `npm run dev`, so sign-up and sign-in can be tested. Never used in production builds, and
 * MAIL_DEV_CONSOLE=0 turns it off even in development.
 */
function devConsoleMail() {
  return process.env.NODE_ENV !== "production" && process.env.MAIL_DEV_CONSOLE !== "0" && (!smtpConfigured() || process.env.MAIL_DEV_CONSOLE === "1");
}

export async function sendMail(mail: Mail) {
  const { text, html } = render(mail);
  if (devConsoleMail()) {
    console.info(`\n──── [dev mail] to ${mail.to} ────\nSubject: ${mail.subject}\n${text}\n──────────────────────────────\n`);
    return;
  }
  await transporter().sendMail({
    from: process.env.SMTP_FROM,
    ...(process.env.SMTP_REPLY_TO ? { replyTo: process.env.SMTP_REPLY_TO } : {}),
    to: mail.to,
    subject: mail.subject,
    text,
    html,
  });
}

export type OtpPurpose = "signup" | "signin" | "reset" | "email-change" | "reveal";

const OTP_COPY: Record<OtpPurpose, { subject: string; heading: string; intro: string }> = {
  signup: { subject: "Your NISE COMPORT verification code", heading: "Verify your email", intro: "Enter this code to finish creating your NISE COMPORT account." },
  signin: { subject: "Your NISE COMPORT sign-in code", heading: "Your sign-in code", intro: "Enter this code to sign in to your NISE COMPORT account." },
  reset: { subject: "Reset your NISE COMPORT password", heading: "Reset your password", intro: "Enter this code on the password reset page to choose a new password." },
  "email-change": { subject: "Confirm your new email for NISE COMPORT", heading: "Confirm your new email", intro: "Enter this code in your profile to move your NISE COMPORT account to this email address." },
  reveal: { subject: "Confirm viewing a PAN number", heading: "Confirm you are viewing a PAN", intro: "Someone asked to view a full PAN number in NISE COMPORT records. Enter this code only if that was you. Every view is logged." },
};

export async function sendOtpEmail(to: string, code: string, purpose: OtpPurpose = "signup") {
  const copy = OTP_COPY[purpose];
  await sendMail({
    to, subject: copy.subject, heading: copy.heading, code,
    paragraphs: [copy.intro, "The code expires in 10 minutes and can be used once.", "NISE COMPORT staff will never ask you for this code. If you did not request it, you can ignore this email; your account stays safe."],
  });
}

export async function sendAccountExistsEmail(to: string) {
  await sendMail({
    to, subject: "You already have a NISE COMPORT account", heading: "You already have an account",
    paragraphs: ["Someone (hopefully you) tried to create a new NISE COMPORT account with this email address. You already have an account, so no new account was created.", "Sign in with your password, or choose “Sign in with an email code”. If you’ve forgotten your password, use “Forgot password” on the sign-in page.", "If this wasn’t you, you can ignore this email."],
    action: { label: "Sign in", href: `${site.url}/login` },
  });
}

export async function sendPasswordChangedEmail(to: string, name: string) {
  await sendMail({
    to, subject: "Your NISE COMPORT password was changed", heading: "Your password was changed",
    paragraphs: [`Hello ${name},`, "The password for your NISE COMPORT account was just changed, and other devices were signed out.", `If you didn’t do this, reset your password now and call us on ${site.phones.primary.display}.`],
    action: { label: "Reset password", href: `${site.url}/forgot-password` },
  });
}

export async function sendEmailChangedNotice(oldEmail: string, name: string, newEmail: string) {
  const masked = newEmail.replace(/^(.{2}).*(@.*)$/, "$1•••$2");
  await sendMail({
    to: oldEmail, subject: "Your NISE COMPORT sign-in email was changed", heading: "Your sign-in email was changed",
    paragraphs: [`Hello ${name},`, `Your NISE COMPORT account now signs in with ${masked}. This address will no longer receive account emails.`, `If you didn’t make this change, call us on ${site.phones.primary.display} straight away.`],
  });
}

export async function sendAccountDeletedEmail(to: string, name: string) {
  await sendMail({
    to, subject: "Your NISE COMPORT account was deleted", heading: "Your account was deleted",
    paragraphs: [`Hello ${name},`, "Your NISE COMPORT account has been closed and your personal details removed. Records we must keep for completed services are kept without your contact details.", "You’re welcome to create a new account at any time."],
  });
}

export async function sendStatusEmail(to: string, name: string, reference: string, label: string, status: string) {
  await sendMail({
    to, subject: `NISE COMPORT update for ${reference}`, heading: `Update on ${reference}`,
    paragraphs: [`Hello ${name},`, `Your ${label} (${reference}) is now marked “${status}”.`, "Sign in to your profile to see the details. Reply or call us if anything needs changing."],
    action: { label: "Open my account", href: `${site.url}/profile` },
  });
}

export async function sendRequestReceivedEmail(to: string, name: string, reference: string, label: string) {
  await sendMail({
    to, subject: `We received your request ${reference}`, heading: "Request received",
    paragraphs: [`Hello ${name},`, `Thank you. We received your ${label} request. Your reference is ${reference}.`, "Our team will review it and contact you with the document checklist and any service charge before any work starts. Please don’t send OTPs, PINs or passwords to anyone."],
    action: { label: "Open my account", href: `${site.url}/profile` },
  });
}

/** A message to a customer (e.g. their personal promo code) with a button to their account. */
export async function sendCustomerMessageEmail(to: string, subject: string, lines: string[], link: string) {
  await sendMail({ to, subject, heading: subject, paragraphs: lines, action: { label: "Open my account", href: link } });
}

export async function sendStaffAlertEmail(to: string, subject: string, lines: string[], link: string) {
  await sendMail({ to, subject, heading: subject, paragraphs: lines, action: { label: "Open staff dashboard", href: link } });
}
