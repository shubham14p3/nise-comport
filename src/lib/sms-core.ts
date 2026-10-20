/** Which providers/channels are switched on, from environment variables only (no imports, easy to test). */
export type SmsProvider = "msg91" | "fast2sms";
export type OtpChannel = "sms" | "whatsapp";

export function env(name: string) { const value = process.env[name]?.trim(); return value ? value : undefined; }

export function smsConfigured(): SmsProvider | null {
  const wanted = env("SMS_PROVIDER")?.toLowerCase();
  const msg91 = Boolean(env("MSG91_AUTH_KEY") && env("MSG91_TEMPLATE_ID"));
  const fast = Boolean(env("FAST2SMS_API_KEY"));
  if (wanted === "msg91") return msg91 ? "msg91" : null;
  if (wanted === "fast2sms") return fast ? "fast2sms" : null;
  return msg91 ? "msg91" : fast ? "fast2sms" : null;
}

/** Which channels are switched on, in the order they will be tried. */
export function otpChannels(): OtpChannel[] {
  const wanted = (env("OTP_CHANNEL") ?? "sms").toLowerCase().split(/[\s,]+/).filter((item) => item === "sms" || item === "whatsapp") as OtpChannel[];
  return [...new Set(wanted)].filter((channel) => channel === "sms" ? smsConfigured() !== null : whatsappConfigured() !== null);
}

export function whatsappConfigured(): SmsProvider | null {
  const wanted = env("SMS_PROVIDER")?.toLowerCase();
  const msg91 = Boolean(env("MSG91_AUTH_KEY") && env("MSG91_WHATSAPP_NUMBER") && env("MSG91_WHATSAPP_TEMPLATE"));
  const fast = Boolean(env("FAST2SMS_API_KEY") && env("FAST2SMS_WHATSAPP_MESSAGE_ID"));
  if (wanted === "msg91") return msg91 ? "msg91" : null;
  if (wanted === "fast2sms") return fast ? "fast2sms" : null;
  return msg91 ? "msg91" : fast ? "fast2sms" : null;
}

