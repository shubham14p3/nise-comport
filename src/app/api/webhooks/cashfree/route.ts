import { NextRequest, NextResponse } from "next/server";
import { markFailed, markPaid, paymentByOrder } from "@/lib/payments";
import { verifyCashfreeWebhook } from "@/lib/payments-verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cashfree calls this when a payment succeeds, even if the customer closed the tab. */
export async function POST(request: NextRequest) {
  const secret = process.env.CASHFREE_SECRET_KEY;
  const raw = await request.text();
  const signature = request.headers.get("x-webhook-signature") ?? "";
  const timestamp = request.headers.get("x-webhook-timestamp") ?? "";
  if (!secret || !signature || !timestamp || !verifyCashfreeWebhook(raw, timestamp, signature, secret)) return new NextResponse(null, { status: 400 });
  try {
    const event = JSON.parse(raw) as { type?: string; data?: { order?: { order_id?: string; order_amount?: number }; payment?: { cf_payment_id?: number | string; payment_status?: string; payment_message?: string } } };
    const { order, payment: gateway } = event.data ?? {};
    if ((event.type === "PAYMENT_SUCCESS_WEBHOOK" || event.type === "PAYMENT_SUCCESS") && order?.order_id && gateway?.payment_status === "SUCCESS") {
      const payment = await paymentByOrder(order.order_id);
      if (payment && Math.round(Number(order.order_amount) * 100) === payment.amountPaise + payment.feePaise) await markPaid(payment.id, { method: "cashfree", providerPaymentId: String(gateway.cf_payment_id ?? "") });
    }
    if ((event.type === "PAYMENT_FAILED_WEBHOOK" || event.type === "PAYMENT_FAILED") && order?.order_id) {
      const payment = await paymentByOrder(order.order_id);
      if (payment) await markFailed(payment.id, gateway?.payment_message || "The payment did not go through.");
    }
  } catch (error) { console.error("[webhook] cashfree", error); return new NextResponse(null, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
