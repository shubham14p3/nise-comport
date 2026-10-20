import type { Metadata } from "next";
import LegalPage from "@/components/legal-page";
import { pageMetadata } from "@/lib/seo";
import { languageAlternates } from "@/lib/tr";

export const metadata: Metadata = pageMetadata("Refund & Cancellation Policy", "When you can cancel a NISE COMPORT request, which charges are refundable, how refunds are calculated and paid, and how to raise a payment issue.", "/refund-policy", { languages: languageAlternates("/refund-policy") });

/** Text is edited in Admin → Legal pages; the effective month is refreshed hourly. */
export const revalidate = 3600;

export default function RefundPolicyPage() {
  return <LegalPage slug="refund-policy" path="/refund-policy" crumb="Refund & Cancellation Policy" eyebrow="CANCELLATIONS AND REFUNDS" title="Refund & cancellation" em="policy."/>;
}
