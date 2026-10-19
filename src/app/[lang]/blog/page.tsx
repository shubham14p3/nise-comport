import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIndexView } from "@/components/views/blog-view";
import { localizedMetadata } from "@/lib/localized-meta";
import { langFromParam } from "@/lib/tr";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = langFromParam((await params).lang);
  if (!lang) return {};
  return localizedMetadata(lang, "/blog",
    { hi: "स्थानीय गाइड: पैन, आधार, प्रमाण पत्र और बहुत कुछ", bn: "স্থানীয় গাইড: প্যান, আধার, সার্টিফিকেট ও আরও অনেক কিছু" },
    { hi: "जमशेदपुर के निवासियों के लिए सरल भाषा की गाइड: पैन, आधार अपडेट, झारखंड प्रमाण पत्र, वोटर आईडी, छात्रवृत्ति, ड्राइविंग लाइसेंस, AEPS सुरक्षा और प्रिंटिंग।", bn: "জামশেদপুরের বাসিন্দাদের জন্য সহজ ভাষার গাইড: প্যান, আধার আপডেট, ঝাড়খণ্ড সার্টিফিকেট, ভোটার আইডি, স্কলারশিপ, ড্রাইভিং লাইসেন্স, AEPS নিরাপত্তা ও প্রিন্টিং।" });
}

export default async function LocalizedBlogPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = langFromParam((await params).lang);
  if (!lang) notFound();
  return <BlogIndexView lang={lang}/>;
}
