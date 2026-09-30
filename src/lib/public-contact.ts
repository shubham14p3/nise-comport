/**
 * Contact numbers that browser code needs. `process.env.NEXT_PUBLIC_*` must be referenced
 * literally so Next.js can inline the value into client bundles (src/lib/site.ts reads env
 * vars dynamically, which only works on the server).
 */
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_PRIMARY ?? "919771219893").replace(/\D/g, "") || "919771219893";
export const PHONE_E164 = "+919771219893";

export function whatsappHref(text: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
