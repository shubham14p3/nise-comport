/**
 * Permanent redirects from the old React (Vite) website URLs to the new Next.js pages.
 * Google has already crawled the old URLs; a 301/308 passes their ranking signals to the
 * new page instead of losing them to a 404. Used by next.config.ts. Only relative imports so it can be tested.
 *
 * Old slugs were produced by the legacy slugify(title) helper, e.g. "Voter ID / EPIC" -> "voter-id-epic".
 */
import { SERVICE_SLUG_RENAMES } from "./slug-renames.ts";
import { translatedSlugs } from "./translated-slugs.ts";

export type LegacyRedirect = { source: string; destination: string; permanent: true };

const serviceDetails: Record<string, string> = {
  banking: "/services/banking",
  government: "/services/government-services",
  insurance: "/services/insurance",
  education: "/services/education",
  website: "/services/website-design",
  "form-filing": "/services/form-filing",
  "it-sales-service": "/services/it-services",
  "it-sales--service": "/services/it-services",
  travel: "/services/travel",
};

const blogDetails: Record<string, string> = {
  "aadhaar-demographic-update": "/blog/aadhaar-update-help-jamshedpur",
  "pan-card-service": "/blog/pan-card-application-and-correction-jamshedpur",
  "indian-passport": "/blog/passport-driving-licence-application-help",
  "voter-id-epic": "/blog/voter-registration-correction-jharkhand",
  "life-certificate-jeevan-praman-live": "/blog/life-certificate-jeevan-pramaan-help",
  "ews-certificate": "/services/income-caste-residence-certificate",
  "bike-car-insurance": "/blog/bike-insurance-renewal-jamshedpur",
  "driving-license-only-for-jharkhand": "/blog/learner-driving-licence-jharkhand-sarathi",
  "voter-new-apply-correction": "/blog/voter-registration-correction-jharkhand",
  "pvc-print-2021": "/blog/aadhaar-pvc-card-order-guide",
  "income-certificate": "/blog/income-certificate-jharkhand-application",
};

/** The legacy blog JSON also used numeric ids (1-11) in the same order. */
const blogIds = [
  "aadhaar-demographic-update", "pan-card-service", "indian-passport", "voter-id-epic", "life-certificate-jeevan-praman-live",
  "ews-certificate", "bike-car-insurance", "driving-license-only-for-jharkhand", "voter-new-apply-correction", "pvc-print-2021", "income-certificate",
];

export function legacyRedirects(): LegacyRedirect[] {
  const list: LegacyRedirect[] = [
    { source: "/home", destination: "/", permanent: true },
    { source: "/index.html", destination: "/", permanent: true },
    { source: "/all-services", destination: "/services", permanent: true },
    { source: "/service", destination: "/services", permanent: true },
    { source: "/offer", destination: "/offers", permanent: true },
    { source: "/offer-left-sidebar", destination: "/offers", permanent: true },
    { source: "/offer-right-sidebar", destination: "/offers", permanent: true },
    { source: "/offer-details/:slug", destination: "/offers", permanent: true },
    { source: "/offer-category/:slug", destination: "/offers", permanent: true },
    { source: "/offer-date/:date", destination: "/offers", permanent: true },
    { source: "/offer-tag/:slug", destination: "/offers", permanent: true },
    { source: "/blog-left-sidebar", destination: "/blog", permanent: true },
    { source: "/blog-right-sidebar", destination: "/blog", permanent: true },
    { source: "/author/:author", destination: "/blog", permanent: true },
    { source: "/date/:date", destination: "/blog", permanent: true },
    { source: "/tag/:slug", destination: "/blog", permanent: true },
    { source: "/category/:slug", destination: "/blog", permanent: true },
    { source: "/services/aadhaar-update-guidance", destination: "/services/aadhaar", permanent: true },
    { source: "/services/pan-card-application-jamshedpur", destination: "/services/pan-card", permanent: true },
    { source: "/aadhaar", destination: "/services/aadhaar", permanent: true },
    { source: "/areas", destination: "/areas-we-serve", permanent: true },
    { source: "/hindi", destination: "/hi", permanent: true },
  ];
  for (const [slug, destination] of Object.entries(serviceDetails)) list.push({ source: `/service-details/${slug}`, destination, permanent: true });
  list.push({ source: "/service-details/:slug", destination: "/services", permanent: true });
  for (const [slug, destination] of Object.entries(blogDetails)) list.push({ source: `/blog-details/${slug}`, destination, permanent: true });
  blogIds.forEach((slug, index) => list.push({ source: `/blog-details/${index + 1}`, destination: blogDetails[slug], permanent: true }));
  list.push({ source: "/blog-details/:slug", destination: "/blog", permanent: true });
  // Long service addresses used before the URLs were shortened.
  for (const [old, slug] of Object.entries(SERVICE_SLUG_RENAMES)) {
    list.push({ source: `/services/${old}`, destination: `/services/${slug}`, permanent: true });
    if (translatedSlugs.hi.includes(slug)) list.push({ source: `/hi/services/${old}`, destination: `/hi/services/${slug}`, permanent: true });
    if (translatedSlugs.bn.includes(slug)) list.push({ source: `/bn/services/${old}`, destination: `/bn/services/${slug}`, permanent: true });
  }
  return list;
}
