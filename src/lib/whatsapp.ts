/**
 * WhatsApp Business Platform (Cloud API) for automatic campaign sending, and the webhook that
 * records STOP / YES replies and delivery receipts.
 *
 * Automatic sending is used only when these are set:
 *   WHATSAPP_TOKEN            permanent access token (System User) with whatsapp_business_messaging
 *   WHATSAPP_PHONE_NUMBER_ID  the sending number's ID from Meta
 *   WHATSAPP_APP_SECRET       to verify webhook calls (X-Hub-Signature-256)
 *   WHATSAPP_VERIFY_TOKEN     any long random string, also entered in Meta's webhook settings
 * Business-initiated messages must use a template approved by Meta (see README). Without the
 * settings, campaigns use the one-tap queue in the admin panel instead.
 *
 * Only imports Node built-ins so it can be unit-tested.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const API_VERSION = process.env.WHATSAPP_API_VERSION?.trim() || "v21.0";

export function cloudApiConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim());
}

/** Checks Meta's X-Hub-Signature-256 header against the raw request body. */
export function verifyMetaSignature(rawBody: string, header: string | null, secret: string | undefined) {
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export type InboundEvent =
  | { type: "message"; from: string; text: string; name?: string }
  | { type: "status"; id: string; status: string; error?: string };

/** Pulls replies and delivery statuses out of a webhook payload. */
export function parseWebhook(payload: unknown): InboundEvent[] {
  const events: InboundEvent[] = [];
  const entries = (payload as { entry?: unknown[] })?.entry;
  if (!Array.isArray(entries)) return events;
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      const value = (change as { value?: Record<string, unknown> })?.value ?? {};
      const names = new Map<string, string>();
      for (const contact of (value.contacts as { wa_id?: string; profile?: { name?: string } }[] | undefined) ?? []) {
        if (contact.wa_id && contact.profile?.name) names.set(contact.wa_id, contact.profile.name);
      }
      for (const message of (value.messages as Record<string, unknown>[] | undefined) ?? []) {
        const from = typeof message.from === "string" ? message.from : "";
        const text = (message.text as { body?: string } | undefined)?.body
          ?? (message.button as { text?: string; payload?: string } | undefined)?.payload
          ?? (message.button as { text?: string } | undefined)?.text
          ?? (message.interactive as { button_reply?: { title?: string } } | undefined)?.button_reply?.title
          ?? "";
        if (from) events.push({ type: "message", from: `+${from.replace(/\D/g, "")}`, text: String(text), ...(names.get(from) ? { name: names.get(from) } : {}) });
      }
      for (const status of (value.statuses as Record<string, unknown>[] | undefined) ?? []) {
        const errors = status.errors as { title?: string; message?: string }[] | undefined;
        if (typeof status.id === "string" && typeof status.status === "string") {
          events.push({ type: "status", id: status.id, status: status.status, ...(errors?.[0] ? { error: errors[0].message ?? errors[0].title } : {}) });
        }
      }
    }
  }
  return events;
}

export type TemplateMessage = { to: string; template: string; lang: "en" | "hi" | "bn"; bodyParams: string[]; imageUrl?: string | null };

/** The JSON body for a template message (header image optional). */
export function templatePayload(message: TemplateMessage) {
  const components: Record<string, unknown>[] = [];
  if (message.imageUrl) components.push({ type: "header", parameters: [{ type: "image", image: { link: message.imageUrl } }] });
  if (message.bodyParams.length) components.push({ type: "body", parameters: message.bodyParams.map((text) => ({ type: "text", text: text.slice(0, 1000) })) });
  return {
    messaging_product: "whatsapp",
    to: message.to.replace(/\D/g, ""),
    type: "template",
    template: { name: message.template, language: { code: message.lang }, components },
  };
}

/** Sends one template message through the Cloud API. Never throws; returns the outcome. */
export async function sendTemplate(message: TemplateMessage, fetchImpl: typeof fetch = fetch): Promise<{ ok: true; id: string } | { ok: false; error: string; retry: boolean }> {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneId) return { ok: false, error: "WhatsApp Cloud API is not configured.", retry: false };
  try {
    const response = await fetchImpl(`https://graph.facebook.com/${API_VERSION}/${encodeURIComponent(phoneId)}/messages`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(templatePayload(message)),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await response.json().catch(() => ({})) as { messages?: { id?: string }[]; error?: { message?: string; code?: number } };
    if (response.ok && data.messages?.[0]?.id) return { ok: true, id: data.messages[0].id };
    const error = data.error?.message ?? `WhatsApp API error ${response.status}`;
    return { ok: false, error: error.slice(0, 300), retry: response.status >= 500 || response.status === 429 };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message.slice(0, 300) : "Network error", retry: true };
  }
}
