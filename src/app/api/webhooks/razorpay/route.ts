import { NextRequest, NextResponse } from "next/server";
import { markPaid, paymentByOrder } from "@/lib/payments";
import { verifyRazorpayWebhook } from "@/lib/payments-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Razorpay calls this when a payment is captured, even if the customer closed the tab. */
export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!secret || !signature || !verifyRazorpayWebhook(raw, signature, secret)) return new NextResponse(null, { status: 400 });
  try {
    const event = JSON.parse(raw) as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number } } } };
    const entity = event.payload?.payment?.entity;
    if ((event.event === "payment.captured" || event.event === "order.paid") && entity?.order_id && entity.id) {
      const payment = await paymentByOrder(entity.order_id);
      // Only accept the amount we asked for.
      if (payment && entity.amount === payment.amountPaise + payment.feePaise) await markPaid(payment.id, { method: "razorpay", providerPaymentId: entity.id });
    }
  } catch (error) { console.error("[webhook] razorpay", error); return new NextResponse(null, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
