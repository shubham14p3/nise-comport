import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PayPanel from "@/components/pay-panel";
import { getCurrentUser } from "@/lib/auth";
import { paymentForReference, paymentOptions, syncCashfreePayment, upiQrSeconds } from "@/lib/payments";
import { convenienceFee, refundBreakdown, TICKET_AFTER_HOURS } from "@/lib/payments-core";
import { privateMetadata } from "@/lib/seo";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = privateMetadata("Pay for your request");
export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/pay/${reference}`)}`);
  const first = await paymentForReference(reference.toUpperCase(), user);
  if (!first) notFound();
  if (first.payment.method === "cashfree" && first.payment.status !== "paid" && first.payment.providerOrderId) await syncCashfreePayment(first.payment);
  const found = (await paymentForReference(reference.toUpperCase(), user)) ?? first;
  const { payment, request } = found;
  const options = paymentOptions();
  const fee = convenienceFee(payment.amountPaise, options.feePercent);
  const paid = payment.amountPaise + payment.feePaise;
  const estimates = (["wallet", "original", "cash"] as const).map((choice) => ({ choice, net: refundBreakdown({ paidPaise: paid, method: payment.method, choice, feePercent: options.feePercent }).netPaise }));
  const ticketOpen = Date.now() - payment.updatedAt.getTime() >= TICKET_AFTER_HOURS * 3600_000;
  return <main className="content-page"><SiteHeader/>
    <section className="container legal-content pay-page">
      <span className="eyebrow eyebrow-muted">PAYMENT</span>
      <h1>Pay for <em>{request.serviceName}.</em></h1>
      <PayPanel
        reference={payment.reference} status={payment.status} amountPaise={payment.amountPaise} feePaise={fee} note={payment.note}
        paidVia={payment.method} upiSlots={(options.upi ?? []).map((item) => ({ slot: item.slot, label: item.label }))} qrSeconds={upiQrSeconds()}
        helpHref={whatsappLink(`Hello NISE COMPORT, I want to pay ${payment.reference}. Please share the payment details.`)} failureReason={payment.failureReason} ticketRaised={Boolean(payment.issueRaisedAt)} ticketOpen={ticketOpen} refundStatus={payment.refundStatus} refundChoice={payment.refundChoice} refundPaise={payment.refundPaise} estimates={estimates}
        razorpay={options.razorpay} cashfree={options.cashfree} feePercent={options.feePercent}/>
      <p className="legal-updated">Questions? See <Link href="/refund-policy">refunds</Link> or call us from the <Link href="/contact">contact page</Link>.</p>
    </section>
  </main>;
}
