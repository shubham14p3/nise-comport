import nodemailer, { type Transporter } from "nodemailer";
import { PublicError } from "@/lib/errors";
import { absoluteUrl, site, whatsappLink } from "@/lib/site";

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

// Brand colours, matched to the site (see src/app/globals.css :root). Email clients don't read
// CSS custom properties, so the values are copied here rather than imported.
const INK = "#0b1026";
const MUTED = "#5b6386";
const LINE = "#e2e6f3";
const BLUE = "#0a7bf7";
const BLUE_700 = "#0660c9";
const BG = "#f5f7fc";

/** Best-guess label for a profile URL in site.sameAs, so the footer reads "Facebook" not a raw link. */
function socialLabel(href: string) {
  const host = (() => { try { return new URL(href).hostname.replace(/^www\./, ""); } catch { return ""; } })();
  if (host.includes("facebook.com")) return "Facebook";
  if (host.includes("instagram.com")) return "Instagram";
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "YouTube";
  if (host.includes("justdial.com")) return "Justdial";
  if (host.includes("g.page") || host.includes("maps.app.goo.gl") || host.includes("google.com")) return "Google";
  return host || "Link";
}

function render(mail: Mail) {
  const footer = mail.footer ?? `${site.name} · ${site.address.oneLine} · ${site.phones.primary.display}`;
  const text = [mail.heading, "", ...mail.paragraphs, ...(mail.code ? ["", `Code: ${mail.code}`] : []), ...(mail.action ? ["", `${mail.action.label}: ${mail.action.href}`] : []), "", footer].join("\n");

  const logoUrl = absoluteUrl(site.logoPath);
  const siteHost = site.url.replace(/^https?:\/\//, "");
  const contactLinks: { label: string; href: string }[] = [
    { label: "Website", href: site.url },
    { label: "Call us", href: `tel:${site.phones.primary.e164}` },
    { label: "WhatsApp", href: whatsappLink(`Hi ${site.name}, I have a question about my account.`) },
    { label: "Email", href: `mailto:${site.email}` },
    { label: "Get directions", href: site.mapsUrl },
    ...site.sameAs.map((href) => ({ label: socialLabel(href), href })),
  ];
  const contactRow = contactLinks.map((link) => `<a href="${escapeHtml(link.href)}" style="color:${BLUE_700};text-decoration:none;font-weight:600;white-space:nowrap">${escapeHtml(link.label)}</a>`).join(`<span style="color:${LINE};padding:0 8px">·</span>`);

  const html = `<!doctype html><html lang="en"><body style="margin:0;background:${BG}"><div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:28px 16px">
<div style="background:#ffffff;border:1px solid ${LINE};border-radius:20px;overflow:hidden">
  <div style="padding:22px 28px;border-bottom:1px solid ${LINE}">
    <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(site.name)}" height="32" style="display:block;height:32px;width:auto"/>
  </div>
  <div style="padding:28px">
    <h1 style="font-size:22px;margin:0 0 16px;color:${INK}">${escapeHtml(mail.heading)}</h1>
    ${mail.paragraphs.map((paragraph) => `<p style="line-height:1.55;margin:0 0 14px;color:${INK}">${escapeHtml(paragraph)}</p>`).join("\n")}
    ${mail.code ? `<p style="font-size:32px;font-weight:bold;letter-spacing:8px;background:${BG};border:1.5px solid ${BLUE};border-radius:14px;color:${BLUE_700};padding:18px;text-align:center;margin:20px 0">${escapeHtml(mail.code)}</p>` : ""}
    ${mail.action ? `<p style="margin:24px 0"><a href="${escapeHtml(mail.action.href)}" style="background:${BLUE};color:#ffffff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold;display:inline-block">${escapeHtml(mail.action.label)}</a></p>` : ""}
  </div>
  <div style="padding:20px 28px;background:${BG};border-top:1px solid ${LINE}">
    <p style="margin:0 0 10px;font-size:13px;line-height:1.6">${contactRow}</p>
    <p style="color:${MUTED};font-size:12px;line-height:1.6;margin:0">${escapeHtml(site.name)} · ${escapeHtml(site.address.oneLine)}<br/><a href="${escapeHtml(site.url)}" style="color:${MUTED};text-decoration:none">${escapeHtml(siteHost)}</a></p>
  </div>
</div>
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

export type OtpPurpose = "signup" | "signin" | "reset" | "email-change";

const OTP_COPY: Record<OtpPurpose, { subject: string; heading: string; intro: string }> = {
  signup: { subject: "Your NISE COMPORT verification code", heading: "Verify your email", intro: "Enter this code to finish creating your NISE COMPORT account." },
  signin: { subject: "Your NISE COMPORT sign-in code", heading: "Your sign-in code", intro: "Enter this code to sign in to your NISE COMPORT account." },
  reset: { subject: "Reset your NISE COMPORT password", heading: "Reset your password", intro: "Enter this code on the password reset page to choose a new password." },
  "email-change": { subject: "Confirm your new email for NISE COMPORT", heading: "Confirm your new email", intro: "Enter this code in your profile to move your NISE COMPORT account to this email address." },
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
