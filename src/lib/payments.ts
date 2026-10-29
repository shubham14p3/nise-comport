import { and, count, desc, eq, sql } from "drizzle-orm";
import { after } from "next/server";
import { payments, serviceRequests, users, walletEntries } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { cashfreeCreateOrder, cashfreeOrderPayments, cashfreeRefund, razorpayCreateOrder, razorpayRefund } from "@/lib/gateways";
import { sendPaymentAlertEmail, sendPaymentReceiptEmail } from "@/lib/email";
import { cleanUtr, convenienceFee, parseUpiAccounts, upiLink, type UpiAccount, onlineFeePercent, refundBreakdown, rupees, TICKET_AFTER_HOURS, type PayMethod, type RefundChoice } from "@/lib/payments-core";
import { site } from "@/lib/site";
import { qrSvg } from "@/lib/qr";
import { enforceRate, identity } from "@/lib/rate-limit";
import { canQuote } from "@/lib/review-workflow";
import { deliverNotifications, queueNotification } from "@/lib/notifications";
import { sendStatusWhatsApp } from "@/lib/whatsapp-alerts";
import { recordEvent } from "@/lib/requests";

export type PaymentRow = typeof payments.$inferSelect;

/** Which payment options are switched on by the owner's environment variables. */
/**
 * The shop's UPI IDs from UPI_ID, UPI_ID_2 and UPI_ID_3 (label after a bar, e.g. "nisecomport@sbi|SBI current account").
 * The IDs are never put in a page; they are sent only when a signed-in customer asks to see the payment QR (see revealUpiQr).
 */
export function upiAccounts(): UpiAccount[] {
  return parseUpiAccounts([process.env.UPI_ID, process.env.UPI_ID_2, process.env.UPI_ID_3], process.env.UPI_PAYEE_NAME?.trim() || site.name);
}

/** How long the payment QR stays on screen after it is shown (seconds, 60 to 600). */
export function upiQrSeconds() {
  const value = Number(process.env.UPI_QR_SECONDS);
  return Number.isFinite(value) && value > 0 ? Math.max(60, Math.min(600, Math.round(value))) : 180;
}

export function paymentOptions() {
  const accounts = upiAccounts();
  return {
    upi: accounts.length ? accounts : null,
    razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    cashfree: Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY),
    feePercent: onlineFeePercent(),
  };
}

/** The customer's open (or latest) payment for a request, loaded only if the request is theirs or the viewer is staff. */
/** Customers pay only when both their email and their mobile number are verified. Staff and owners are not checked. */
export async function payerVerification(viewer: { id: string }) {
  const [user] = await db.select({ role: users.role, name: users.name, emailVerifiedAt: users.emailVerifiedAt, phoneVerifiedAt: users.phoneVerifiedAt }).from(users).where(eq(users.id, viewer.id)).limit(1);
  if (!user) return null;
  return { name: user.name, staff: user.role === "admin" || user.role === "staff", email: Boolean(user.emailVerifiedAt), phone: Boolean(user.phoneVerifiedAt) };
}
async function requireVerifiedPayer(viewer: { id: string }) {
  const who = await payerVerification(viewer);
  if (!who) throw new PublicError("Sign in to pay.", 401, { code: "sign_in_required" });
  if (who.staff) return;
  if (!who.email || !who.phone) throw new PublicError("Verify your email and mobile number before paying. Open your profile to verify them.", 403, { code: "verification_required" });
}

export async function paymentForReference(reference: string, viewer: { id: string; role: string }) {
  const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.reference, reference)).limit(1);
  if (!request) return null;
  const staff = viewer.role === "admin" || viewer.role === "staff";
  if (request.userId !== viewer.id && !staff) return null;
  const [payment] = await db.select().from(payments).where(eq(payments.requestId, request.id)).orderBy(desc(payments.createdAt)).limit(1);
  return payment ? { request, payment } : null;
}

export async function listPayments(status?: string, page = 0, pageSize = 20) {
  const size = [10, 20, 50].includes(pageSize) ? pageSize : 20;
  const offset = Math.max(0, Math.min(page, 100000)) * size;
  const where = status === "issues" ? sql`(${payments.issueRaisedAt} is not null and coalesce(${payments.refundStatus},'') <> 'done') or ${payments.refundStatus} = 'requested'` : status ? eq(payments.status, status) : undefined;
  const rows = await db.select({
    payment: payments, requestName: serviceRequests.serviceName, customer: users.name, phone: users.phone,
  }).from(payments).innerJoin(serviceRequests, eq(payments.requestId, serviceRequests.id)).innerJoin(users, eq(payments.userId, users.id))
    .where(where).orderBy(desc(payments.createdAt), desc(payments.id)).limit(size).offset(offset);
  const [total] = await db.select({ value: count() }).from(payments).where(where);
  return { rows: rows.map((row) => ({ ...row.payment, requestName: row.requestName, customer: row.customer, phone: row.phone })), total: total.value };
}

export async function createPaymentRequest(input: { reference: string; amountPaise: number; note?: string; serviceFeePaise?: number; externalFeePaise?: number }, actor: { id: string }) {
  const serviceFeePaise=input.serviceFeePaise??input.amountPaise;
  const externalFeePaise=input.externalFeePaise??0;
  if(!Number.isSafeInteger(serviceFeePaise)||!Number.isSafeInteger(externalFeePaise)||serviceFeePaise<0||externalFeePaise<0||
    serviceFeePaise+externalFeePaise!==input.amountPaise||input.amountPaise<100||input.amountPaise>50_000_000)
    throw new PublicError("Enter a valid quote with total between ₹1 and ₹5,00,000.",400);
  const result=await db.transaction(async(tx)=>{
    const [request]=await tx.select().from(serviceRequests).where(eq(serviceRequests.reference,input.reference.trim().toUpperCase())).limit(1);
    if(!request)throw new PublicError("No request found with that reference.",404);
    if(!canQuote(request.status,request.details,request.serviceSlug))
      throw new PublicError("Review and approve all application details before requesting payment.",409);
    const [existing]=await tx.select({id:payments.id,status:payments.status}).from(payments)
      .where(eq(payments.requestId,request.id)).orderBy(desc(payments.createdAt)).limit(1);
    if(existing && existing.status!=="cancelled")
      throw new PublicError("This request already has a payment. Manage or cancel it before issuing another quote.",409);
    const now=new Date();
    const [updated]=await tx.update(serviceRequests).set({
      status:"awaiting_payment",serviceFee:(serviceFeePaise/100).toFixed(2),
      externalFee:(externalFeePaise/100).toFixed(2),updatedAt:now,
    }).where(and(eq(serviceRequests.id,request.id),eq(serviceRequests.status,"reviewing"),eq(serviceRequests.updatedAt,request.updatedAt)))
      .returning({id:serviceRequests.id});
    if(!updated)throw new PublicError("This request was updated while you were quoting. Reload and retry.",409);
    const [payment]=await tx.insert(payments).values({
      requestId:request.id,reference:request.reference,userId:request.userId,
      amountPaise:input.amountPaise,note:input.note?.slice(0,200)||null,createdBy:actor.id,
    }).returning();
    return {payment,request};
  });
  const {payment,request}=result;
  await recordEvent("service",request.id,actor.id,"reviewing","awaiting_payment",
    `Review approved, quotation ₹${(serviceFeePaise/100).toFixed(2)} service + ₹${(externalFeePaise/100).toFixed(2)} external. ${input.note??""}`.slice(0,500));
  await logActivity({kind:"request",permission:"requests",title:`Payment of ₹${input.amountPaise/100} requested`,
    detail:request.reference,refType:"payment",refId:payment.id,actorId:actor.id});
  const [customer]=await db.select({name:users.name,email:users.email,phone:users.phone,whatsapp:users.whatsapp}).from(users)
    .where(eq(users.id,request.userId)).limit(1);
  if(customer){
    try {
      const id=await queueNotification(request.userId,"customer_message",{
        email:customer.email,subject:`Payment quotation ready: ${request.reference}`,
        lines:[`Hello ${customer.name},`,`We have reviewed your ${request.serviceName} application.`,
          `Service fee: ₹${(serviceFeePaise/100).toFixed(2)}`,
          `Official/external fee: ₹${(externalFeePaise/100).toFixed(2)}`,
          `Total: ₹${(input.amountPaise/100).toFixed(2)} (before eligible promo discount or payment processing fee).`,
          `View the payment page: ${site.url}/pay/${encodeURIComponent(request.reference)}`,
          "When payment is verified, we will start processing and update your account with the official reference when available."],
      });
      after(async()=>{await deliverNotifications([id]).catch(error=>console.error("[quote] notification delivery retry queued",error));});
    }catch(error){console.error("[quote] could not queue payment link email",error);}
    sendStatusWhatsApp({name:customer.name,phone:customer.whatsapp??customer.phone,reference:request.reference,service:request.serviceName,status:"Quotation ready — pay through your account"});
  }
  return payment;
}

export async function cancelPayment(id:string){
  const [payment]=await db.select().from(payments).where(eq(payments.id,id)).limit(1);
  if(!payment || !["due","failed","verifying"].includes(payment.status))throw new PublicError("Only an unpaid request may be cancelled.",409);
  const [row]=await db.update(payments).set({status:"cancelled",updatedAt:new Date()})
    .where(and(eq(payments.id,id),eq(payments.status,payment.status))).returning({requestId:payments.requestId});
  if(row)await db.update(serviceRequests).set({status:"reviewing",updatedAt:new Date()})
    .where(and(eq(serviceRequests.id,row.requestId),eq(serviceRequests.status,"awaiting_payment")));
}

/** Marks a payment as paid exactly once. Safe to call again for the same payment (webhooks retry). */
export async function markPaid(id: string, details: { method: PayMethod; providerPaymentId?: string | null; utr?: string | null; feePaise?: number; verifiedBy?: string | null }) {
  const [row] = await db.update(payments).set({
    status: "paid", method: details.method, providerPaymentId: details.providerPaymentId ?? null, utr: details.utr ?? null,
    ...(details.feePaise !== undefined ? { feePaise: details.feePaise } : {}), verifiedBy: details.verifiedBy ?? null, paidAt: new Date(), updatedAt: new Date(),
  }).where(and(eq(payments.id, id), sql`${payments.status} <> 'paid'`)).returning();
  if (row) {
    await logActivity({ kind: "request", permission: "requests", title: `Payment received: ${rupees(row.amountPaise + row.feePaise)} (${details.method})`, detail: row.reference, refType: "payment", refId: row.id, actorId: details.verifiedBy ?? null });
    await db.update(serviceRequests).set({ status: "payment_received", updatedAt: new Date() }).where(and(eq(serviceRequests.id, row.requestId), eq(serviceRequests.status, "awaiting_payment")));
    await notifyPaid(row);
    const [customer]=await db.select({name:users.name,phone:users.phone,whatsapp:users.whatsapp,service:serviceRequests.serviceName})
      .from(users).innerJoin(serviceRequests,eq(serviceRequests.id,row.requestId)).where(eq(users.id,row.userId)).limit(1);
    if(customer)sendStatusWhatsApp({name:customer.name,phone:customer.whatsapp??customer.phone,reference:row.reference,
      service:customer.service,status:"Payment verified. Official filing is next."});
  }
  return row ?? null;
}

/** Customer says they paid by UPI and gives the bank reference (UTR). Staff then confirm it against the bank app. */
export async function submitUtr(reference: string, rawUtr: string, viewer: { id: string }) {
  await requireVerifiedPayer(viewer);
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
  await requireVerifiedPayer(viewer);
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
    const order = await razorpayCreateOrder({ amountPaise: total, receipt: orderId, notes: { reference: payment.reference, paymentId: payment.id } });
    if (!order.ok) { console.error("[pay] razorpay order failed", order.status, order.body); throw new PublicError("Online payment is busy right now. Please use the UPI QR or try again.", 502); }
    await db.update(payments).set({ providerOrderId: order.id, feePaise: fee, method: "razorpay", updatedAt: new Date() }).where(eq(payments.id, payment.id));
    return { provider, keyId: process.env.RAZORPAY_KEY_ID, orderId: order.id, amount: total, name: site.name, reference: payment.reference };
  }

  const [customer] = await db.select().from(users).where(eq(users.id, viewer.id)).limit(1);
  const phone = (customer?.phone ?? "").replace(/\D/g, "").slice(-10);
  if (phone.length !== 10) throw new PublicError("Please add your 10-digit mobile number in your profile to pay online.", 400, { code: "phone_required" });
  const order = await cashfreeCreateOrder({
    order_id: orderId, order_amount: Number((total / 100).toFixed(2)), order_currency: "INR",
    customer_details: { customer_id: viewer.id.replace(/-/g, "").slice(0, 30), customer_phone: phone, ...((customer?.name?.length ?? 0) >= 3 ? { customer_name: customer!.name.slice(0, 100) } : {}), customer_email: customer?.email },
    order_meta: { return_url: `${site.url}/pay/${payment.reference}?order={order_id}`, notify_url: `${site.url}/api/webhooks/cashfree` },
    order_note: payment.reference,
  });
  if (!order.ok) { console.error("[pay] cashfree order failed", order.status, order.body); throw new PublicError("Online payment is busy right now. Please use the UPI QR or try again.", 502); }
  await db.update(payments).set({ providerOrderId: order.orderId ?? orderId, feePaise: fee, method: "cashfree", updatedAt: new Date() }).where(eq(payments.id, payment.id));
  return { provider, sessionId: order.sessionId, mode: process.env.CASHFREE_ENV === "production" ? "production" : "sandbox", reference: payment.reference };
}

/**
 * When the customer comes back from Cashfree's page, ask Cashfree what happened instead of waiting for the webhook.
 * Only a SUCCESS for exactly the amount we asked for marks the payment as paid.
 */
export async function syncCashfreePayment(payment: PaymentRow) {
  if (payment.status === "paid" || payment.method !== "cashfree" || !payment.providerOrderId || !paymentOptions().cashfree) return;
  try {
    const list = await cashfreeOrderPayments(payment.providerOrderId);
    const total = payment.amountPaise + payment.feePaise;
    const success = list.find((item) => item.payment_status === "SUCCESS" && Math.round(Number(item.payment_amount) * 100) === total);
    if (success) { await markPaid(payment.id, { method: "cashfree", providerPaymentId: String(success.cf_payment_id ?? "") }); return; }
    const failed = list.find((item) => item.payment_status === "FAILED");
    if (failed && list.every((item) => item.payment_status !== "SUCCESS" && item.payment_status !== "PENDING")) await markFailed(payment.id, failed.payment_message || "The payment did not go through.");
  } catch (error) { console.error("[pay] cashfree sync failed", error); }
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
  let gatewayNote = "";
  if (choice !== "wallet" && payment.providerOrderId && (payment.method === "razorpay" || payment.method === "cashfree") && result.netPaise > 0) {
    const outcome = payment.method === "razorpay" && payment.providerPaymentId
      ? await razorpayRefund(payment.providerPaymentId, result.netPaise, `RF${payment.reference}`)
      : payment.method === "cashfree" ? await cashfreeRefund(payment.providerOrderId, result.netPaise, `RF${payment.id}`) : null;
    if (outcome && !outcome.ok) {
      // Nothing was refunded, so put the request back for another try (or for paying by hand).
      await db.update(payments).set({ refundStatus: "requested", refundPaise: null, refundedAt: null }).where(eq(payments.id, id));
      throw new PublicError(`The payment provider did not accept the refund: ${outcome.error}`, 502);
    }
    if (outcome?.ok) gatewayNote = ` via ${payment.method}`;
  }
  if (choice === "wallet") await db.insert(walletEntries).values({ userId: payment.userId, amount: (result.netPaise / 100).toFixed(2), kind: "credit", description: `Refund credit for ${payment.reference} (includes 5% bonus)`, reference: payment.reference });
  await logActivity({ kind: "request", permission: "requests", title: `Refund of ${rupees(result.netPaise)} (${choice}${gatewayNote})`, detail: payment.reference, refType: "payment", refId: id, actorId: actor.id });
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
  // UTRs still waiting after 48 hours: the customer was promised 24–48 working hours, so staff should look at these first.
  const [overdue] = await db.select({ n: sql<number>`count(*)::int` }).from(payments)
    .where(and(eq(payments.status, "verifying"), sql`${payments.updatedAt} < now() - interval '48 hours'`));
  return { byMethod, totalPaise: byMethod.reduce((a, x) => a + x.paise, 0), verifying: count("verifying"), overdueVerify: overdue?.n ?? 0, failed: count("failed"), due: count("due"), attention: attention?.n ?? 0 };
}

/**
 * Shows the UPI payment QR to the signed-in person who owns the request, for a short time. The ID and QR are
 * built here, per request, and are not in the page; each look is rate-limited. A screenshot can't be prevented,
 * but the QR carries this payment's amount and reference, so it is only useful for paying this bill.
 */
export async function revealUpiQr(reference: string, slot: number, viewer: { id: string; role: string }) {
  await requireVerifiedPayer(viewer);
  const accounts = upiAccounts();
  const account = accounts.find((item) => item.slot === slot);
  if (!account) throw new PublicError("UPI payment is not available right now.", 404);
  const found = await paymentForReference(reference, viewer);
  if (!found) throw new PublicError("Payment not found.", 404);
  const { payment } = found;
  if (payment.status !== "due" && payment.status !== "failed") throw new PublicError("This payment doesn’t need a QR code.", 400);
  await enforceRate({ name: "upi-qr", limit: 6, windowSeconds: 3600 }, identity("upi-qr", `${viewer.id}:${payment.id}`), "You have opened the payment QR several times.");
  const link = upiLink({ vpa: account.vpa, name: account.name, amountPaise: payment.amountPaise, note: payment.reference });
  const seconds = upiQrSeconds();
  return { svg: qrSvg(link, { size: 220 }), link, vpa: account.vpa, label: account.label, seconds, expiresAt: Date.now() + seconds * 1000 };
}
