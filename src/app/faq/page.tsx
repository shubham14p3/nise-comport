import type { Metadata } from "next";
import { FaqView } from "@/components/views/faq-view";
import { pageMetadata } from "@/lib/seo";
import { languageAlternates } from "@/lib/tr";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata(
  "FAQs: Services, Fees, Tracking, Documents & Privacy",
  "Search answers about NISE COMPORT services in Telco, Jamshedpur: PAN, Aadhaar, certificates, voter ID, passport, driving licence, banking, insurance, printing, fees, tracking and privacy.",
  "/faq",
  { languages: languageAlternates("/faq") },
);

export default function FaqPage() { return <FaqView lang="en"/>; }
