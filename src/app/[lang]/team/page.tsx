import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TeamView } from "@/components/views/team-view";
import { localizedMetadata } from "@/lib/localized-meta";
import { langFromParam } from "@/lib/tr";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = langFromParam((await params).lang);
  if (!lang) return {};
  return localizedMetadata(lang, "/team",
    { hi: "हमारी टीम: खरंगाझार, टेल्को", bn: "আমাদের টিম: খরংগাঝাড়, টেলকো" },
    { hi: "खरंगाझार, टेल्को, जमशेदपुर में NISE COMPORT सर्विस डेस्क की टीम से मिलिए: वे लोग जो पैन, प्रमाण पत्र, बैंकिंग, फ़ॉर्म और प्रिंटिंग में मदद करते हैं।", bn: "খরংগাঝাড়, টেলকো, জামশেদপুরে NISE COMPORT সার্ভিস ডেস্কের টিমের সঙ্গে পরিচিত হন: যাঁরা প্যান, সার্টিফিকেট, ব্যাংকিং, ফর্ম ও প্রিন্টিংয়ে সাহায্য করেন।" });
}

export default async function LocalizedTeamPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = langFromParam((await params).lang);
  if (!lang) notFound();
  return <TeamView lang={lang}/>;
}
