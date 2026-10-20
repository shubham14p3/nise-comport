/**
 * Sends one-time codes by SMS through an Indian provider. Choose with SMS_PROVIDER=msg91 or fast2sms
 * (if it is empty, whichever provider has its keys set is used). See docs/sms-setup.md.
 *
 *   MSG91:    MSG91_AUTH_KEY, MSG91_TEMPLATE_ID
 *   Fast2SMS: FAST2SMS_API_KEY and either nothing more (their OTP route) or FAST2SMS_SENDER_ID + FAST2SMS_TEMPLATE_ID (DLT route)
 *
 * WhatsApp codes (same two providers). OTP_CHANNEL="whatsapp,sms" tries WhatsApp first and falls back to SMS; default "sms".
 *   MSG91:    MSG91_AUTH_KEY, MSG91_WHATSAPP_NUMBER, MSG91_WHATSAPP_TEMPLATE (+ MSG91_WHATSAPP_NAMESPACE, MSG91_WHATSAPP_LANG)
 *   Fast2SMS: FAST2SMS_API_KEY, FAST2SMS_WHATSAPP_MESSAGE_ID
 */
import { PublicError } from "@/lib/errors";
import { env, otpChannels, smsConfigured, whatsappConfigured } from "@/lib/sms-core";

export { otpChannels, smsConfigured, whatsappConfigured };
export type { OtpChannel, SmsProvider } from "@/lib/sms-core";


/** "+919876543210" → "9876543210". Indian mobile numbers only. */
export function indianMobile(e164: string) {
  const match = /^\+91([6-9]\d{9})$/.exec(e164);
  return match ? match[1] : null;
}

async function post(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try { return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" }); }
  finally { clearTimeout(timer); }
}

async function viaMsg91(mobile: string, code: string) {
  const url = new URL("https://control.msg91.com/api/v5/otp");
  url.searchParams.set("template_id", env("MSG91_TEMPLATE_ID")!);
  url.searchParams.set("mobile", `91${mobile}`);
  url.searchParams.set("otp", code);
  const expiry = env("MSG91_OTP_EXPIRY_MINUTES"); if (expiry) url.searchParams.set("otp_expiry", expiry);
  const response = await post(url.toString(), { method: "POST", headers: { authkey: env("MSG91_AUTH_KEY")!, "content-type": "application/json", accept: "application/json" }, body: "{}" });
  const body = await response.json().catch(() => ({})) as { type?: string; message?: string };
  if (!response.ok || body.type !== "success") throw new Error(`MSG91: ${body.message ?? response.status}`);
}

async function viaFast2sms(mobile: string, code: string) {
  const sender = env("FAST2SMS_SENDER_ID"); const template = env("FAST2SMS_TEMPLATE_ID");
  const payload = sender && template
    ? { route: "dlt", sender_id: sender, message: template, variables_values: code, numbers: mobile, flash: 0 }
    : { route: "otp", variables_values: code, numbers: mobile, flash: 0 };
  const response = await post("https://www.fast2sms.com/dev/bulkV2", { method: "POST", headers: { authorization: env("FAST2SMS_API_KEY")!, "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) });
  const body = await response.json().catch(() => ({})) as { return?: boolean; message?: unknown };
  if (!response.ok || body.return !== true) throw new Error(`Fast2SMS: ${Array.isArray(body.message) ? body.message.join(" ") : String(body.message ?? response.status)}`);
}

/** MSG91 WhatsApp template: body variable 1 = the code; a copy-code/URL button gets the code too. */
async function whatsappViaMsg91(mobile: string, code: string) {
  const components: Record<string, unknown> = { body_1: { type: "text", value: code } };
  if (env("MSG91_WHATSAPP_BUTTON") !== "off") components.button_1 = { subtype: "url", type: "text", value: code };
  const payload = {
    integrated_number: env("MSG91_WHATSAPP_NUMBER"), content_type: "template",
    payload: { messaging_product: "whatsapp", type: "template", template: {
      name: env("MSG91_WHATSAPP_TEMPLATE"), language: { code: env("MSG91_WHATSAPP_LANG") ?? "en", policy: "deterministic" },
      ...(env("MSG91_WHATSAPP_NAMESPACE") ? { namespace: env("MSG91_WHATSAPP_NAMESPACE") } : {}),
      to_and_components: [{ to: [`91${mobile}`], components }],
    } },
  };
  const response = await post("https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/", { method: "POST", headers: { authkey: env("MSG91_AUTH_KEY")!, "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) });
  const body = await response.json().catch(() => ({})) as { status?: string; hasError?: boolean; errors?: unknown };
  if (!response.ok || body.hasError || (body.status && body.status !== "success")) throw new Error(`MSG91 WhatsApp: ${JSON.stringify(body.errors ?? body.status ?? response.status)}`);
}

async function whatsappViaFast2sms(mobile: string, code: string) {
  const url = new URL("https://www.fast2sms.com/dev/whatsapp");
  url.searchParams.set("message_id", env("FAST2SMS_WHATSAPP_MESSAGE_ID")!);
  url.searchParams.set("numbers", mobile);
  url.searchParams.set("variables_values", code);
  const response = await post(url.toString(), { method: "GET", headers: { authorization: env("FAST2SMS_API_KEY")!, accept: "application/json" } });
  const body = await response.json().catch(() => ({})) as { return?: boolean; message?: unknown };
  if (!response.ok || body.return !== true) throw new Error(`Fast2SMS WhatsApp: ${Array.isArray(body.message) ? body.message.join(" ") : String(body.message ?? response.status)}`);
}

/** Sends the code. In local development with no provider set, the code is printed to the console instead. */
export async function sendOtpSms(e164: string, code: string) {
  const mobile = indianMobile(e164);
  if (!mobile) throw new PublicError("SMS codes can be sent to Indian mobile numbers only.", 400, { fields: { phone: "Enter an Indian mobile number, e.g. 98765 43210." } });
  const channels = otpChannels();
  if (!channels.length) {
    if (process.env.NODE_ENV !== "production") { console.warn(`[sms] DEV ONLY: no SMS/WhatsApp provider set. Code for ${e164} is ${code}`); return; }
    throw new PublicError("SMS codes are not switched on yet. Please use your email.", 503, { code: "sms_not_configured" });
  }
  for (const channel of channels) {
    try {
      if (channel === "whatsapp") await (whatsappConfigured() === "msg91" ? whatsappViaMsg91(mobile, code) : whatsappViaFast2sms(mobile, code));
      else await (smsConfigured() === "msg91" ? viaMsg91(mobile, code) : viaFast2sms(mobile, code));
      return;
    } catch (error) { console.error(`[otp] ${channel} send failed`, error instanceof Error ? error.message : error); }
  }
  throw new PublicError("We couldn’t send the code right now. Please try again in a few minutes, or use your email.", 503, { code: "sms_failed" });
}
