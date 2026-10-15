import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/json-ld";
import { LocalizedService } from "@/components/localized-pages";
import { findHindiService, hindiServices } from "@/lib/hindi";
import { pageMetadata } from "@/lib/seo";
import { findService } from "@/lib/services";
import { serviceLd } from "@/lib/structured-data";
import { translatedSlugs } from "@/lib/translated-slugs";

export const dynamicParams = false;
export function generateStaticParams() { return hindiServices.filter((service) => findService(service.slug)).map((service) => ({ slug: service.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = findHindiService(slug);
  if (!service || !findService(slug)) return {};
  return pageMetadata(service.seoTitle, service.description, `/hi/services/${service.slug}`, { locale: "hi-IN", languages: { "en-IN": `/services/${service.slug}`, ...(translatedSlugs.bn.includes(service.slug) ? { "bn-IN": `/bn/services/${service.slug}` } : {}) } });
}

export default async function HindiServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = findHindiService(slug);
  if (!service || !findService(slug)) notFound();
  return <>
    <JsonLd data={serviceLd({ name: service.title, description: service.description, path: `/hi/services/${service.slug}`, inLanguage: "hi-IN" })}/>
    <LocalizedService lang="hi" service={service}/>
  </>;
}
