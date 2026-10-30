import type { Metadata } from "next";
import { PricingView } from "@/components/views/pricing-view";
import { pageMetadata } from "@/lib/seo";
import { languageAlternates } from "@/lib/tr";

export const metadata: Metadata = pageMetadata(
  "Pricing & Service Charges",
  "How NiSE COMPORT charges: printing rates, service charges confirmed before work starts, and how government fees are shown separately.",
  "/pricing",
  { languages: languageAlternates("/pricing") },
);

export const revalidate = 300;

export default function PricingPage() { return <PricingView lang="en"/>; }
