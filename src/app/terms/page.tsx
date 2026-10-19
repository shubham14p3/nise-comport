import type { Metadata } from "next";
import LegalPage from "@/components/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("Terms and Conditions", "The terms for using NISE COMPORT, an independent CSC / Pragya Kendra service centre in Jamshedpur: what we do, fees, payments, your responsibilities, liability and how disputes are handled.", "/terms");

/** Text is edited in Admin → Legal pages; the effective month is refreshed hourly. */
export const revalidate = 3600;

export default function TermsPage() {
  return <LegalPage slug="terms" path="/terms" crumb="Terms and Conditions" eyebrow="PLEASE READ BEFORE USING OUR SERVICES" title="Terms and" em="Conditions."/>;
}
