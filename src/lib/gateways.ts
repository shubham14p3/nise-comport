/**
 * Thin clients for Razorpay and Cashfree, written from their API references:
 *  - Razorpay: https://razorpay.com/docs/api/orders/create , /payments/{id}/refund (Basic auth, amounts in paise)
 *  - Cashfree: POST /pg/orders, GET /pg/orders/{id}/payments, POST /pg/orders/{id}/refunds (header auth, amounts in rupees)
 * Secrets come from environment variables and are never sent to the browser.
 */

export const cashfreeBase = () => (process.env.CASHFREE_ENV === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg");

export function cashfreeHeaders(extra: Record<string, string> = {}) {
  return {
    "x-client-id": process.env.CASHFREE_APP_ID ?? "", "x-client-secret": process.env.CASHFREE_SECRET_KEY ?? "",
    "x-api-version": process.env.CASHFREE_API_VERSION?.trim() || "2026-01-01", "content-type": "application/json", ...extra,
  };
}

function razorpayAuth() {
  return `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`;
}

export async function razorpayCreateOrder(input: { amountPaise: number; receipt: string; notes: Record<string, string> }) {
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST", headers: { Authorization: razorpayAuth(), "content-type": "application/json" },
    body: JSON.stringify({ amount: input.amountPaise, currency: "INR", receipt: input.receipt.slice(0, 40), notes: input.notes }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json().catch(() => ({})) as { id?: string };
  return response.ok && body.id ? { ok: true as const, id: body.id } : { ok: false as const, status: response.status, body };
}

export async function razorpayRefund(paymentId: string, amountPaise: number, receipt: string) {
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST", headers: { Authorization: razorpayAuth(), "content-type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, speed: "optimum", receipt: receipt.slice(0, 40) }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.json().catch(() => ({})) as { id?: string; status?: string; error?: { description?: string } };
  return response.ok && body.id ? { ok: true as const, refundId: body.id, status: body.status ?? "pending" } : { ok: false as const, error: body.error?.description ?? `Razorpay error ${response.status}` };
}

export async function cashfreeCreateOrder(body: Record<string, unknown>) {
  const response = await fetch(`${cashfreeBase()}/orders`, { method: "POST", headers: cashfreeHeaders(), body: JSON.stringify(body), signal: AbortSignal.timeout(15_000) });
  const data = await response.json().catch(() => ({})) as { order_id?: string; payment_session_id?: string };
  return response.ok && data.payment_session_id ? { ok: true as const, orderId: data.order_id, sessionId: data.payment_session_id } : { ok: false as const, status: response.status, body: data };
}

/** Asks Cashfree directly what happened to an order, so the pay page doesn't depend on the webhook arriving first. */
export async function cashfreeOrderPayments(orderId: string) {
  const response = await fetch(`${cashfreeBase()}/orders/${encodeURIComponent(orderId)}/payments`, { headers: cashfreeHeaders(), signal: AbortSignal.timeout(15_000) });
  if (!response.ok) return [];
  const data = await response.json().catch(() => []) as { cf_payment_id?: string | number; payment_status?: string; payment_amount?: number; payment_message?: string }[];
  return Array.isArray(data) ? data : [];
}

export async function cashfreeRefund(orderId: string, amountPaise: number, refundId: string) {
  const response = await fetch(`${cashfreeBase()}/orders/${encodeURIComponent(orderId)}/refunds`, {
    method: "POST", headers: cashfreeHeaders({ "x-idempotency-key": crypto.randomUUID() }),
    body: JSON.stringify({ refund_amount: Number((amountPaise / 100).toFixed(2)), refund_id: refundId.replace(/[^A-Za-z0-9]/g, "").slice(0, 40), refund_note: "NISE COMPORT refund" }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.json().catch(() => ({})) as { cf_refund_id?: string; refund_status?: string; message?: string };
  return response.ok ? { ok: true as const, refundId: body.cf_refund_id ?? refundId, status: body.refund_status ?? "PENDING" } : { ok: false as const, error: body.message ?? `Cashfree error ${response.status}` };
}
