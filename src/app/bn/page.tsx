import type { Metadata } from "next";
import JsonLd from "@/components/json-ld";
import { LocalizedHome } from "@/components/localized-pages";
import { bengaliHome, bengaliServices } from "@/lib/bengali";
import { pageMetadata } from "@/lib/seo";
import { itemListLd, webPageLd } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata(bengaliHome.seoTitle, bengaliHome.description, "/bn", { locale: "bn-IN", languages: { "en-IN": "/", "hi-IN": "/hi" }, keywords: ["জামশেদপুর প্রজ্ঞা কেন্দ্র", "টেলকো CSC সেন্টার", "জামশেদপুরে প্যান কার্ড", "আধার আপডেট জামশেদপুর", "আয় সার্টিফিকেট ঝাড়খণ্ড", "জাতি সার্টিফিকেট জামশেদপুর"] });

export default function BengaliHomePage() {
  return <>
    <JsonLd data={[webPageLd({ name: bengaliHome.h1, description: bengaliHome.description, path: "/bn", inLanguage: "bn-IN" }), itemListLd("NISE COMPORT পরিষেবা", bengaliServices.map((service) => ({ name: service.title, path: `/bn/services/${service.slug}` })))]}/>
    <LocalizedHome lang="bn" home={bengaliHome} services={bengaliServices}/>
  </>;
}
