import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegalPage from "@/components/legal-page";
import { localizedMetadata } from "@/lib/localized-meta";
import { langFromParam } from "@/lib/tr";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = langFromParam((await params).lang);
  if (!lang) return {};
  return localizedMetadata(lang, "/terms",
    { hi: "नियम और शर्तें", bn: "নিয়ম ও শর্তাবলি" },
    { hi: "NISE COMPORT, जमशेदपुर के स्वतंत्र CSC / प्रज्ञा केंद्र, के उपयोग के नियम: हम क्या करते हैं, शुल्क, भुगतान, आपकी ज़िम्मेदारियाँ, दायित्व और विवाद कैसे सुलझते हैं।", bn: "জামশেদপুরের স্বাধীন CSC / প্রজ্ঞা কেন্দ্র NISE COMPORT ব্যবহারের শর্ত: আমরা কী করি, ফি, পেমেন্ট, আপনার দায়িত্ব, দায় এবং বিরোধ কীভাবে মেটে।" });
}

export default async function LocalizedTermsPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = langFromParam((await params).lang);
  if (!lang) notFound();
  const text = { hi: { crumb: "नियम और शर्तें", eyebrow: "हमारी सेवाओं से पहले पढ़ें", title: "नियम और", em: "शर्तें।" }, bn: { crumb: "নিয়ম ও শর্তাবলি", eyebrow: "আমাদের পরিষেবা ব্যবহারের আগে পড়ুন", title: "শর্তাবলি", em: "" } }[lang];
  return <LegalPage lang={lang} slug="terms" path="/terms" {...text}/>;
}
