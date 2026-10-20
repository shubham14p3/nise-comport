import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AreasView } from "@/components/views/areas-view";
import { localizedMetadata } from "@/lib/localized-meta";
import { langFromParam } from "@/lib/tr";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = langFromParam((await params).lang);
  if (!lang) return {};
  return localizedMetadata(lang, "/areas-we-serve",
    { hi: "जमशेदपुर में हम जहाँ सेवा देते हैं: रास्ता", bn: "জামশেদপুরে আমরা যেখানে পরিষেবা দিই: দিকনির্দেশ" },
    { hi: "खरंगाझार, टेल्को, गोविंदपुर, बिरसानगर, गोलमुरी, साकची, मानगो, जुगसलाई, बिष्टुपुर, सोनारी, कदमा और आदित्यपुर के पास CSC और प्रज्ञा केंद्र की मदद। आपके इलाके से रास्ता।", bn: "খরংগাঝাড়, টেলকো, গোবিন্দপুর, বিরসানগর, গোলমুরি, সাকচি, মানগো, জুগসালাই, বিষ্টুপুর, সোনারি, কদমা ও আদিত্যপুরের কাছে CSC ও প্রজ্ঞা কেন্দ্রের সাহায্য। আপনার এলাকা থেকে দিকনির্দেশ।" });
}

export default async function LocalizedAreasPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = langFromParam((await params).lang);
  if (!lang) notFound();
  return <AreasView lang={lang}/>;
}
