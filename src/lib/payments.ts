import { and, desc, eq, sql } from "drizzle-orm";
import { payments, serviceRequests, users, walletEntries } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { sendPaymentAlertEmail, sendPaymentReceiptEmail } from "@/lib/email";
import { cleanUtr, convenienceFee, onlineFeePercent, refundBreakdown, rupees, TICKET_AFTER_HOURS, type PayMethod, type RefundChoice } from "@/lib/payments-core";
import { site } from "@/lib/site";

export type PaymentRow = typeof payments.$inferSelect;

/** Which payment options are switched on by the owner's environment variables. */
export function paymentOptions() {
  const upiId = process.env.UPI_ID?.trim() ?? "";
  return {
    upi: upiId ? { vpa: upiId, name: process.env.UPI_PAYEE_NAME?.trim() || site.name } : null,
    razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    cashfree: Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY),
    feePercent: onlineFeePercent(),
  };
}

const cashfreeBase = () => (process.env.CASHFREE_ENV === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg");

/** The customer's open (or latest) payment for a request, loaded only if the request is theirs or the viewer is staff. */
export async function paymentForReference(reference: string, viewer: { id: string; role: string }) {
  const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.reference, reference)).limit(1);
  if (!request) return null;
  const staff = viewer.role === "admin" || viewer.role === "staff";
  if (request.userId !== viewer.id && !staff) return null;
  const [payment] = await db.select().from(payments).where(eq(payments.requestId, request.id)).orderBy(desc(payments.createdAt)).limit(1);
  return payment ? { request, payment } : null;
}

export async function listPayments(status?: string) {
  const rows = await db.select({
    payment: payments, requestName: serviceRequests.serviceName, customer: users.name, phone: users.phone,
  }).from(payments).innerJoin(serviceRequests, eq(payments.requestId, serviceRequests.id)).innerJoin(users, eq(payments.userId, users.id))
    .where(status === "issues" ? sql`(${payments.issueRaisedAt} is not null and coalesce(${payments.refundStatus},'') <> 'done') or ${payments.refundStatus} = 'requested'` : status ? eq(payments.status, status) : undefined).orderBy(desc(payments.createdAt)).limit(200);
  return rows.map((row) => ({ ...row.payment, requestName: row.requestName, customer: row.customer, phone: row.phone }));
}

export async function createPaymentRequest(input: { reference: string; amountPaise: number; note?: string }, actor: { id: string }) {
  const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.reference, input.reference.trim().toUpperCase())).limit(1);
  if (!request) throw new PublicError("No request found with that reference.", 404);
  const [open] = await db.select({ id: payments.id }).from(payments).where(and(eq(payments.requestId, request.id), sql`${payments.status} in ('due','verifying')`)).limit(1);
  if (open) throw new PublicError("This request already has an unpaid payment. Cancel it first to create a new one.", 409);
  const [row] = await db.insert(payments).values({
    requestId: request.id, reference: request.reference, userId: request.userId, amountPaise: input.amountPaise, note: input.note?.slice(0, 200) || null, createdBy: actor.id,
  }).returning();
  await logActivity({ kind: "request", permission: "requests", title: `Payment of ₹${input.amountPaise / 100} requested`, detail: request.reference, refType: "payment", refId: row.id, actorId: actor.id });
  return row;
}

export async function cancelPayment(id: string) {
  await db.update(payments).set({ status: "cancelled", updatedAt: new Date() }).where(and(eq(payments.id, id), sql`${payments.status} <> 'paid'`));
}

/** Marks a payment as paid exactly once. Safe to call again for the same payment (webhooks retry). */
export async function markPaid(id: string, details: { method: PayMethod; providerPaymentId?: string | null; utr?: string | null; feePaise?: number; verifiedBy?: string | null }) {
  const [row] = await db.update(payments).set({
    status: "paid", method: details.method, providerPaymentId: details.providerPaymentId ?? null, utr: details.utr ?? null,
    ...(details.feePaise !== undefined ? { feePaise: details.feePaise } : {}), verifiedBy: details.verifiedBy ?? null, paidAt: new Date(), updatedAt: new Date(),
  }).where(and(eq(payments.id, id), sql`${payments.status} <> 'paid'`)).returning();
  if (row) {
    await logActivity({ kind: "request", permission: "requests", title: `Payment received: ${rupees(row.amountPaise + row.feePaise)} (${details.method})`, detail: row.reference, refType: "payment", refId: row.id, actorId: details.verifiedBy ?? null });
    await notifyPaid(row);
  }
  return row ?? null;
}

/** Customer says they paid by UPI and gives the bank reference (UTR). Staff then confirm it against the bank app. */
export async function submitUtr(reference: string, rawUtr: string, viewer: { id: string }) {
  const utr = cleanUtr(rawUtr);
  if (!utr) throw new PublicError("That reference number doesn’t look right. UPI reference numbers are usually 12 digits.", 400, { code: "invalid_input" });
  const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.reference, reference)).limit(1);
  if (!request || request.userId !== viewer.id) throw new PublicError("Payment not found.", 404);
  const [payment] = await db.select().from(payments).where(and(eq(payments.requestId, request.id), sql`${payments.status} in ('due','failed')`)).limit(1);
  if (!payment) throw new PublicError("There is nothing to pay on this request right now.", 409);
  try {
    await db.update(payments).set({ status: "verifying", method: "upi_qr", utr, updatedAt: new Date() }).where(eq(payments.id, payment.id));
  } catch (error) {
    if ((error as { code?: string })?.code === "23505" || (error as { cause?: { code?: string } })?.cause?.code === "23505") throw new PublicError("That reference number was already used. Check the number, or call us.", 409);
    throw error;
  }
  await logActivity({ kind: "request", permission: "requests", title: "UPI payment to verify", detail: `${reference} · UTR ${utr}`, refType: "payment", refId: payment.id });
}

/** Creates a gateway order for the customer's open payment, adding the online fee. */
export async function createGatewayOrder(reference: string, provider: "razorpay" | "cashfree", viewer: { id: string }) {
  const options = paymentOptions();
  if (!options[provider]) throw new PublicError("This payment option is not available yet. Please use the UPI QR.", 503);
  const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.reference, reference)).limit(1);
  if (!request || request.userId !== viewer.id) throw new PublicError("Payment not found.", 404);
  const [payment] = await db.select().from(payments).where(and(eq(payments.requestId, request.id), sql`${payments.status} in ('due','verifying','failed')`)).limit(1);
  if (!payment) throw new PublicError("There is nothing to pay on this request right now.", 409);
  const fee = convenienceFee(payment.amountPaise, options.feePercent);
  const total = payment.amountPaise + fee;
  const orderId = `${payment.reference}-${Date.now().toString(36)}`.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);

  if (provider === "razorpay") {
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST", headers: { Authorization: `Basic ${auth}`, "content-type": "application/json" },
      body: JSON.stringify({ amount: total, currency: "INR", receipt: orderId, notes: { reference: payment.reference, paymentId: payment.id } }),
    });
    const order = await response.json().catch(() => ({})) as { id?: string };
    if (!response.ok || !order.id) { console.error("[pay] razorpay order failed", response.status, order); throw new PublicError("Online payment is busy right now. Please use the UPI QR or try again.", 502); }
    await db.update(payments).set({ providerOrderId: order.id, feePaise: fee, method: "razorpay", updatedAt: new Date() }).where(eq(payments.id, payment.id));
    return { provider, keyId: process.env.RAZORPAY_KEY_ID, orderId: order.id, amount: total, name: site.name, reference: payment.reference };
  }

  const [customer] = await db.select().from(users).where(eq(users.id, viewer.id)).limit(1);
  const phone = (customer?.phone ?? "").replace(/\D/g, "").slice(-10);
  if (phone.length !== 10) throw new PublicError("Please add your 10-digit mobile number in your profile to pay online.", 400, { code: "phone_required" });
  const response = await fetch(`${cashfreeBase()}/orders`, {
    method: "POST",
    headers: { "x-client-id": process.env.CASHFREE_APP_ID!, "x-client-secret": process.env.CASHFREE_SECRET_KEY!, "x-api-version": "2023-08-01", "content-type": "application/json" },
    body: JSON.stringify({
      order_id: orderId, order_amount: Number((total / 100).toFixed(2)), order_currency: "INR",
      customer_details: { customer_id: viewer.id.replace(/-/g, "").slice(0, 30), customer_phone: phone, customer_name: customer?.name?.slice(0, 80), customer_email: customer?.email },
      order_meta: { return_url: `${site.url}/pay/${payment.reference}?order={order_id}`, notify_url: `${site.url}/api/webhooks/cashfree` },
      order_note: payment.reference,
    }),
  });
  const order = await response.json().catch(() => ({})) as { order_id?: string; payment_session_id?: string };
  if (!response.ok || !order.payment_session_id) { console.error("[pay] cashfree order failed", response.status, order); throw new PublicError("Online payment is busy right now. Please use the UPI QR or try again.", 502); }
  await db.update(payments).set({ providerOrderId: order.order_id ?? orderId, feePaise: fee, method: "cashfree", updatedAt: new Date() }).where(eq(payments.id, payment.id));
  return { provider, sessionId: order.payment_session_id, mode: process.env.CASHFREE_ENV === "production" ? "production" : "sandbox", reference: payment.reference };
}

/** Looks a payment up by the gateway's order id (used by webhooks). */
export async function paymentByOrder(orderId: string) {
  const [row] = await db.select().from(payments).where(eq(payments.providerOrderId, orderId)).limit(1);
  return row ?? null;
}

/** Emails the owner (who paid, mobile, amount, service, ticket) and the customer a receipt. Never throws. */
async function notifyPaid(row: PaymentRow) {
  try {
    const [info] = await db.select({ name: users.name, phone: users.phone, email: users.email, service: serviceRequests.serviceName }).from(users).innerJoin(serviceRequests, eq(serviceRequests.id, row.requestId)).where(eq(users.id, row.userId)).limit(1);
    if (!info) return;
    const amount = rupees(row.amountPaise + row.feePaise);
    const method = row.method === "razorpay" ? "Razorpay" : row.method === "cashfree" ? "Cashfree" : row.method === "cash" ? "Cash at desk" : "UPI QR";
    await Promise.allSettled([
      sendPaymentAlertEmail({ customer: info.name, phone: info.phone, email: info.email, service: info.service, reference: row.reference, amount, method, utr: row.utr }),
      sendPaymentReceiptEmail(info.email, info.name, { reference: row.reference, service: info.service, amount }),
    ]);
  } catch (error) { console.error("[pay] could not send payment emails", error); }
}

/** A gateway reported a failed payment. The customer sees why and can retry. Never downgrades a paid payment. */
export async function markFailed(id: string, reason: string) {
  await db.update(payments).set({ status: "failed", failureReason: reason.slice(0, 200), updatedAt: new Date() }).where(and(eq(payments.id, id), sql`${payments.status} <> 'paid'`));
}

/** Customer: money left their account (or the status is stuck) for over 24 hours, so they ask us to check with the gateway. */
export async function raiseTicket(reference: string, note: string, viewer: { id: string }) {
  const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.reference, reference)).limit(1);
  if (!request || request.userId !== viewer.id) throw new PublicError("Payment not found.", 404);
  const [payment] = await db.select().from(payments).where(eq(payments.requestId, request.id)).orderBy(desc(payments.createdAt)).limit(1);
  if (!payment || payment.status === "paid" || payment.status === "cancelled") throw new PublicError("There is no pending payment to check.", 409);
  const waitedMs = Date.now() - payment.updatedAt.getTime();
  if (waitedMs < TICKET_AFTER_HOURS * 3600_000) throw new PublicError(`Please wait ${TICKET_AFTER_HOURS} hours after paying. Most payments are confirmed well before that. If it is still missing then, raise a ticket.`, 409, { code: "too_early" });
  await db.update(payments).set({ issueNote: note.slice(0, 500), issueRaisedAt: new Date(), updatedAt: payment.updatedAt }).where(eq(payments.id, payment.id));
  await logActivity({ kind: "request", permission: "requests", title: "Payment ticket raised", detail: `${reference} · ${note.slice(0, 120)}`, refType: "payment", refId: payment.id });
}

/** Customer asks for money back and says how they want it. Staff then approve it in Admin → Payments. */
export async function requestRefund(reference: string, choice: RefundChoice, details: string, viewer: { id: string }) {
  const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.reference, reference)).limit(1);
  if (!request || request.userId !== viewer.id) throw new PublicError("Payment not found.", 404);
  const [payment] = await db.select().from(payments).where(eq(payments.requestId, request.id)).orderBy(desc(payments.createdAt)).limit(1);
  if (!payment || payment.refundStatus) throw new PublicError("A refund was already requested or paid for this payment.", 409);
  if (payment.status !== "paid" && !payment.issueRaisedAt) throw new PublicError("A refund can be requested after a payment was received, or after you raise a ticket for a missing one.", 409);
  if (choice === "original" && !details.trim()) throw new PublicError("Please share the bank account or UPI ID to send the money to.", 400, { code: "invalid_input" });
  await db.update(payments).set({ refundChoice: choice, refundStatus: "requested", refundDetails: details.slice(0, 300) || null, updatedAt: new Date() }).where(eq(payments.id, payment.id));
  await logActivity({ kind: "request", permission: "requests", title: "Refund requested", detail: `${reference} · ${choice}`, refType: "payment", refId: payment.id });
}

/** Staff: pays out a requested refund. Wallet refunds add the 5% bonus and credit the customer's profile straight away. */
export async function processRefund(id: string, actor: { id: string }, opts: { serviceChargePaise?: number } = {}) {
  const [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  if (!payment || payment.refundStatus !== "requested" || !payment.refundChoice) throw new PublicError("No refund is waiting on this payment.", 409);
  const choice = payment.refundChoice as RefundChoice;
  const paid = payment.amountPaise + payment.feePaise;
  const result = refundBreakdown({ paidPaise: paid, method: payment.method, choice, feePercent: onlineFeePercent(), serviceChargePaise: opts.serviceChargePaise });
  const [claimed] = await db.update(payments).set({ refundStatus: "done", refundPaise: result.netPaise, refundedAt: new Date(), updatedAt: new Date() }).where(and(eq(payments.id, id), eq(payments.refundStatus, "requested"))).returning({ id: payments.id });
  if (!claimed) throw new PublicError("This refund was already processed.", 409);
  if (choice === "wallet") await db.insert(walletEntries).values({ userId: payment.userId, amount: (result.netPaise / 100).toFixed(2), kind: "credit", description: `Refund credit for ${payment.reference} (includes 5% bonus)`, reference: payment.reference });
  await logActivity({ kind: "request", permission: "requests", title: `Refund of ${rupees(result.netPaise)} (${choice})`, detail: payment.reference, refType: "payment", refId: id, actorId: actor.id });
  return result;
}

/** Totals for the dashboard header. */
export async function paymentSummary() {
  const rows = await db.select({
    method: payments.method, status: payments.status, count: sql<number>`count(*)::int`, amount: sql<number>`coalesce(sum(${payments.amountPaise}),0)::bigint`, fee: sql<number>`coalesce(sum(${payments.feePaise}),0)::bigint`,
  }).from(payments).groupBy(payments.method, payments.status);
  const paid = rows.filter((r) => r.status === "paid");
  const byMethod = ["upi_qr", "razorpay", "cashfree", "cash"].map((m) => { const r = paid.filter((x) => x.method === m); return { method: m, count: r.reduce((a, x) => a + x.count, 0), paise: r.reduce((a, x) => a + Number(x.amount) + (m === "razorpay" || m === "cashfree" ? Number(x.fee) : 0), 0) }; });
  const count = (status: string) => rows.filter((r) => r.status === status).reduce((a, x) => a + x.count, 0);
  const [attention] = await db.select({ n: sql<number>`count(*)::int` }).from(payments).where(sql`${payments.issueRaisedAt} is not null and coalesce(${payments.refundStatus},'') <> 'done' or ${payments.refundStatus} = 'requested'`);
  return { byMethod, totalPaise: byMethod.reduce((a, x) => a + x.paise, 0), verifying: count("verifying"), failed: count("failed"), due: count("due"), attention: attention?.n ?? 0 };
}
