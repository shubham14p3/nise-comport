import crypto from "node:crypto";

function basicAuth(key, secret) {
  return Buffer.from(`${key}:${secret}`).toString("base64");
}

export function onlinePaymentsConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export async function createPaymentOrder({ amountPaise, receipt, notes = {} }) {
  if (!onlinePaymentsConfigured()) {
    return { provider: "pay_at_shop", orderId: null, amountPaise };
  }

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes,
      payment_capture: 1,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw Object.assign(new Error(`Payment provider error: ${detail}`), { status: 502 });
  }

  const data = await response.json();
  return {
    provider: "razorpay",
    orderId: data.id,
    amountPaise: data.amount,
    currency: data.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
}

export function verifyRazorpayCheckout({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyRazorpayWebhook(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
