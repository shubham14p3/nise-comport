import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InsuranceView } from "@/components/views/insurance-view";
import { localizedMetadata } from "@/lib/localized-meta";
import type { InsurancePurpose } from "@/lib/motor-insurance";
import { langFromParam } from "@/lib/tr";

export const revalidate = 3600;

type Search = Promise<Record<string, string | string[] | undefined>>;
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = langFromParam((await params).lang);
  if (!lang) return {};
  return localizedMetadata(lang, "/insurance",
    { hi: "कार और बाइक बीमा: नई पॉलिसी, नवीनीकरण और क्लेम, जमशेदपुर", bn: "গাড়ি ও বাইক বিমা: নতুন পলিসি, নবীকরণ ও ক্লেম, জামশেদপুর" },
    { hi: "NISE COMPORT, टेल्को, जमशेदपुर में कार और बाइक बीमा के कोटेशन की तुलना कीजिए, समाप्ति से पहले नवीनीकरण कराइए, समाप्त पॉलिसी का नवीनीकरण कराइए या क्लेम में मदद लीजिए। NCB, IDV और ऐड-ऑन समझाए गए हैं।", bn: "NISE COMPORT, টেলকো, জামশেদপুরে গাড়ি ও বাইক বিমার কোটেশন তুলনা করুন, মেয়াদ শেষের আগে নবীকরণ করান, মেয়াদোত্তীর্ণ পলিসি নবীকরণ করান বা ক্লেমে সাহায্য নিন। NCB, IDV ও অ্যাড-অন বোঝানো হয়েছে।" });
}

export default async function LocalizedInsurancePage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Search }) {
  const lang = langFromParam((await params).lang);
  if (!lang) notFound();
  const query = await searchParams;
  const purpose = (["new", "renew", "expired", "claim"] as const).find((item) => item === one(query.need)) as InsurancePurpose | undefined;
  const vehicle = one(query.vehicle) === "car" ? "car" : one(query.vehicle) === "bike" ? "bike" : undefined;
  return <InsuranceView lang={lang} purpose={purpose} vehicle={vehicle}/>;
}
