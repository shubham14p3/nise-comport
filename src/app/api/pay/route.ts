import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { PublicError } from "@/lib/errors";
import { createGatewayOrder, markPaid, paymentByOrder, raiseTicket, requestRefund, revealUpiQr, submitUtr } from "@/lib/payments";
import { verifyRazorpayPayment } from "@/lib/payments-verify";
import { enforceRate, identity } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("utr"), reference: z.string().max(40), utr: z.string().max(40) }),
  z.object({ action: z.literal("qr"), reference: z.string().max(40), slot: z.number().int().min(0).max(2) }),
  z.object({ action: z.literal("order"), reference: z.string().max(40), provider: z.enum(["razorpay", "cashfree"]) }),
  z.object({ action: z.literal("ticket"), reference: z.string().max(40), note: z.string().max(500) }),
  z.object({ action: z.literal("refund"), reference: z.string().max(40), choice: z.enum(["wallet", "original", "cash"]), details: z.string().max(300).default("") }),
  z.object({ action: z.literal("razorpayDone"), orderId: z.string().max(60), paymentId: z.string().max(60), signature: z.string().max(200) }),
]);

/** Customer-side payment actions (reached through the encrypted browser endpoint). */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new PublicError("Please sign in to pay.", 401, { code: "unauthenticated" });
    const input = schema.parse(await readJson(request));
    await enforceRate({ name: "pay-user", limit: 20, windowSeconds: 600 }, identity("pay", user.id), "Too many payment attempts.");
    if (input.action === "utr") { await submitUtr(input.reference.trim().toUpperCase(), input.utr, user); return NextResponse.json({ ok: true }); }
    if (input.action === "ticket") { await raiseTicket(input.reference.trim().toUpperCase(), input.note, user); return NextResponse.json({ ok: true }); }
    if (input.action === "refund") { await requestRefund(input.reference.trim().toUpperCase(), input.choice, input.details, user); return NextResponse.json({ ok: true }); }
    if (input.action === "qr") return NextResponse.json(await revealUpiQr(input.reference.trim().toUpperCase(), input.slot, user), { headers: { "cache-control": "private, no-store" } });
    if (input.action === "order") return NextResponse.json(await createGatewayOrder(input.reference.trim().toUpperCase(), input.provider, user));
    const secret = process.env.RAZORPAY_KEY_SECRET;
    // Razorpay: verify against the order id WE stored, never the one the browser reports.
    const payment = await paymentByOrder(input.orderId);
    if (!payment || payment.userId !== user.id || !payment.providerOrderId) throw new PublicError("Payment not found.", 404);
    if (!secret || !verifyRazorpayPayment(payment.providerOrderId, input.paymentId, input.signature, secret)) throw new PublicError("We could not confirm that payment. If money was deducted, call us and we will sort it out.", 400);
    await markPaid(payment.id, { method: "razorpay", providerPaymentId: input.paymentId });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
