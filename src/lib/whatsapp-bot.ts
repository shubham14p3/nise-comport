import { and, desc, eq, inArray, or } from "drizzle-orm";
import { payments, users, whatsappMessages } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { handleStatusQuery } from "@/lib/campaigns";
import { db } from "@/lib/db";
import { summarizeHours } from "@/lib/hours";
import { hitRate, identity } from "@/lib/rate-limit";
import { publicPrices } from "@/lib/service-prices";
import { publishedServiceDetails } from "@/lib/services";
import { qrWelcomeMessages, site } from "@/lib/site";
import { normalizePhone } from "@/lib/validation";
import { whatsappFaqReply, shopWhatsAppLink } from "@/lib/whatsapp-faq";
import { sendText } from "@/lib/whatsapp";
import {
  ATTACHMENT_REPLY, detectIntent, documentsReply, HUMAN_REPLY, hoursReply, matchService, MENU, payReply, priceReply, UNKNOWN_REPLY, type BotIntent,
} from "@/lib/whatsapp-bot-core";

async function log(entry: { phone: string; direction: "in" | "out"; body: string; sender: "customer" | "bot" | "staff"; name?: string | null; userId?: string | null; needsHuman?: boolean }) {
  try {
    await db.insert(whatsappMessages).values({ phone: entry.phone, direction: entry.direction, body: entry.body.slice(0, 4000), sender: entry.sender, name: entry.name?.slice(0, 100) || null, userId: entry.userId ?? null, needsHuman: entry.needsHuman ?? false });
  } catch (error) { console.error("[whatsapp-bot] could not save message (run npm run db:migrate)", error); }
}

/** Log an already-handled inbound status/consent message without triggering another bot reply. */
export async function logInboundOnly(phone: string, text: string, name?: string) {
  await log({ phone, direction: "in", body: text || "(empty message)", sender: "customer", name });
}

/** Sends a reply and keeps a copy in the chat log. */
export async function replyAndLog(phone: string, body: string, sender: "bot" | "staff", userId?: string | null) {
  const result = await sendText(phone, body);
  await log({ phone, direction: "out", body: result.ok ? body : `[not delivered: ${result.error}] ${body}`, sender, userId });
  return result;
}

/**
 * Answers a customer's WhatsApp message: menu, service charges, documents, payment link, status,
 * address, or hands over to the team. Never reveals more than a phone number alone should:
 * status needs the number on a customer account, and payment links still require signing in.
 */
export async function handleBotMessage(event: { from: string; text: string; name?: string }) {
  const phone = normalizePhone(event.from);
  if (!phone) return;
  const limit = await hitRate({ name: "wa-bot", limit: 40, windowSeconds: 3600 }, identity("wa", phone)).catch(() => ({ allowed: true }));
  if (!limit.allowed) return;
  const [account] = await db.select({ id: users.id }).from(users).where(or(eq(users.phone, phone), eq(users.whatsapp, phone))).limit(1);
  const userId = account?.id ?? null;
  const text = event.text.slice(0, 500);
  let intent: BotIntent = detectIntent(text);
  const fromWelcomeQr = /\bscanned\b.*\bqr\b|\bqr\b.*\bscanned\b/i.test(text);
  let service = null as ReturnType<typeof matchService>;
  const catalogue = publishedServiceDetails.map((item) => ({ slug: item.slug, title: item.title, keywords: item.keywords, documents: item.documents }));
  if (intent === "unknown") { service = matchService(text, catalogue); if (service) intent = "price"; }

  let needsHuman = intent === "human" || intent === "unknown" || intent === "attachment";
  await log({ phone, direction: "in", body: text || "(attachment or empty message)", sender: "customer", name: event.name, userId, needsHuman });

  if (fromWelcomeQr && intent === "menu") {
    for (const brochure of qrWelcomeMessages()) await replyAndLog(phone, brochure, "bot", userId);
    return;
  }

  if (intent === "track") {
    await handleStatusQuery(phone, /^\s*(status|track)/i.test(text) ? text : `status ${text}`);
    // handleStatusQuery already logs the real outgoing text.
    return;
  }

  let reply: string;
  switch (intent) {
    case "menu": reply = MENU; break;
    case "faq": reply = whatsappFaqReply(text, site.url) ?? UNKNOWN_REPLY; break;
    case "price": {
      service = service ?? matchService(text, catalogue);
      if (!service) { reply = "Which service? For example “PAN card price”, “voter ID charge” or “bike insurance fee”."; break; }
      const price = (await publicPrices().catch(() => [])).find((item) => item.slug === service!.slug) ?? null;
      reply = priceReply(service, price && price.amount ? { amount: price.amount, kind: price.kind, note: price.note } : null, site.url);
      if (!price) needsHuman = true;
      break;
    }
    case "documents": {
      service = matchService(text, catalogue);
      reply = service ? documentsReply(service, site.url) : "Which service? For example “documents for PAN card” or “documents for income certificate”.";
      break;
    }
    case "pay": {
      const [open] = userId ? await db.select().from(payments).where(and(eq(payments.userId, userId), inArray(payments.status, ["due", "failed", "verifying"]))).orderBy(desc(payments.createdAt)).limit(1) : [];
      reply = payReply(open ? { reference: open.reference, amountPaise: open.amountPaise, status: open.status } : null, site.url);
      break;
    }
    case "hours": reply = hoursReply(site.address.oneLine, summarizeHours(site.openingHours).join(" · ") || "Mon–Sat · call before visiting for today’s timings", site.mapsUrl); break;
    case "human": reply = HUMAN_REPLY; break;
    case "attachment": reply = ATTACHMENT_REPLY; break;
    default: reply = UNKNOWN_REPLY;
  }
  if (intent === "human" || intent === "unknown") reply += `\n\n📱 दुकान के WhatsApp पर बात करें (प्रश्न भर जाएगा; Send आप दबाएँ):\n${shopWhatsAppLink(site.whatsapp.primary, text)}`;
  if (needsHuman && intent !== "attachment") await logActivity({ kind: "lead", permission: "requests", title: "WhatsApp message needs a reply", detail: `${event.name ?? phone}: ${text.slice(0, 120)}`, refType: "whatsapp", refId: phone });
  await replyAndLog(phone, reply, "bot", userId);
}
