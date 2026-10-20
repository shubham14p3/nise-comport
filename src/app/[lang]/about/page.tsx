import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutView } from "@/components/views/about-view";
import { localizedMetadata } from "@/lib/localized-meta";
import { langFromParam } from "@/lib/tr";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = langFromParam((await params).lang);
  if (!lang) return {};
  return localizedMetadata(lang, "/about",
    { hi: "NISE COMPORT के बारे में: टेल्को, जमशेदपुर का CSC और प्रज्ञा केंद्र", bn: "NISE COMPORT সম্পর্কে: টেলকো, জামশেদপুরের CSC ও প্রজ্ঞা কেন্দ্র" },
    { hi: "1995 से NISE COMPORT जमशेदपुर के लोगों को पैन, आधार, प्रमाण पत्र, बैंकिंग, बीमा, प्रिंटिंग और कंप्यूटर की ज़रूरतों में मदद करता आ रहा है। खरंगाझार, टेल्को का स्वतंत्र CSC / प्रज्ञा केंद्र।", bn: "১৯৯৫ থেকে NISE COMPORT জামশেদপুরের মানুষকে প্যান, আধার, সার্টিফিকেট, ব্যাংকিং, বিমা, প্রিন্টিং ও কম্পিউটারের প্রয়োজনে সাহায্য করে আসছে। খরংগাঝাড়, টেলকোর স্বাধীন CSC / প্রজ্ঞা কেন্দ্র।" });
}

export default async function LocalizedAboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = langFromParam((await params).lang);
  if (!lang) notFound();
  return <AboutView lang={lang}/>;
}
