import type { Metadata } from "next";
import JsonLd from "@/components/json-ld";
import { LocalizedHome } from "@/components/localized-pages";
import { hindiHome, hindiServices } from "@/lib/hindi";
import { pageMetadata } from "@/lib/seo";
import { itemListLd, webPageLd } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata(hindiHome.seoTitle, hindiHome.description, "/hi", { locale: "hi-IN", languages: { "en-IN": "/", "bn-IN": "/bn" }, keywords: ["प्रज्ञा केंद्र जमशेदपुर", "सीएससी सेंटर टेल्को", "पैन कार्ड जमशेदपुर", "आधार अपडेट जमशेदपुर", "आय प्रमाण पत्र झारखंड", "जाति प्रमाण पत्र जमशेदपुर"] });

export default function HindiHomePage() {
  return <>
    <JsonLd data={[webPageLd({ name: hindiHome.h1, description: hindiHome.description, path: "/hi", inLanguage: "hi-IN" }), itemListLd("NISE COMPORT सेवाएँ", hindiServices.map((service) => ({ name: service.title, path: `/hi/services/${service.slug}` })))]}/>
    <LocalizedHome lang="hi" home={hindiHome} services={hindiServices}/>
  </>;
}
