import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedServicesIndex } from "@/components/localized-services";
import { pageMetadata } from "@/lib/seo";
import { langFromParam, languageAlternates, tr } from "@/lib/tr";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = langFromParam((await params).lang);
  if (!lang) return {};
  const t = tr(lang);
  return pageMetadata(
    t("All services", "सभी सेवाएँ, जमशेदपुर", "সব পরিষেবা, জামশেদপুর"),
    t("", "पैन, आधार मार्गदर्शन, झारखंड के प्रमाण पत्र, AEPS बैंकिंग, बीमा, छात्र फ़ॉर्म, वेबसाइट, प्रिंटिंग और पीसी मरम्मत में मदद: NiSE COMPORT, खरंगाझार, टेल्को।", "প্যান, আধার সহায়তা, ঝাড়খণ্ডের সার্টিফিকেট, AEPS ব্যাংকিং, বিমা, ছাত্রছাত্রীদের ফর্ম, ওয়েবসাইট, প্রিন্টিং ও পিসি মেরামতে সাহায্য: NiSE COMPORT, খরংগাঝাড়, টেলকো।"),
    `/${lang}/services`,
    { locale: lang === "hi" ? "hi-IN" : "bn-IN", languages: languageAlternates("/services") },
  );
}

export default async function LocalizedServicesPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = langFromParam((await params).lang);
  if (!lang) notFound();
  return <LocalizedServicesIndex lang={lang}/>;
}
