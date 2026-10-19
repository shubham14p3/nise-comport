import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal-page";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata("Refund & Cancellation Policy", "When you can cancel a NISE COMPORT request, which charges are refundable, how refunds are calculated and paid, and how to raise a payment issue.", "/refund-policy");

export default function RefundPolicyPage() {
  const phone = site.phones.primary.display;
  return <LegalPage path="/refund-policy" crumb="Refund & Cancellation Policy" eyebrow="CANCELLATIONS AND REFUNDS" title="Refund & cancellation" em="policy." updated="October 2026"
    intro={<p>This policy explains how you can cancel a request, when a refund is possible, how it is calculated and how long it takes. It forms part of our <Link href="/terms">Terms and Conditions</Link>. It does not take away any right you have as a consumer under Indian law.</p>}
    sections={[
      { id: "charges", title: "What this policy covers", body: <>
        <p>A request can include separate amounts: our <b>service charge</b>; <b>government, portal, bank, insurer, courier or other third-party fees</b> paid to those organisations; and any <b>online payment fee</b> added when you pay through a payment gateway. This policy covers our service charge and the payment fee as described below. Third-party fees follow the rules of the organisation that collected them, and once paid to them we usually cannot recover them.</p></> },
      { id: "cancelling", title: "Cancelling a request", body: <>
        <ul>
          <li>While a request is <b>submitted, under review or waiting for you</b>, you can cancel it from your profile with &ldquo;Cancel this request&rdquo;.</li>
          <li>After work has started, call or WhatsApp us on {phone}. We will tell you what has already been done and what can still be stopped.</li>
          <li>Print and photo orders can be cancelled before printing begins. Custom or already printed items cannot be cancelled.</li>
          <li>Products and hardware: cancel before we order, reserve or hand over the item. Items already supplied follow the manufacturer&rsquo;s warranty and return terms.</li>
          <li>We may cancel a request if we cannot do it, if documents are not provided in reasonable time, or if it appears unlawful. We will tell you, and refund as set out below.</li>
        </ul></> },
      { id: "eligible", title: "When you can get a refund", body: <>
        <ul>
          <li>You cancel <b>before we start work</b> on a request you have paid for.</li>
          <li>We cannot carry out the service (for example the portal is unavailable for a long period, or you are not eligible for the route requested).</li>
          <li>You were charged <b>twice</b> for the same request, or <b>more than the amount confirmed</b> to you. The extra amount is refunded.</li>
          <li>A print order has a fault that is ours (wrong pages, unreadable print). We reprint, or refund that order.</li>
          <li>Your payment was taken but the request could not be marked as paid. See &ldquo;Failed or pending payments&rdquo;.</li>
        </ul></> },
      { id: "not-eligible", title: "When a refund is not available", body: <>
        <ul>
          <li>The application has been <b>submitted</b> or the work has been done as you requested. Service charges for completed work are generally non-refundable.</li>
          <li>The application is rejected, delayed or changed by a department, bank, insurer or provider. We do not control those decisions and cannot guarantee approval.</li>
          <li>The details or documents you gave were wrong, incomplete or not genuine. Corrections or re-filing may involve a new service charge.</li>
          <li>Government, portal, bank, insurer, courier or other third-party fees already paid to them.</li>
          <li>You changed your mind after the work or print was completed as approved by you.</li>
          <li>Offers, coupons and wallet credit, which have no cash value, except as returned under this policy.</li>
        </ul></> },
      { id: "amounts", title: "How refunds are calculated", body: <>
        <p>Depending on the case and the option you choose, the refund is worked out as follows. The exact amounts are shown on your payment page before you confirm a refund.</p>
        <ul>
          <li><b>To your wallet (account credit):</b> the amount paid for our service is credited in full, <b>plus a 5% bonus</b> that can be used on future requests.</li>
          <li><b>To your bank account or in cash:</b> the amount is refunded <b>after deducting</b> the payment gateway&rsquo;s commission and the tax charged on it, and a reasonable service charge for work already done.</li>
          <li><b>Where the refund is due to our error</b> (double charge, our print fault, or we cannot do the service), no deduction is made for the part that is our fault.</li>
        </ul>
        <p>We do not charge GST separately unless we are registered and tell you so. Refunds of third-party fees depend on the organisation that holds them; where they refund us, we pass it on to you.</p></> },
      { id: "timing", title: "How and when refunds are paid", body: <>
        <p>Refunds for online payments are sent to the original payment method after we approve them. Banks and card networks usually take <b>5 to 7 working days</b> to show the money. UPI and cash payments are refunded by bank or UPI transfer or in cash, as you prefer, usually within 7 working days of approval. Wallet credit is added immediately on approval.</p>
        <p>Delays by banks or payment partners are outside our control. Keep your payment reference handy if you need to ask your bank.</p></> },
      { id: "failed", title: "Failed or pending payments", body: <>
        <p>If money was deducted but your payment shows as failed or pending, please wait <b>24 hours</b>. Banks often reverse such amounts on their own. If it is still unresolved after 24 hours, open the payment page for your request and raise a ticket; we will check with the payment provider and either confirm the payment or refund it. Please keep your bank message or UPI reference number.</p>
        <p>Payments that cannot be matched to a genuine transaction (for example a wrong or reused reference number) cannot be confirmed.</p></> },
      { id: "ask", title: "How to ask for a refund", body: <>
        <p>Use the refund option on your request&rsquo;s payment page, or call / WhatsApp {phone}, or email <a href={`mailto:${site.email}`}>{site.email}</a> with your request reference and a short note. We reply within 2 working days. We may ask for proof of payment. Refund requests should be made within <b>30 days</b> of payment, unless the law allows longer.</p></> },
      { id: "disputes", title: "Disputes", body: <>
        <p>If you disagree with a decision, write to our Grievance Officer at <a href={`mailto:${site.email}`}>{site.email}</a>. We acknowledge within 48 hours and aim to resolve within one month. Your right to approach the consumer commission or any other authority is not affected. Disputes are governed by the laws of India and the courts at Jamshedpur, Jharkhand, subject to your consumer rights.</p></> },
    ]}/>;
}
