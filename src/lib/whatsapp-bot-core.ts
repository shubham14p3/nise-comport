/**
 * The WhatsApp assistant's brain: reads a customer message and decides what it is about, then
 * writes the reply. No database or network here, so it is easy to test. whatsapp-bot.ts supplies
 * the data (prices, payments) and sends the reply.
 */

export type BotIntent = "menu" | "price" | "documents" | "track" | "pay" | "hours" | "human" | "attachment" | "unknown";
export type BotService = { slug: string; title: string; keywords: string[]; documents: string[] };

const has = (text: string, pattern: RegExp) => pattern.test(text);

export function detectIntent(raw: string): BotIntent {
  const text = raw.trim().toLowerCase();
  if (!text) return "attachment";
  if (/^[1-6]$/.test(text)) return (["menu", "price", "track", "pay", "documents", "hours", "human"] as const)[Number(text)] ?? "menu";
  if (has(text, /\bscanned\b.*\bqr\b|\bqr\b.*\bscanned\b/)) return "menu"; // arrived from our welcome QR code
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
  "Hello! This is NISE COMPORT (CSC / Pragya Kendra, Kharangajhar, Telco). How can we help?",
  "",
  "1 – Service charges (send e.g. “PAN card price”)",
  "2 – Track my request",
  "3 – Pay for my request",
  "4 – Documents needed (send e.g. “documents for voter ID”)",
  "5 – Address and timings",
  "6 – Talk to our team",
  "",
  "Reply with a number or just type your question.",
].join("\n");

export function priceReply(service: BotService, price: { amount: number; kind: string; note: string | null } | null, siteUrl: string) {
  if (price) return `${service.title}: our service charge is ${price.kind === "from" ? "from " : ""}₹${price.amount}${price.note ? ` (${price.note})` : ""}. Government or courier fees, if any, are extra and told to you first.\n\nStart online: ${siteUrl}/services/${service.slug}`;
  return `${service.title}: we quote this after checking your case. Our team will message you here shortly with the charge. You can also start a request: ${siteUrl}/services/${service.slug}`;
}

export function documentsReply(service: BotService, siteUrl: string) {
  const list = service.documents.slice(0, 10).map((item) => `• ${item}`).join("\n");
  return `Documents for ${service.title}:\n${list || "• We will tell you the exact list once we see your case."}\n\nPlease do not send documents on WhatsApp. Upload them safely in your request: ${siteUrl}/services/${service.slug}`;
}

export function payReply(payment: { reference: string; amountPaise: number; status: string } | null, siteUrl: string) {
  if (!payment) return "We don't see a pending payment on this number. Payments are requested only after we check your documents. If you were told to pay, reply 6 and our team will help.";
  const amount = `₹${payment.amountPaise / 100}`;
  if (payment.status === "verifying") return `We have your UPI payment for ${payment.reference} and are verifying it. This can take a few hours in working time.`;
  return `Please pay ${amount} for ${payment.reference} here (sign in first): ${siteUrl}/pay/${payment.reference}\nUPI QR is free; instant card or net banking adds a small fee shown before you pay.`;
}

export function hoursReply(address: string, hours: string, mapsUrl: string) {
  return `${address}\n${hours}\nDirections: ${mapsUrl}`;
}

export const HUMAN_REPLY = "Thanks. Our team has been alerted and will reply here as soon as they can during working hours. For something urgent, please call us.";
export const ATTACHMENT_REPLY = "For your safety please don't send documents or photos on WhatsApp. Upload them securely inside your request on our website, or bring them to the centre. Reply “menu” for options.";
export const UNKNOWN_REPLY = "Sorry, I didn't catch that. Our team will look at your message too.\n\nReply 1–6, or “menu”:\n1 Charges · 2 Track · 3 Pay · 4 Documents · 5 Address · 6 Talk to us";
