import assert from "node:assert/strict";
import test from "node:test";
import { orderChannels, otpChannels, whatsappConfigured } from "../src/lib/sms-core.ts";

const KEYS = ["SMS_PROVIDER","OTP_CHANNEL","MSG91_AUTH_KEY","MSG91_TEMPLATE_ID","MSG91_WHATSAPP_NUMBER","MSG91_WHATSAPP_TEMPLATE","FAST2SMS_API_KEY","FAST2SMS_WHATSAPP_MESSAGE_ID","WHATSAPP_PROVIDER","META_WA_TOKEN","META_WA_PHONE_ID","META_WA_TEMPLATE"];
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
test("Meta is picked when its keys are set, and the customer choice goes first", () => withEnv({ WHATSAPP_PROVIDER: "meta", META_WA_TOKEN: "t", META_WA_PHONE_ID: "1", META_WA_TEMPLATE: "otp", OTP_CHANNEL: "sms,whatsapp", FAST2SMS_API_KEY: "k" }, () => {
  assert.equal(whatsappConfigured(), "meta");
  assert.deepEqual(orderChannels(), ["sms", "whatsapp"]);
  assert.deepEqual(orderChannels("whatsapp"), ["whatsapp", "sms"]);
  assert.deepEqual(orderChannels("nonsense"), ["sms", "whatsapp"]);
}));
