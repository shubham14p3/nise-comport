import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { cleanUtr, convenienceFee, parseRupeesToPaise, upiLink, verifyCashfreeWebhook, verifyRazorpayPayment, verifyRazorpayWebhook } from "../src/lib/payments-core.ts";
import { qrMatrix, qrSvg } from "../src/lib/qr.ts";

test("fee rounds up and is zero for zero percent", () => {
  assert.equal(convenienceFee(10000, 2.4), 240);
  assert.equal(convenienceFee(9999, 2.4), 240);
  assert.equal(convenienceFee(10000, 0), 0);
});
test("rupee parsing", () => {
  assert.equal(parseRupeesToPaise("₹1,250.50"), 125050);
  assert.equal(parseRupeesToPaise("0"), null);
  assert.equal(parseRupeesToPaise("abc"), null);
});
test("upi link", () => {
  const link = upiLink({ vpa: "shop@okbank", name: "NISE COMPORT", amountPaise: 15050, note: "REQ 1" });
  assert.equal(link, "upi://pay?pa=shop%40okbank&pn=NISE%20COMPORT&am=150.50&cu=INR&tn=REQ%201");
});
test("utr", () => { assert.equal(cleanUtr(" 4012 3456 7890 "), "401234567890"); assert.equal(cleanUtr("12"), null); });
test("signatures", () => {
  const sig = createHmac("sha256", "s").update("o|p").digest("hex");
  assert.ok(verifyRazorpayPayment("o", "p", sig, "s")); assert.ok(!verifyRazorpayPayment("o", "x", sig, "s"));
  assert.ok(verifyRazorpayWebhook("{}", createHmac("sha256", "w").update("{}").digest("hex"), "w"));
  assert.ok(verifyCashfreeWebhook("{}", "1", createHmac("sha256", "c").update("1{}").digest("base64"), "c"));
  assert.ok(!verifyCashfreeWebhook("{}", "1", "bad", "c"));
});
test("qr renders", () => {
  const link = upiLink({ vpa: "shop@okbank", name: "NISE COMPORT", amountPaise: 15050, note: "REQ 1" });
  assert.ok(qrMatrix(link).length >= 21);
  assert.match(qrSvg(link), /^<svg/);
});
