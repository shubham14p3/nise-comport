import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";

const queue: (() => Promise<void>)[] = [];
const sent: { template: string; lang: string; bodyParams: string[] }[] = [];
const fixture = { after: (work: () => Promise<void>) => queue.push(work), send: async (message: typeof sent[number]) => { sent.push(message); return { ok: true, id: "test-id" }; } };
(globalThis as unknown as { __waTemplates: typeof fixture }).__waTemplates = fixture;
const compiled = await build({ entryPoints: ["src/lib/whatsapp-alerts.ts"], bundle: true, platform: "node", format: "esm", write: false,
  plugins: [{ name: "notification-boundaries", setup(builder) {
    builder.onResolve({ filter: /^(next\/server|@\/lib\/whatsapp)$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "next/server"
      ? "export const after=globalThis.__waTemplates.after;"
      : "export const cloudApiConfigured=()=>Boolean(process.env.WHATSAPP_TOKEN&&process.env.WHATSAPP_PHONE_NUMBER_ID);export const sendTemplate=globalThis.__waTemplates.send;" }));
  } }],
});
const api = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);
const keys = ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_STAFF_NUMBER", "WHATSAPP_TEMPLATE_LANG", ...["CONFIRM","STAFF","STATUS","OFFICIAL_REF","REVIEW","PAYMENT","CALLBACK"].map(key => `WHATSAPP_${key}_TEMPLATE`)];
const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
const customer = { name: "Customer", phone: "+919876543210", reference: "NC-12345", service: "PAN correction" };
function reset() { queue.length=0;sent.length=0;for(const key of keys)delete process.env[key];process.env.WHATSAPP_TOKEN="test-token";process.env.WHATSAPP_PHONE_NUMBER_ID="123"; }
async function flush() { while(queue.length) await queue.shift()!(); }

test("all notification templates receive the documented variable order and exact approved language", async () => {
  reset();process.env.WHATSAPP_TEMPLATE_LANG="en_US";process.env.WHATSAPP_STAFF_NUMBER="919999999999";
  for(const key of keys.filter(key=>key.endsWith("_TEMPLATE")))process.env[key]=key;
  api.sendRequestWhatsApp({...customer,details:"Contact\n requested"});
  api.sendStatusWhatsApp({...customer,status:"Reviewing"});
  api.sendOfficialReferenceWhatsApp({...customer,officialReferenceLabel:"Application",officialReference:"EXAMPLE123"});
  api.sendReviewRequestWhatsApp({...customer,reviewLink:"https://example.test/review"});
  assert.equal(api.sendPaymentRequestWhatsApp({...customer,amountPaise:15025}),true);
  api.sendCallbackWhatsApp({...customer});
  assert.equal(sent.length,0,"notifications run after the response");await flush();
  assert.deepEqual(sent.map(message=>message.bodyParams),[
    [customer.name,customer.reference,customer.service],
    [customer.reference,customer.service,`${customer.name} ${customer.phone}`,"Contact requested"],
    [customer.name,customer.reference,customer.service,"Reviewing"],
    [customer.name,customer.reference,"Application","EXAMPLE123"],
    [customer.name,customer.reference,customer.service,"https://example.test/review"],
    [customer.name,"150.25",customer.service,customer.reference],
    [customer.name,customer.service],
  ]);
  assert.ok(sent.every(message=>message.lang==="en_US"));
});

test("blank template names keep notifications disabled and permit existing payment-status fallback", async () => {
  reset();api.sendRequestWhatsApp({...customer,details:"Example"});api.sendStatusWhatsApp({...customer,status:"Reviewing"});
  api.sendCallbackWhatsApp(customer);assert.equal(api.sendPaymentRequestWhatsApp({...customer,amountPaise:15000}),false);
  await flush();assert.equal(sent.length,0);
  process.env.WHATSAPP_PAYMENT_TEMPLATE="nise_payment_request";
  assert.equal(api.sendPaymentRequestWhatsApp({...customer,phone:null,amountPaise:15000}),false);
  delete process.env.WHATSAPP_TOKEN;
  assert.equal(api.sendPaymentRequestWhatsApp({...customer,amountPaise:15000}),false);
  await flush();assert.equal(sent.length,0);
});

test.after(()=>{for(const key of keys){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}});
