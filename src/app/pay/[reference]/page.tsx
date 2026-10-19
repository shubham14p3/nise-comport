import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PayPanel from "@/components/pay-panel";
import { getCurrentUser } from "@/lib/auth";
import { paymentForReference, paymentOptions } from "@/lib/payments";
import { convenienceFee, refundBreakdown, TICKET_AFTER_HOURS, upiLink } from "@/lib/payments-core";
import { privateMetadata } from "@/lib/seo";
import { qrSvg } from "@/lib/qr";

export const metadata: Metadata = privateMetadata("Pay for your request");
export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/pay/${reference}`)}`);
  const found = await paymentForReference(reference.toUpperCase(), user);
  if (!found) notFound();
  const { payment, request } = found;
  const options = paymentOptions();
  const upi = options.upi ? upiLink({ vpa: options.upi.vpa, name: options.upi.name, amountPaise: payment.amountPaise, note: payment.reference }) : null;
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
        paidVia={payment.method} upi={upi} qr={upi ? qrSvg(upi, { size: 220 }) : null} vpa={options.upi?.vpa ?? null}
        failureReason={payment.failureReason} ticketRaised={Boolean(payment.issueRaisedAt)} ticketOpen={ticketOpen} refundStatus={payment.refundStatus} refundChoice={payment.refundChoice} refundPaise={payment.refundPaise} estimates={estimates}
        razorpay={options.razorpay} cashfree={options.cashfree} feePercent={options.feePercent}/>
      <p className="legal-updated">Questions? See <Link href="/refund-policy">refunds</Link> or call us from the <Link href="/contact">contact page</Link>.</p>
    </section>
  </main>;
}
