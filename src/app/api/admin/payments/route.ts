import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { PublicError } from "@/lib/errors";
import { cancelPayment, createPaymentRequest, listPayments, markPaid, paymentOptions, paymentSummary, processRefund } from "@/lib/payments";
import { parseRupeesToPaise } from "@/lib/payments-core";
import { db } from "@/lib/db";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), reference: z.string().min(3).max(40), amount: z.union([z.string(), z.number()]), note: z.string().max(200).optional() }),
  z.object({ action: z.literal("markPaid"), id: z.string().uuid(), method: z.enum(["upi_qr", "cash"]) }),
  z.object({ action: z.literal("refund"), id: z.string().uuid(), serviceCharge: z.union([z.string(), z.number()]).optional() }),
  z.object({ action: z.literal("cancel"), id: z.string().uuid() }),
]);

export async function GET(request: NextRequest) {
  try {
    await requirePermission("requests");
    const status = request.nextUrl.searchParams.get("status") ?? "";
    const options = paymentOptions();
    const page = Math.max(0, Number(request.nextUrl.searchParams.get("page")) || 0);
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize")) || 20;
    const [result, summary] = await Promise.all([listPayments(status || undefined, page, pageSize), paymentSummary()]);
    return NextResponse.json({ payments: result.rows, total: result.total, summary, options: { upi: options.upi?.length ?? 0, razorpay: options.razorpay, cashfree: options.cashfree, feePercent: options.feePercent } }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("requests");
    const input = schema.parse(await readJson(request));
    if (input.action === "create") {
      const amountPaise = parseRupeesToPaise(input.amount);
      if (!amountPaise) throw new PublicError("Enter an amount between ₹1 and ₹5,00,000.", 400, { code: "invalid_input" });
      await createPaymentRequest({ reference: input.reference, amountPaise, note: input.note }, user);
    } else if (input.action === "markPaid") {
      const [row] = await db.select({ utr: payments.utr }).from(payments).where(eq(payments.id, input.id)).limit(1);
      await markPaid(input.id, { method: input.method, utr: input.method === "upi_qr" ? row?.utr : null, feePaise: 0, verifiedBy: user.id });
    } else if (input.action === "refund") {
      const service = input.serviceCharge === undefined || input.serviceCharge === "" ? 0 : (parseRupeesToPaise(input.serviceCharge) ?? 0);
      await processRefund(input.id, user, { serviceChargePaise: service });
    } else await cancelPayment(input.id);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
