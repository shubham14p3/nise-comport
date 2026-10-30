import type { Metadata } from "next";
import LegalPage from "@/components/legal-page";
import { pageMetadata } from "@/lib/seo";
import { languageAlternates } from "@/lib/tr";

export const metadata: Metadata = pageMetadata("Privacy Policy", "How NiSE COMPORT collects, uses, shares, stores and deletes your personal information and documents, how we keep them safe, and your rights under Indian law.", "/privacy", { languages: languageAlternates("/privacy") });

/** Text is edited in Admin → Legal pages; the effective month is refreshed hourly. */
export const revalidate = 3600;

export default function PrivacyPage() {
  return <LegalPage slug="privacy" path="/privacy" crumb="Privacy Policy" eyebrow="YOUR INFORMATION DESERVES CARE" title="Privacy" em="Policy."/>;
}
