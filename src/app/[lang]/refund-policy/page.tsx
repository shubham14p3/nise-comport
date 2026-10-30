import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegalPage from "@/components/legal-page";
import { localizedMetadata } from "@/lib/localized-meta";
import { langFromParam } from "@/lib/tr";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = langFromParam((await params).lang);
  if (!lang) return {};
  return localizedMetadata(lang, "/refund-policy",
    { hi: "रिफ़ंड और रद्दीकरण नीति", bn: "রিফান্ড ও বাতিল নীতি" },
    { hi: "NiSE COMPORT का अनुरोध कब रद्द हो सकता है, कौन-से शुल्क लौटाए जाते हैं, रिफ़ंड कैसे गिना और दिया जाता है, और भुगतान की समस्या कैसे उठाएँ।", bn: "কখন NiSE COMPORT-এর অনুরোধ বাতিল করা যায়, কোন চার্জ ফেরতযোগ্য, রিফান্ড কীভাবে হিসাব ও দেওয়া হয়, এবং পেমেন্টের সমস্যা কীভাবে জানাবেন।" });
}

export default async function LocalizedRefundPolicyPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = langFromParam((await params).lang);
  if (!lang) notFound();
  const text = { hi: { crumb: "रिफ़ंड और रद्दीकरण नीति", eyebrow: "रद्दीकरण और रिफ़ंड", title: "रिफ़ंड और रद्दीकरण", em: "नीति।" }, bn: { crumb: "রিফান্ড ও বাতিল নীতি", eyebrow: "বাতিল ও রিফান্ড", title: "রিফান্ড ও বাতিল", em: "নীতি।" } }[lang];
  return <LegalPage lang={lang} slug="refund-policy" path="/refund-policy" {...text}/>;
}
