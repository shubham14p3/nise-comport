import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/json-ld";
import { LocalizedService } from "@/components/localized-pages";
import { LocalizedCategory } from "@/components/localized-services";
import { categoryText } from "@/lib/translations/categories";
import { serviceCatalog } from "@/lib/services";
import { bengaliServices, findBengaliService } from "@/lib/bengali";
import { pageMetadata } from "@/lib/seo";
import { findService } from "@/lib/services";
import { serviceLd } from "@/lib/structured-data";

export const dynamicParams = false;
export function generateStaticParams() { return [...bengaliServices.filter((service) => findService(service.slug)).map((service) => ({ slug: service.slug })), ...serviceCatalog.map((group) => ({ slug: group.slug }))]; }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const group = serviceCatalog.find((item) => item.slug === slug);
  if (group) { const text = categoryText(group.slug, group, "bn"); return pageMetadata(text.title, text.description, `/bn/services/${slug}`, { locale: "bn-IN", languages: { "en-IN": `/services/${slug}`, "hi-IN": `/hi/services/${slug}`, "bn-IN": `/bn/services/${slug}` } }); }
  const service = findBengaliService(slug);
  if (!service || !findService(slug)) return {};
  return pageMetadata(service.seoTitle, service.description, `/bn/services/${service.slug}`, { locale: "bn-IN", languages: { "en-IN": `/services/${service.slug}`, "hi-IN": `/hi/services/${service.slug}` } });
}

export default async function BengaliServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (serviceCatalog.some((item) => item.slug === slug)) return <LocalizedCategory lang="bn" slug={slug}/>;
  const service = findBengaliService(slug);
  if (!service || !findService(slug)) notFound();
  return <>
    <JsonLd data={serviceLd({ name: service.title, description: service.description, path: `/bn/services/${service.slug}`, inLanguage: "bn-IN" })}/>
    <LocalizedService lang="bn" service={service}/>
  </>;
}
