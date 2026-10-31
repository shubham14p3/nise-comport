import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";

const integration = { token: "test-token", phoneId: "123456", template: "nise_login_otp", language: "en" };
const compiled = await build({ entryPoints: ["src/lib/sms.ts"], bundle: true, platform: "node", format: "esm", write: false,
  plugins: [{ name: "saved-provider-fixture", setup(builder) {
    builder.onResolve({ filter: /^@\/lib\/integration-vault$/ }, () => ({ path: "integration", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: `export async function getIntegration(){return ${JSON.stringify(integration)}}` }));
  } }],
});
const { sendOtpSms } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);
const keys = ["NODE_ENV", "OTP_CHANNEL", "OTP_SECRET", "SMS_PROVIDER", "FAST2SMS_API_KEY", "MSG91_AUTH_KEY", "MSG91_TEMPLATE_ID", "META_WA_TOKEN", "META_WA_PHONE_ID", "META_WA_TEMPLATE"];
const saved = Object.fromEntries(keys.map(k => [k, process.env[k]]));
const realFetch = globalThis.fetch;
const realError = console.error;
function configure(sms = true) {
  for (const key of keys) delete process.env[key];
  process.env.NODE_ENV = "production"; process.env.OTP_SECRET = "x".repeat(32); process.env.OTP_CHANNEL = "whatsapp,sms";
  if (sms) { process.env.SMS_PROVIDER = "fast2sms"; process.env.FAST2SMS_API_KEY = "test-sms-key"; }
  console.error = () => {};
}
test("saved WhatsApp OTP uses authentication body/button and stops after acceptance", async () => {
  configure(); let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++; assert.match(String(url), /123456\/messages$/);
    const payload = JSON.parse(String(options?.body));
    assert.equal(payload.to, "919876543210"); assert.equal(payload.template.name, "nise_login_otp");
    assert.equal(payload.template.components[0].parameters[0].text, "123456");
    assert.equal(payload.template.components[1].parameters[0].text, "123456");
    return Response.json({ messages: [{ id: "accepted-id" }] });
  };
  assert.equal(await sendOtpSms("+919876543210", "123456", "whatsapp"), "whatsapp"); assert.equal(calls, 1);
});
test("saved WhatsApp rejection or network failure falls back to configured SMS", async () => {
  for (const failure of ["rejected", "network"]) {
    configure(); const calls: string[] = [];
    globalThis.fetch = async (url) => {
      calls.push(String(url));
      if (String(url).includes("graph.facebook.com")) {
        if (failure === "network") throw new Error("network unavailable");
        return Response.json({ error: { message: "Invalid token" } }, { status: 401 });
      }
      return Response.json({ return: true });
    };
    assert.equal(await sendOtpSms("+919876543210", "123456", "whatsapp"), "sms");
    assert.equal(calls.length, 2); assert.match(calls[1], /fast2sms/);
  }
});
test("failed saved WhatsApp with no fallback fails rather than reporting development success", async () => {
  configure(false); process.env.NODE_ENV = "development";
  globalThis.fetch = async () => Response.json({}, { status: 400 });
  await assert.rejects(sendOtpSms("+919876543210", "123456", "whatsapp"));
});
test.after(() => {
  globalThis.fetch = realFetch; console.error = realError;
  for (const key of keys) { if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key]; }
});
