import nodemailer, { type Transporter } from "nodemailer";
import { PublicError } from "@/lib/errors";
import { resolveIntegration } from "@/lib/integration-vault";
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

type Mail = {
  to: string; subject: string; heading: string; paragraphs: string[]; code?: string;
  action?: { label: string; href: string }; footer?: string;
  /** A picture shown under the text (for example a birthday card). */
  image?: { src: string; alt: string };
  /** Link that stops this kind of email. Shown in the footer and sent as the List-Unsubscribe header. */
  unsubscribe?: string;
  /** A tidy key/value card (reference numbers, status, service name) instead of a paragraph of run-on text. */
  details?: { label: string; value: string; emphasis?: boolean }[];
  /** Small grey line above everything, e.g. "Please reply above this line". */
  topNote?: string;
  /** The customer's own words, shown in a quote box under the details. */
  quote?: { label: string; text: string };
  /** Message-centre mail: threading headers, a specific From and real attachments. */
  extra?: { from?: string; replyTo?: string; messageId?: string; inReplyTo?: string; references?: string[]; headers?: Record<string, string>; attachments?: { filename: string; content: Buffer; contentType: string }[] };
};

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
  const detailLines = mail.details?.map((row) => `${row.label}: ${row.value}`) ?? [];
  const text = [...(mail.topNote ? [`-#-#- ${mail.topNote} -#-#-`, ""] : []), mail.heading, "", ...mail.paragraphs, ...(detailLines.length ? ["", ...detailLines] : []), ...(mail.quote ? ["", `${mail.quote.label}:`, mail.quote.text] : []), ...(mail.code ? ["", `Code: ${mail.code}`] : []), ...(mail.image ? ["", `${mail.image.alt}: ${mail.image.src}`] : []), ...(mail.action ? ["", `${mail.action.label}: ${mail.action.href}`] : []), ...(mail.unsubscribe ? ["", `Stop these emails: ${mail.unsubscribe}`] : []), "", footer].join("\n");

  const logoUrl = absoluteUrl(site.logoPath);
  const siteHost = site.url.replace(/^https?:\/\//, "");
  // Small inline icons (as data-free emoji glyphs, since email clients won't fetch an icon font)
  // so the contact row reads as buttons to tap, not a wall of plain links.
  const contactLinks: { label: string; href: string; icon: string }[] = [
    { label: "Call us", href: `tel:${site.phones.primary.e164}`, icon: "📞" },
    { label: "WhatsApp", href: whatsappLink(`Hi ${site.name}, I have a question about my account.`), icon: "💬" },
    { label: "Website", href: site.url, icon: "🌐" },
    { label: "Email", href: `mailto:${site.email}`, icon: "✉️" },
    { label: "Directions", href: site.mapsUrl, icon: "📍" },
  ];
  const contactRow = contactLinks.map((link) => `<a href="${escapeHtml(link.href)}" style="display:inline-block;color:${BLUE_700};text-decoration:none;font-weight:600;font-size:13px;background:#ffffff;border:1px solid ${LINE};border-radius:999px;padding:8px 14px;margin:0 6px 8px 0;white-space:nowrap">${link.icon} ${escapeHtml(link.label)}</a>`).join("");

  const detailsCard = mail.details?.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;border:1px solid ${LINE};border-radius:14px;overflow:hidden;border-collapse:separate">
    ${mail.details.map((row, index) => `<tr style="${index % 2 === 1 ? `background:${BG}` : ""}">
      <td style="padding:12px 16px;color:${MUTED};font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(row.label)}</td>
      <td style="padding:12px 16px;color:${row.emphasis ? BLUE_700 : INK};font-size:14px;font-weight:${row.emphasis ? "bold" : "600"};text-align:right;word-break:break-word">${escapeHtml(row.value)}</td>
    </tr>`).join("")}
  </table>` : "";

  const quoteBox = mail.quote ? `<div style="margin:0 0 20px;padding:14px 16px;background:${BG};border-left:4px solid ${BLUE};border-radius:10px;text-align:left">
      <p style="margin:0 0 6px;font-size:12px;color:${MUTED};font-weight:600;text-transform:uppercase;letter-spacing:.04em">${escapeHtml(mail.quote.label)}</p>
      <p style="margin:0;font-size:14px;line-height:1.55;color:${INK};white-space:pre-wrap;word-break:break-word">${escapeHtml(mail.quote.text)}</p></div>` : "";
  const topBar = mail.topNote ? `<p style="margin:0 0 12px;text-align:center;color:${MUTED};font-size:12px;letter-spacing:.06em">-#-#- ${escapeHtml(mail.topNote)} -#-#-</p>` : "";

  const html = `<!doctype html><html lang="en"><body style="margin:0;background:${BG}"><div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:28px 16px">
${topBar}<div style="background:#ffffff;border:1px solid ${LINE};border-radius:20px;overflow:hidden;text-align:center">
  <div style="padding:26px 28px;border-bottom:1px solid ${LINE};background:${BG};text-align:center">
    <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(site.name)}" height="40" style="display:inline-block;height:40px;width:auto"/>
  </div>
  <div style="padding:32px 28px;text-align:center">
    <h1 style="font-size:22px;margin:0 0 16px;color:${INK}">${escapeHtml(mail.heading)}</h1>
    <div style="text-align:left">
      ${mail.paragraphs.map((paragraph) => `<p style="line-height:1.55;margin:0 0 14px;color:${INK}">${escapeHtml(paragraph).replace(/\n/g, "<br/>")}</p>`).join("\n")}
      ${detailsCard}
      ${quoteBox}
    </div>
    ${mail.image ? `<p style="margin:18px 0 6px;text-align:center"><img src="${escapeHtml(mail.image.src)}" alt="${escapeHtml(mail.image.alt)}" width="480" style="display:inline-block;max-width:100%;height:auto;border-radius:16px"/></p>` : ""}
    ${mail.code ? `<p style="font-size:32px;font-weight:bold;letter-spacing:8px;background:${BG};border:1.5px solid ${BLUE};border-radius:14px;color:${BLUE_700};padding:18px;text-align:center;margin:20px 0">${escapeHtml(mail.code)}</p>` : ""}
    ${mail.action ? `<p style="margin:24px 0 4px;text-align:center"><a href="${escapeHtml(mail.action.href)}" style="background:${BLUE};color:#ffffff;padding:12px 26px;border-radius:999px;text-decoration:none;font-weight:bold;display:inline-block">${escapeHtml(mail.action.label)}</a></p>` : ""}
  </div>
  <div style="padding:24px 28px;background:${BG};border-top:1px solid ${LINE};text-align:center">
    <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(site.name)}" height="22" style="display:inline-block;height:22px;width:auto;opacity:.85;margin-bottom:14px"/>
    <p style="margin:0 0 4px;font-size:12px;color:${MUTED};font-weight:600;text-transform:uppercase;letter-spacing:.04em">Need help? Reach us directly</p>
    <p style="margin:0 0 16px;text-align:center">${contactRow}</p>
    <p style="color:${MUTED};font-size:12px;line-height:1.7;margin:0;border-top:1px solid ${LINE};padding-top:16px;text-align:center">
      <b style="color:${INK}">${escapeHtml(site.name)}</b><br/>${escapeHtml(site.address.oneLine)}<br/>
      <a href="${escapeHtml(site.url)}" style="color:${BLUE_700};text-decoration:none;font-weight:600">${escapeHtml(siteHost)}</a>
    </p>
  </div>
</div>
<p style="text-align:center;color:${MUTED};font-size:11px;margin:18px 0 0">${mail.unsubscribe ? `You're receiving this because you agreed to hear from NISE COMPORT. <a href="${escapeHtml(mail.unsubscribe)}" style="color:${MUTED}">Stop these emails</a>.` : "You're receiving this because you have a NISE COMPORT account or submitted a request to us."}</p>
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
  // Accounts made with a mobile number have a placeholder address (.invalid) until a real email is added: never mail it.
  if (mail.to.trim().toLowerCase().endsWith(".invalid")) return;
  const { text, html } = render(mail);
  if (devConsoleMail()) {
    console.info(`\n──── [dev mail] to ${mail.to} ────\nSubject: ${mail.subject}\n${text}\n──────────────────────────────\n`);
    return;
  }
  // A vault outage must not break an existing SMTP configuration.
  const vault = await resolveIntegration("email").catch((error) => {
    console.error("[mail] integration vault unavailable; falling back to environment SMTP", error instanceof Error ? error.message : error);
    return {} as Record<string, string>;
  });
  const hasVault = Boolean(vault.host && vault.port && vault.user && vault.password && vault.from);
  const sender = hasVault ? nodemailer.createTransport({
    host: vault.host, port: Number(vault.port), secure: Number(vault.port) === 465,
    requireTLS: Number(vault.port) === 587,
    auth: { user: vault.user, pass: vault.password },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000,
  }) : transporter();
  await sender.sendMail({
    from: mail.extra?.from ?? (hasVault ? vault.from : process.env.SMTP_FROM),
    ...((mail.extra?.replyTo ?? process.env.SMTP_REPLY_TO) ? { replyTo: mail.extra?.replyTo ?? process.env.SMTP_REPLY_TO } : {}),
    to: mail.to,
    subject: mail.subject,
    text,
    html,
    ...(mail.extra?.messageId ? { messageId: mail.extra.messageId } : {}),
    ...(mail.extra?.inReplyTo ? { inReplyTo: mail.extra.inReplyTo } : {}),
    ...(mail.extra?.references?.length ? { references: mail.extra.references } : {}),
    ...(mail.extra?.headers || mail.unsubscribe ? { headers: { ...(mail.unsubscribe ? { "List-Unsubscribe": `<${mail.unsubscribe}>` } : {}), ...mail.extra?.headers } } : {}),
    ...(mail.extra?.attachments?.length ? { attachments: mail.extra.attachments } : {}),
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

export async function sendStatusEmail(to: string, name: string, reference: string, label: string, status: string, official?: { reference: string; label: string } | null) {
  await sendMail({
    to, subject: `NISE COMPORT update for ${reference}`, heading: `Update on ${reference}`,
    paragraphs: [`Hello ${name},`, `Your ${label} is now marked “${status}”.`, "Sign in to your profile to see the full details. Reply or call us if anything needs changing."],
    details: [
      { label: "Service", value: label },
      { label: "Our reference", value: reference },
      ...(official?.reference ? [{ label: official.label || "Official reference", value: official.reference, emphasis: true }] : []),
      { label: "Status", value: status, emphasis: true },
    ],
    action: { label: "Open my account", href: `${site.url}/profile` },
  });
}

export async function sendRequestReceivedEmail(to: string, name: string, reference: string, label: string, submitted: { label: string; value: string }[] = []) {
  await sendMail({
    to, subject: `We received your request ${reference}`, heading: "Request received",
    paragraphs: [
      `Hello ${name},`,
      "Thank you — we received your request. Our team will review it and reach out with the document checklist and any service charge before any work starts.",
      "We may contact you again later — by call, WhatsApp or email — for extra information, or for documents we still need, including hard copies where the government portal or insurer requires an original. By sending this request, you're giving NISE COMPORT consent to collect and use the details and documents you share with us, solely to provide this service on your behalf.",
      "This reference is our own internal tracking number for now. Once we file your application with the government portal or insurer, we’ll add their official application/certificate number here too and let you know.",
      "If anything about your request needs sorting out, we’ll get back to you directly on these details — and you’re always welcome to reach us the same way. Please don’t send OTPs, PINs or passwords to anyone, including us.",
    ],
    details: [
      { label: "Service", value: label },
      { label: "Our reference", value: reference, emphasis: true },
      ...submitted,
    ],
    action: { label: "Open my account", href: `${site.url}/profile` },
  });
}

/** Sent only when staff add or change the official application/certificate/policy number for a request. */
export async function sendOfficialReferenceEmail(to: string, name: string, reference: string, label: string, status: string, official: { reference: string; label: string }) {
  await sendMail({
    to, subject: `Your official ${official.label || "reference number"} for ${reference}`, heading: "Official reference number added",
    paragraphs: [`Hello ${name},`, `We’ve submitted your ${label} to the official portal and received your official reference number. Keep both numbers — you may need either one when you call us or check status elsewhere.`],
    details: [
      { label: "Service", value: label },
      { label: "Our reference", value: reference },
      { label: official.label || "Official reference", value: official.reference, emphasis: true },
      { label: "Status", value: status },
    ],
    action: { label: "Open my account", href: `${site.url}/profile` },
  });
}

/** A message to a customer (e.g. their personal promo code) with a button to their account. */
export async function sendCustomerMessageEmail(to: string, subject: string, lines: string[], link: string) {
  await sendMail({ to, subject, heading: subject, paragraphs: lines, action: { label: "Open my account", href: link } });
}

/** Sent once a service request is marked "completed", asking the customer to rate the help they got. */
export async function sendReviewRequestEmail(to: string, name: string, reference: string, label: string) {
  await sendMail({
    to, subject: `How did we do with ${label}?`, heading: "Rate your experience",
    paragraphs: [
      `Hello ${name},`,
      `Your ${label} (${reference}) is complete. We'd love to know how it went — it takes under a minute and helps us get better.`,
      "Rate us 1 to 5 and tell us anything we could improve. If you had a great experience, we'll also ask if you'd share it on Google — that's the single biggest way neighbours find honest local help.",
    ],
    details: [{ label: "Service", value: label }, { label: "Our reference", value: reference }],
    action: { label: "Rate your experience", href: `${site.url}/review/${encodeURIComponent(reference)}` },
  });
}

export async function sendStaffAlertEmail(to: string, subject: string, lines: string[], link: string) {
  await sendMail({ to, subject, heading: subject, paragraphs: lines, action: { label: "Open staff dashboard", href: link } });
}

/** Tells the owner/staff inbox the moment a payment lands, with everything needed to match it to a ticket. */
export async function sendPaymentAlertEmail(info: { customer: string; phone: string | null; email: string; service: string; reference: string; amount: string; method: string; utr?: string | null }) {
  const to = process.env.PAYMENT_ALERT_EMAIL || site.email;
  await sendMail({
    to, subject: `Payment received ${info.amount} · ${info.reference}`, heading: "Payment received",
    paragraphs: [`${info.customer} has paid for ${info.service}.`],
    details: [
      { label: "Amount", value: info.amount, emphasis: true }, { label: "Ticket reference", value: info.reference, emphasis: true },
      { label: "Customer", value: info.customer }, { label: "Mobile", value: info.phone || "not given" }, { label: "Email", value: info.email },
      { label: "Service", value: info.service }, { label: "Paid via", value: info.method }, ...(info.utr ? [{ label: "UTR", value: info.utr }] : []),
    ],
    action: { label: "Open Payments", href: `${site.url}/desk` },
  });
}

export async function sendPaymentReceiptEmail(to: string, name: string, info: { reference: string; service: string; amount: string }) {
  await sendMail({
    to, subject: `Payment received for ${info.reference}`, heading: "Payment received",
    paragraphs: [`Hello ${name},`, "Thank you. We have received your payment. Keep this email as your receipt."],
    details: [{ label: "Service", value: info.service }, { label: "Our reference", value: info.reference }, { label: "Amount paid", value: info.amount, emphasis: true }],
    action: { label: "Open my account", href: `${site.url}/profile` },
  });
}

/* ---------------------------------------------------------------- message centre (tickets) */

export type TicketMailKind = "reply" | "received" | "closed" | "new";
const TICKET_MAIL_COPY: Record<TicketMailKind, { heading: string; lead?: string }> = {
  reply: { heading: "We replied to your message" },
  received: { heading: "We have received your message", lead: "Thank you for writing to us. Your message is now a ticket and our team will reply as soon as possible." },
  closed: { heading: "Your ticket has been closed", lead: "We closed this ticket because we did not hear back from you for 48 hours. Nothing is lost: reply to this email at any time to reopen it." },
  new: { heading: "A message from NISE COMPORT" },
};

/** One email of a ticket conversation. The subject must already carry the ticket tag. */
export async function sendTicketMail(input: {
  to: string; subject: string; kind: TicketMailKind; body?: string; ticketCode: string; statusLabel: string; link: string;
  from?: string; replyTo?: string; messageId?: string; inReplyTo?: string; references?: string[]; automated?: boolean;
  attachments?: { filename: string; content: Buffer; contentType: string }[]; extraNote?: string;
  /** Fuller "ticket received" card: the ticket subject, when it was opened, and the customer's own message. */
  ticketSubject?: string; openedAt?: Date; yourMessage?: string;
}) {
  const copy = TICKET_MAIL_COPY[input.kind];
  const paragraphs = [
    ...(copy.lead ? [copy.lead] : []),
    ...(input.body ? input.body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean).slice(0, 40) : []),
    ...(input.extraNote ? [input.extraNote] : []),
    "You can reply to this email to add to your ticket, or open it on our website.",
  ];
  await sendMail({
    to: input.to, subject: input.subject, heading: copy.heading, paragraphs,
    topNote: input.kind === "received" ? "Please reply above this line" : undefined,
    details: [
      { label: "Ticket #", value: input.ticketCode, emphasis: true },
      ...(input.ticketSubject ? [{ label: "Subject", value: input.ticketSubject }] : []),
      { label: "Status", value: input.statusLabel },
      ...(input.openedAt ? [{ label: "Opened", value: input.openedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) + " IST" }] : []),
    ],
    quote: input.yourMessage ? { label: "Your message", text: input.yourMessage.slice(0, 1500) } : undefined,
    action: { label: "Open ticket", href: input.link },
    extra: {
      from: input.from, replyTo: input.replyTo, messageId: input.messageId, inReplyTo: input.inReplyTo, references: input.references,
      headers: input.automated ? { "Auto-Submitted": "auto-generated", "X-Auto-Response-Suppress": "All" } : undefined,
      attachments: input.attachments,
    },
  });
}
