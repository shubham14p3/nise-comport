/**
 * Contact numbers that browser code needs. `process.env.NEXT_PUBLIC_*` must be referenced
 * literally so Next.js can inline the value into client bundles (src/lib/site.ts reads env
 * vars dynamically, which only works on the server).
 */
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_PRIMARY ?? "919771219893").replace(/\D/g, "") || "919771219893";
export const PHONE_E164 = "+919771219893";

/** First line of every WhatsApp message we start, so the customer sees whose chat it is. */
export const WHATSAPP_BRAND_LINE = "*NiSE COMPORT* · Kharangajhar, Telco, Jamshedpur";

/** Adds the brand line once, unless the message already has it. */
export function brandedWhatsAppText(text: string) {
  return text.startsWith(WHATSAPP_BRAND_LINE) ? text : `${WHATSAPP_BRAND_LINE}\n${text}`;
}

export function whatsappHref(text: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(brandedWhatsAppText(text))}`;
}
