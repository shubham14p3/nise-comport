import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PricingView } from "@/components/views/pricing-view";
import { localizedMetadata } from "@/lib/localized-meta";
import { langFromParam } from "@/lib/tr";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = langFromParam((await params).lang);
  if (!lang) return {};
  return localizedMetadata(lang, "/pricing",
    { hi: "मूल्य और सेवा शुल्क", bn: "মূল্য ও সার্ভিস চার্জ" },
    { hi: "NiSE COMPORT शुल्क कैसे लेता है: प्रिंटिंग की दरें, काम शुरू होने से पहले पक्का किया गया सेवा शुल्क, और सरकारी शुल्क अलग कैसे दिखाए जाते हैं।", bn: "NiSE COMPORT কীভাবে চার্জ নেয়: প্রিন্টিংয়ের দর, কাজ শুরুর আগে নিশ্চিত করা সার্ভিস চার্জ, এবং সরকারি ফি আলাদা কীভাবে দেখানো হয়।" });
}

export default async function LocalizedPricingPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = langFromParam((await params).lang);
  if (!lang) notFound();
  return <PricingView lang={lang}/>;
}
