import type { Metadata } from "next";
import { InsuranceView } from "@/components/views/insurance-view";
import type { InsurancePurpose } from "@/lib/motor-insurance";
import { pageMetadata } from "@/lib/seo";
import { languageAlternates } from "@/lib/tr";

export const metadata: Metadata = pageMetadata(
  "Car & Bike Insurance – New, Renewal & Claims in Jamshedpur",
  "Compare car and bike insurance quotes, renew before expiry, renew an expired policy or get claim help at NISE COMPORT, Telco, Jamshedpur. NCB, IDV and add-ons explained.",
  "/insurance",
  { languages: languageAlternates("/insurance") },
);
export const revalidate = 3600;

type Search = Promise<Record<string, string | string[] | undefined>>;
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function InsurancePage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const purpose = (["new", "renew", "expired", "claim"] as const).find((item) => item === one(params.need)) as InsurancePurpose | undefined;
  const vehicle = one(params.vehicle) === "car" ? "car" : one(params.vehicle) === "bike" ? "bike" : undefined;
  return <InsuranceView lang="en" purpose={purpose} vehicle={vehicle}/>;
}
