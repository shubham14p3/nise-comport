import { after } from "next/server";
import { cloudApiConfigured, sendTemplate } from "@/lib/whatsapp";

/**
 * Automatic WhatsApp copies of a new request, to the customer and to the shop.
 * Only runs when the Cloud API is set up and these approved templates exist (see README):
 *   WHATSAPP_CONFIRM_TEMPLATE  to the customer, body {{1}} name, {{2}} reference, {{3}} service
 *   WHATSAPP_STAFF_NUMBER      the shop's WhatsApp number (e.g. 919771219893)
 *   WHATSAPP_STAFF_TEMPLATE    to the shop, body {{1}} reference, {{2}} service, {{3}} customer, {{4}} details
 * Without them the success screen offers a one-tap "Send on WhatsApp" with the full summary instead.
 */
export function whatsappAlertsEnabled() {
  return cloudApiConfigured() && Boolean(process.env.WHATSAPP_CONFIRM_TEMPLATE?.trim() || process.env.WHATSAPP_STAFF_TEMPLATE?.trim());
}

export function sendRequestWhatsApp(input: { name: string; phone: string | null; reference: string; service: string; details: string; lang?: "en" | "hi" | "bn" }) {
  if (!cloudApiConfigured()) return;
  const confirm = process.env.WHATSAPP_CONFIRM_TEMPLATE?.trim();
  const staffTemplate = process.env.WHATSAPP_STAFF_TEMPLATE?.trim();
  const staffNumber = process.env.WHATSAPP_STAFF_NUMBER?.replace(/\D/g, "");
  after(async () => {
    const lang = input.lang ?? "en";
    if (confirm && input.phone) {
      const result = await sendTemplate({ to: input.phone, template: confirm, lang, bodyParams: [input.name, input.reference, input.service] });
      if (!result.ok) console.error("[whatsapp] customer copy failed:", result.error);
    }
    if (staffTemplate && staffNumber) {
      const result = await sendTemplate({ to: staffNumber, template: staffTemplate, lang: "en", bodyParams: [input.reference, input.service, `${input.name}${input.phone ? ` ${input.phone}` : ""}`, input.details.replace(/\s+/g, " ").slice(0, 900)] });
      if (!result.ok) console.error("[whatsapp] shop copy failed:", result.error);
    }
  });
}

/**
 * Last-resort alert for when the database itself couldn't be reached while saving a new request
 * (a dropped connection to the DB host, a restart, a network blip) — so a customer's submission
 * is never silently lost just because nothing could be written to the database at that moment.
 * Needs the same WHATSAPP_STAFF_TEMPLATE/WHATSAPP_STAFF_NUMBER as sendRequestWhatsApp; without
 * them this does nothing extra (the caller still shows the customer a friendly retry message).
 */
export function sendDbDownFallbackWhatsApp(input: { name: string; phone: string | null; email: string; service: string; details: string }) {
  const staffTemplate = process.env.WHATSAPP_STAFF_TEMPLATE?.trim();
  const staffNumber = process.env.WHATSAPP_STAFF_NUMBER?.replace(/\D/g, "");
  if (!cloudApiConfigured() || !staffTemplate || !staffNumber) return;
  after(async () => {
    const summary = `DATABASE WAS DOWN — not saved, please follow up manually. ${input.email}${input.phone ? ` · ${input.phone}` : ""}. ${input.details}`.replace(/\s+/g, " ").slice(0, 900);
    const result = await sendTemplate({ to: staffNumber, template: staffTemplate, lang: "en", bodyParams: ["DB-DOWN", input.service, input.name, summary] });
    if (!result.ok) console.error("[whatsapp] db-down fallback failed too:", result.error);
  });
}

/**
 * WhatsApp copy of a status change, to the customer. Needs the same Cloud API settings as
 * sendRequestWhatsApp, plus an approved WHATSAPP_STATUS_TEMPLATE (body {{1}} name, {{2}} reference,
 * {{3}} service, {{4}} new status) — a status change is business-initiated, so (unlike a reply to
 * an inbound "status" query) it must use an approved template, not a free-form sendText().
 * Without the template, the email-only status update still goes out as before.
 */
export function sendStatusWhatsApp(input: { name: string; phone: string | null; reference: string; service: string; status: string; lang?: "en" | "hi" | "bn" }) {
  if (!cloudApiConfigured() || !input.phone) return;
  const template = process.env.WHATSAPP_STATUS_TEMPLATE?.trim();
  if (!template) return;
  after(async () => {
    const result = await sendTemplate({ to: input.phone!, template, lang: input.lang ?? "en", bodyParams: [input.name, input.reference, input.service, input.status] });
    if (!result.ok) console.error("[whatsapp] status update failed:", result.error);
  });
}

/**
 * WhatsApp copy of the official application/certificate/policy number, once staff add it — kept
 * separate from sendStatusWhatsApp because it needs its own approved WHATSAPP_OFFICIAL_REF_TEMPLATE
 * (body {{1}} name, {{2}} our reference, {{3}} official reference label, {{4}} official reference).
 * Without the template, the official-reference email still goes out as before.
 */
export function sendOfficialReferenceWhatsApp(input: { name: string; phone: string | null; reference: string; officialReference: string; officialReferenceLabel: string; lang?: "en" | "hi" | "bn" }) {
  if (!cloudApiConfigured() || !input.phone) return;
  const template = process.env.WHATSAPP_OFFICIAL_REF_TEMPLATE?.trim();
  if (!template) return;
  after(async () => {
    const result = await sendTemplate({ to: input.phone!, template, lang: input.lang ?? "en", bodyParams: [input.name, input.reference, input.officialReferenceLabel, input.officialReference] });
    if (!result.ok) console.error("[whatsapp] official reference message failed:", result.error);
  });
}

/**
 * WhatsApp nudge to rate the finished request, sent once it's marked "completed". Needs its own
 * approved WHATSAPP_REVIEW_TEMPLATE (body {{1}} name, {{2}} reference, {{3}} service, {{4}} link
 * to /review/<reference>). Without the template, the review-request email still goes out as usual.
 */
export function sendReviewRequestWhatsApp(input: { name: string; phone: string | null; reference: string; service: string; reviewLink: string; lang?: "en" | "hi" | "bn" }) {
  if (!cloudApiConfigured() || !input.phone) return;
  const template = process.env.WHATSAPP_REVIEW_TEMPLATE?.trim();
  if (!template) return;
  after(async () => {
    const result = await sendTemplate({ to: input.phone!, template, lang: input.lang ?? "en", bodyParams: [input.name, input.reference, input.service, input.reviewLink] });
    if (!result.ok) console.error("[whatsapp] review request failed:", result.error);
  });
}
