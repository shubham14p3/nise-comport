/**
 * The WhatsApp assistant's brain: reads a customer message and decides what it is about, then
 * writes the reply. No database or network here, so it is easy to test. whatsapp-bot.ts supplies
 * the data (prices, payments) and sends the reply.
 */

import { whatsappFaqReply } from "./whatsapp-faq.ts";

export type BotIntent = "faq" | "menu" | "price" | "documents" | "track" | "pay" | "hours" | "human" | "attachment" | "unknown";
export type BotService = { slug: string; title: string; keywords: string[]; documents: string[] };

const has = (text: string, pattern: RegExp) => pattern.test(text);

export function detectIntent(raw: string): BotIntent {
  const text = raw.trim().toLowerCase();
  if (!text) return "attachment";
  if (/\bncj-\d{2}-[0-9a-f]{12}\b/i.test(text)) return "track";
  if (/^[1-6]$/.test(text)) return (["menu", "price", "track", "pay", "documents", "hours", "human"] as const)[Number(text)] ?? "menu";
  if (has(text, /\bscanned\b.*\bqr\b|\bqr\b.*\bscanned\b/)) return "menu"; // arrived from our welcome QR code
  if (whatsappFaqReply(raw, "")) return "faq";
  if (has(text, /\b(agent|human|staff|person|call me|talk to|baat|complaint|problem|issue|refund)\b/)) return "human";
  if (has(text, /\b(status|track|stat)\b/)) return "track";
  if (has(text, /\b(pay|payment|paid|upi|qr|bhugtan|paise)\b/)) return "pay";
  if (has(text, /\b(document|documents|docs|kaagaz|kagaz|required|chahiye|checklist)\b/)) return "documents";
  if (has(text, /\b(price|prices|charge|charges|fee|fees|rate|rates|cost|kitna|kitne|कीमत|शुल्क)\b/)) return "price";
  if (has(text, /\b(address|location|where|timing|timings|hours|open|close|kahan|directions?)\b/)) return "hours";
  if (has(text, /^(hi+|hello+|hey|namaste|namaskar|menu|help|start|hlo|नमस्ते)\b/)) return "menu";
  return "unknown";
}

/** Best service for the words in a message, or null when nothing matches well enough. */
export function matchService(raw: string, services: BotService[]): BotService | null {
  const words = raw.toLowerCase().replace(/[^a-z0-9ऀ-ॿ\s]/g, " ").split(/\s+/).filter((word) => word.length > 2);
  let best: { service: BotService; score: number } | null = null;
  for (const service of services) {
    const haystack = ` ${service.title.toLowerCase()} ${service.keywords.join(" ").toLowerCase()} ${service.slug.replaceAll("-", " ")} `;
    let score = 0;
    for (const word of words) if (haystack.includes(` ${word}`) || haystack.includes(word)) score += word.length > 4 ? 2 : 1;
    if (service.title.toLowerCase().split(/\s+/).some((part) => part.length > 3 && raw.toLowerCase().includes(part))) score += 2;
    if (score > (best?.score ?? 1)) best = { service, score };
  }
  return best?.service ?? null;
}

export const MENU = [
  "🙏 *नमस्ते! NiSE COMPORT में आपका स्वागत है*",
  "*CSC / प्रज्ञा केंद्र · Kharangajhar, Telco*",
  "आपके विश्वास और सहयोग के लिए धन्यवाद ❤️",
  "", "बताइए, किस काम में सहायता चाहिए? / How can we help?", "",
  "1️⃣ सेवा शुल्क / Charges — जैसे: PAN card price",
  "2️⃣ आवेदन की स्थिति / Track request",
  "3️⃣ अपने आवेदन का भुगतान / Payment",
  "4️⃣ जरूरी दस्तावेज़ / Documents — जैसे: documents for PAN card",
  "5️⃣ पता और समय / Address & timings",
  "6️⃣ हमारी टीम से बात / Talk to staff",
  "", "1–6 भेजें या अपना प्रश्न लिखें।",
  "📎 Documents के लिए अपने website application का upload विकल्प उपयोग करें।",
].join("\n");

export function priceReply(service: BotService, price: { amount: number; kind: string; note: string | null } | null, siteUrl: string) {
  if (price) return `${service.title}: our service charge is ${price.kind === "from" ? "from " : ""}₹${price.amount}${price.note ? ` (${price.note})` : ""}. Government or courier fees, if any, are extra and told to you first.\n\nStart online: ${siteUrl}/services/${service.slug}`;
  return `${service.title}: we quote this after checking your case. Please ask our team to confirm the charge; a response time is not guaranteed. You can also start a request: ${siteUrl}/services/${service.slug}`;
}

export function documentsReply(service: BotService, siteUrl: string) {
  const list = service.documents.slice(0, 10).map((item) => `• ${item}`).join("\n");
  return `Documents for ${service.title}:\n${list || "• We will tell you the exact list once we see your case."}\n\nPlease do not send documents on WhatsApp. Upload them safely in your request: ${siteUrl}/services/${service.slug}`;
}

export function payReply(payment: { reference: string; amountPaise: number; status: string } | null, siteUrl: string) {
  if (!payment) return "We don't see a pending payment on this number. Payments are requested only after we check your documents. If you were told to pay, reply 6 and our team will help.";
  const amount = `₹${payment.amountPaise / 100}`;
  if (payment.status === "verifying") return `Your payment details for ${payment.reference} are awaiting verification. This is not confirmation that payment was received.`;
  return `Please pay ${amount} for ${payment.reference} here (sign in first): ${siteUrl}/pay/${payment.reference}\nUPI QR is free; instant card or net banking adds a small fee shown before you pay.`;
}

export function hoursReply(address: string, hours: string, mapsUrl: string) {
  return `${address}\n${hours}\nDirections: ${mapsUrl}`;
}

export const HUMAN_REPLY = "🙏 आपकी बात टीम के website inbox में चिह्नित कर दी गई है। / Your message is flagged for staff review. जवाब काम के समय उपलब्धता के अनुसार मिलेगा। Urgent सहायता के लिए दुकान पर कॉल करें।";
export const ATTACHMENT_REPLY = "📎 आपने एक attachment/non-text message भेजा है। यह फ़ाइल अभी website inbox में save या preview नहीं होती। अपने service request के upload विकल्प का उपयोग करें। मदद के लिए 6 या document upload लिखें।";
export const UNKNOWN_REPLY = "Sorry, I didn't catch that. Our team will look at your message too.\n\nReply 1–6, or “menu”:\n1 Charges · 2 Track · 3 Pay · 4 Documents · 5 Address · 6 Talk to us";
