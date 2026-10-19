import { createHmac, timingSafeEqual } from "node:crypto";

/** Pure payment helpers (no database), so they can be unit-tested. Money is always in paise. */

export const PAYMENT_STATUSES = ["due", "verifying", "paid", "failed", "cancelled"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PayMethod = "upi_qr" | "razorpay" | "cashfree" | "cash";

/** Online fee passed on to the customer, as a percent (e.g. 2.4). UPI QR and cash never carry it. */
export function onlineFeePercent(raw = process.env.PAYMENT_ONLINE_FEE_PERCENT) {
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 && value <= 10 ? value : 2.4;
}

/** Fee in paise for an online payment of `amountPaise`, rounded up so the gateway cut is covered. */
export function convenienceFee(amountPaise: number, percent = onlineFeePercent()) {
  if (amountPaise <= 0 || percent <= 0) return 0;
  return Math.ceil((amountPaise * percent) / 100);
}

export function rupees(paise: number) {
  const value = paise / 100;
  return `₹${Number.isInteger(value) ? value.toLocaleString("en-IN") : value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function parseRupeesToPaise(input: string | number) {
  const value = typeof input === "number" ? input : Number(String(input).replace(/[₹,\s]/g, ""));
  if (!Number.isFinite(value) || value < 1 || value > 500000) return null;
  return Math.round(value * 100);
}

/** UPI deep link. Opens a UPI app on phones; the same text is what the QR code carries. */
export function upiLink(opts: { vpa: string; name: string; amountPaise: number; note: string }) {
  const params = [
    `pa=${encodeURIComponent(opts.vpa)}`, `pn=${encodeURIComponent(opts.name)}`,
    `am=${(opts.amountPaise / 100).toFixed(2)}`, "cu=INR", `tn=${encodeURIComponent(opts.note.slice(0, 40))}`,
  ];
  return `upi://pay?${params.join("&")}`;
}

/** UTR / bank reference numbers are 12 digits for UPI; some banks use 12–22 alphanumerics. */
export function cleanUtr(input: string) {
  const value = input.replace(/\s+/g, "").toUpperCase();
  return /^[A-Z0-9]{10,22}$/.test(value) ? value : null;
}

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

/** After this long without a result, the customer may raise a ticket for a pending/deducted payment. */
export const TICKET_AFTER_HOURS = 24;
export const WALLET_BONUS_PERCENT = 5;
export const GST_ON_FEE_PERCENT = 18;

export type RefundChoice = "wallet" | "original" | "cash";

/**
 * What a customer gets back. Wallet credit is the best deal (+5% bonus, nothing deducted).
 * Money back to the bank or in cash loses what we already paid the gateway (its commission plus
 * 18% GST on that commission) and any service charge for work already done. UPI QR and cash
 * payments carry no gateway commission, so nothing is deducted for them.
 */
export function refundBreakdown(opts: { paidPaise: number; method: string | null; choice: RefundChoice; feePercent?: number; serviceChargePaise?: number }) {
  const percent = opts.feePercent ?? onlineFeePercent();
  const online = opts.method === "razorpay" || opts.method === "cashfree";
  if (opts.choice === "wallet") {
    const bonus = Math.floor((opts.paidPaise * WALLET_BONUS_PERCENT) / 100);
    return { gatewayPaise: 0, gstPaise: 0, servicePaise: 0, bonusPaise: bonus, netPaise: opts.paidPaise + bonus };
  }
  const commission = online ? Math.ceil((opts.paidPaise * percent) / 100) : 0;
  const gst = Math.ceil((commission * GST_ON_FEE_PERCENT) / 100);
  const service = Math.max(0, opts.serviceChargePaise ?? 0);
  return { gatewayPaise: commission, gstPaise: gst, servicePaise: service, bonusPaise: 0, netPaise: Math.max(0, opts.paidPaise - commission - gst - service) };
}
