/**
 * schema.org JSON-LD builders. Every value here must match what is visible on the page
 * and in the Google Business Profile; Google ignores (or penalises) markup that doesn't.
 */
import { toOpeningHoursSpecification } from "./hours.ts";
import { absoluteUrl, site } from "./site.ts";

export const BUSINESS_ID = `${site.url}/#business`;
export const ORGANIZATION_ID = `${site.url}/#organization`;
export const WEBSITE_ID = `${site.url}/#website`;

type Json = Record<string, unknown>;

/** Serialises JSON-LD safely for a <script> tag (prevents "</script>" breaking out). */
export function serializeJsonLd(data: unknown) {
  const lineSeparator = String.fromCharCode(0x2028);
  const paragraphSeparator = String.fromCharCode(0x2029);
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .split(lineSeparator).join("\\u2028")
    .split(paragraphSeparator).join("\\u2029");
}

function postalAddress(): Json {
  return {
    "@type": "PostalAddress",
    streetAddress: `${site.address.street}, ${site.address.locality}`,
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    postalCode: site.address.postalCode,
    addressCountry: site.address.country,
  };
}

export function organizationLd(): Json {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: site.name,
    alternateName: site.alternateNames,
    url: site.url,
    logo: { "@type": "ImageObject", url: absoluteUrl(site.logoPath), width: 512, height: 512 },
    email: site.email,
    telephone: site.phones.primary.e164,
    address: postalAddress(),
    ...(site.sameAs.length ? { sameAs: site.sameAs } : {}),
    ...(site.foundingYear ? { foundingDate: String(site.foundingYear) } : {}),
    contactPoint: [
      { "@type": "ContactPoint", telephone: site.phones.primary.e164, contactType: "customer service", areaServed: "IN", availableLanguage: ["English", "Hindi"] },
      { "@type": "ContactPoint", telephone: site.phones.secondary.e164, contactType: "customer service", areaServed: "IN", availableLanguage: ["English", "Hindi"] },
    ],
  };
}

export function localBusinessLd(services: { name: string; path: string }[] = []): Json {
  const hours = toOpeningHoursSpecification(site.openingHours);
  return {
    "@type": ["LocalBusiness", "ProfessionalService"],
    "@id": BUSINESS_ID,
    name: site.name,
    alternateName: site.alternateNames,
    description: site.description,
    url: site.url,
    image: [absoluteUrl(site.defaultOgImage), absoluteUrl(site.logoPath)],
    logo: absoluteUrl(site.logoPath),
    telephone: site.phones.primary.e164,
    email: site.email,
    priceRange: "₹",
    currenciesAccepted: "INR",
    address: postalAddress(),
    ...(site.geo ? { geo: { "@type": "GeoCoordinates", latitude: site.geo.latitude, longitude: site.geo.longitude } } : {}),
    hasMap: site.mapsUrl,
    ...(hours.length ? { openingHoursSpecification: hours } : {}),
    areaServed: site.areasServed.map((name) => ({ "@type": name === "Jharkhand" ? "State" : name === "Jamshedpur" ? "City" : "Place", name })),
    knowsLanguage: ["en-IN", "hi-IN"],
    parentOrganization: { "@id": ORGANIZATION_ID },
    ...(site.sameAs.length ? { sameAs: site.sameAs } : {}),
    ...(services.length ? {
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Digital, CSC and document services",
        itemListElement: services.map((service) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: service.name, url: absoluteUrl(service.path), provider: { "@id": BUSINESS_ID } },
        })),
      },
    } : {}),
  };
}

export function websiteLd(): Json {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: site.url,
    name: site.name,
    alternateName: site.alternateNames,
    inLanguage: site.languages,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function graph(...nodes: Json[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

export type Crumb = { name: string; path: string };

export function breadcrumbLd(items: Crumb[]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) })),
  };
}

export function faqLd(faqs: { question: string; answer: string }[]): Json | null {
  const valid = faqs.filter((faq) => faq.question.trim() && faq.answer.trim());
  if (!valid.length) return null;
  return {
    "@type": "FAQPage",
    mainEntity: valid.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
  };
}

export function serviceLd(input: { name: string; description: string; path: string; serviceType?: string; category?: string; inLanguage?: string }): Json {
  return {
    "@type": "Service",
    "@id": `${absoluteUrl(input.path)}#service`,
    name: input.name,
    serviceType: input.serviceType ?? input.name,
    ...(input.category ? { category: input.category } : {}),
    description: input.description,
    url: absoluteUrl(input.path),
    inLanguage: input.inLanguage ?? "en-IN",
    provider: { "@id": BUSINESS_ID },
    areaServed: [{ "@type": "City", name: "Jamshedpur" }, { "@type": "State", name: "Jharkhand" }],
    availableChannel: {
      "@type": "ServiceChannel",
      serviceLocation: { "@type": "Place", name: site.name, address: postalAddress() },
      servicePhone: { "@type": "ContactPoint", telephone: site.phones.primary.e164 },
      serviceUrl: absoluteUrl(input.path),
    },
  };
}

export function articleLd(input: { title: string; description: string; path: string; image: string; publishedAt: string; updatedAt: string; author?: string; section?: string; inLanguage?: string }): Json {
  return {
    "@type": "Article",
    "@id": `${absoluteUrl(input.path)}#article`,
    headline: input.title.slice(0, 110),
    description: input.description,
    image: [absoluteUrl(input.image)],
    datePublished: input.publishedAt,
    dateModified: input.updatedAt,
    inLanguage: input.inLanguage ?? "en-IN",
    ...(input.section ? { articleSection: input.section } : {}),
    author: input.author ? { "@type": "Person", name: input.author, worksFor: { "@id": ORGANIZATION_ID } } : { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    mainEntityOfPage: absoluteUrl(input.path),
    about: { "@id": BUSINESS_ID },
  };
}

export function itemListLd(name: string, items: { name: string; path: string }[]): Json {
  return {
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, url: absoluteUrl(item.path) })),
  };
}

export function webPageLd(input: { name: string; description: string; path: string; type?: "WebPage" | "ContactPage" | "AboutPage" | "CollectionPage"; inLanguage?: string }): Json {
  return {
    "@type": input.type ?? "WebPage",
    "@id": `${absoluteUrl(input.path)}#webpage`,
    url: absoluteUrl(input.path),
    name: input.name,
    description: input.description,
    inLanguage: input.inLanguage ?? "en-IN",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": BUSINESS_ID },
  };
}
