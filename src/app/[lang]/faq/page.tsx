import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaqView } from "@/components/views/faq-view";
import { localizedMetadata } from "@/lib/localized-meta";
import { langFromParam } from "@/lib/tr";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = langFromParam((await params).lang);
  if (!lang) return {};
  return localizedMetadata(lang, "/faq",
    { hi: "सवाल-जवाब: सेवाएँ, शुल्क, ट्रैकिंग, दस्तावेज़ और गोपनीयता", bn: "প্রশ্নোত্তর: পরিষেবা, ফি, ট্র্যাকিং, নথি ও গোপনীয়তা" },
    { hi: "टेल्को, जमशेदपुर में NiSE COMPORT की सेवाओं के जवाब खोजिए: पैन, आधार, प्रमाण पत्र, वोटर आईडी, पासपोर्ट, ड्राइविंग लाइसेंस, बैंकिंग, बीमा, प्रिंटिंग, शुल्क, ट्रैकिंग और गोपनीयता।", bn: "টেলকো, জামশেদপুরে NiSE COMPORT-এর পরিষেবা নিয়ে উত্তর খুঁজুন: প্যান, আধার, সার্টিফিকেট, ভোটার আইডি, পাসপোর্ট, ড্রাইভিং লাইসেন্স, ব্যাংকিং, বিমা, প্রিন্টিং, ফি, ট্র্যাকিং ও গোপনীয়তা।" });
}

export default async function LocalizedFaqPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = langFromParam((await params).lang);
  if (!lang) notFound();
  return <FaqView lang={lang}/>;
}
