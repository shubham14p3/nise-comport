import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegalPage from "@/components/legal-page";
import { localizedMetadata } from "@/lib/localized-meta";
import { langFromParam } from "@/lib/tr";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = langFromParam((await params).lang);
  if (!lang) return {};
  return localizedMetadata(lang, "/privacy",
    { hi: "गोपनीयता नीति", bn: "গোপনীয়তা নীতি" },
    { hi: "NISE COMPORT आपकी व्यक्तिगत जानकारी और दस्तावेज़ कैसे इकट्ठा, उपयोग, साझा, सहेजता और हटाता है, उन्हें कैसे सुरक्षित रखता है, और भारतीय कानून में आपके अधिकार।", bn: "NISE COMPORT কীভাবে আপনার ব্যক্তিগত তথ্য ও নথি সংগ্রহ, ব্যবহার, শেয়ার, সংরক্ষণ ও মুছে ফেলে, কীভাবে সুরক্ষিত রাখে, এবং ভারতীয় আইনে আপনার অধিকার।" });
}

export default async function LocalizedPrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = langFromParam((await params).lang);
  if (!lang) notFound();
  const text = { hi: { crumb: "गोपनीयता नीति", eyebrow: "आपकी जानकारी की देखभाल", title: "गोपनीयता", em: "नीति।" }, bn: { crumb: "গোপনীয়তা নীতি", eyebrow: "আপনার তথ্যের যত্ন", title: "গোপনীয়তা", em: "নীতি।" } }[lang];
  return <LegalPage lang={lang} slug="privacy" path="/privacy" {...text}/>;
}
