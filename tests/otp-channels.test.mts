import assert from "node:assert/strict";
import test from "node:test";
import { otpChannels, whatsappConfigured } from "../src/lib/sms-core.ts";

const KEYS = ["SMS_PROVIDER","OTP_CHANNEL","MSG91_AUTH_KEY","MSG91_TEMPLATE_ID","MSG91_WHATSAPP_NUMBER","MSG91_WHATSAPP_TEMPLATE","FAST2SMS_API_KEY","FAST2SMS_WHATSAPP_MESSAGE_ID"];
function withEnv(values: Record<string, string>, run: () => void) {
  const saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));
  for (const key of KEYS) delete process.env[key];
  Object.assign(process.env, values);
  try { run(); } finally { for (const key of KEYS) { if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key]; } }
}

test("nothing configured: no channels", () => withEnv({}, () => assert.deepEqual(otpChannels(), [])));
test("default channel is SMS only", () => withEnv({ FAST2SMS_API_KEY: "k", FAST2SMS_WHATSAPP_MESSAGE_ID: "1" }, () => assert.deepEqual(otpChannels(), ["sms"])));
test("whatsapp,sms keeps order and drops channels without keys", () => {
  withEnv({ OTP_CHANNEL: "whatsapp,sms", MSG91_AUTH_KEY: "k", MSG91_WHATSAPP_NUMBER: "9199", MSG91_WHATSAPP_TEMPLATE: "otp", MSG91_TEMPLATE_ID: "t" }, () => assert.deepEqual(otpChannels(), ["whatsapp", "sms"]));
  withEnv({ OTP_CHANNEL: "whatsapp,sms", MSG91_AUTH_KEY: "k", MSG91_WHATSAPP_NUMBER: "9199", MSG91_WHATSAPP_TEMPLATE: "otp" }, () => assert.deepEqual(otpChannels(), ["whatsapp"]));
});
test("SMS_PROVIDER picks the WhatsApp provider", () => withEnv({ SMS_PROVIDER: "fast2sms", MSG91_AUTH_KEY: "k", MSG91_WHATSAPP_NUMBER: "1", MSG91_WHATSAPP_TEMPLATE: "t", FAST2SMS_API_KEY: "k", FAST2SMS_WHATSAPP_MESSAGE_ID: "5" }, () => assert.equal(whatsappConfigured(), "fast2sms")));
