import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Refund & Cancellation Policy",
  "When you can cancel a NISE COMPORT request, which charges are refundable, how refunds are paid and how to ask for one.",
  "/refund-policy",
);

export default function RefundPolicyPage() {
  return <main className="content-page"><SiteHeader/>
    <article className="container legal-content">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Refund & cancellation", path: "/refund-policy" }]}/>
      <Link href="/" className="back-small"><ArrowLeft size={14}/> Home</Link>
      <span className="eyebrow eyebrow-muted">CLEAR RULES, NO SURPRISES</span>
      <h1>Refund &amp; cancellation <em>policy.</em></h1>
      <p className="legal-updated">Effective date: October 2026</p>

      <h2>Two kinds of charges</h2>
      <p>Every request can include two separate amounts. Our <b>service charge</b> is what NISE COMPORT charges for its assistance. <b>Government, portal, bank, insurer or other third-party fees</b> are paid to those organisations. This policy covers our service charge. Third-party fees follow the rules of the organisation that collected them.</p>

      <h2>Cancelling a request</h2>
      <ul>
        <li>You can cancel a request yourself while it is <b>submitted, being reviewed or waiting for you</b>: open it in your profile and choose “Cancel this request”.</li>
        <li>After work has started on the application, call or WhatsApp us on {site.phones.primary.display}. We will tell you what has already been done.</li>
        <li>Print orders can be cancelled before printing begins.</li>
      </ul>

      <h2>When you get a refund</h2>
      <ul>
        <li>You cancel before we have started work: the service charge is refunded in full.</li>
        <li>We cannot carry out the service you asked for (for example the portal is unavailable for a long period, or we find you are not eligible for the route requested): the service charge is refunded in full.</li>
        <li>You were charged twice for the same request, or charged more than the amount we confirmed: the extra amount is refunded.</li>
        <li>A print order has a fault that is ours (wrong pages, unreadable print): we reprint, or refund that order.</li>
      </ul>

      <h2>When a refund is not available</h2>
      <ul>
        <li>The application has been submitted or the work has been completed as requested. Completed service charges are generally non-refundable.</li>
        <li>The application is rejected, delayed or changed by the government department or provider. We do not control those decisions and cannot guarantee approval.</li>
        <li>The details or documents you gave us were wrong or incomplete. Corrections and re-filing may involve a new service charge.</li>
        <li>Government, portal, bank or insurer fees that have already been paid to them.</li>
      </ul>

      <h2>How refunds are paid</h2>
      <p>Refunds for online payments go back to the original payment method once we approve them. Banks usually take <b>5 to 7 working days</b> to show the money. Cash paid at the desk is refunded in cash or by bank transfer, whichever you prefer. Promo codes and wallet credit used on a cancelled request are returned to your account where the offer is still valid.</p>

      <h2>How to ask for a refund</h2>
      <p>Call or WhatsApp {site.phones.primary.display}, or email <a href={`mailto:${site.email}`}>{site.email}</a> with your request reference and a short note. We reply within 2 working days.</p>

      <p className="legal-updated">See also our <Link href="/terms">Terms of service</Link>, <Link href="/privacy">Privacy policy</Link> and <Link href="/pricing">Pricing</Link>.</p>
    </article>
  </main>;
}
