import { createHmac, timingSafeEqual } from "node:crypto";

/** Signature checks for Razorpay and Cashfree. Server only (uses node:crypto), so keep it out of client components. */

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a); const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Razorpay checkout callback: HMAC-SHA256(order_id|payment_id) with the key secret. */
export function verifyRazorpayPayment(orderId: string, paymentId: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** Razorpay webhook: HMAC-SHA256 of the raw body with the webhook secret. */
export function verifyRazorpayWebhook(rawBody: string, signature: string, secret: string) {
  return safeEqual(createHmac("sha256", secret).update(rawBody).digest("hex"), signature);
}

/** Cashfree webhook: base64 HMAC-SHA256(timestamp + rawBody) with the client secret. */
export function verifyCashfreeWebhook(rawBody: string, timestamp: string, signature: string, secret: string) {
  return safeEqual(createHmac("sha256", secret).update(timestamp + rawBody).digest("base64"), signature);
}

