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
