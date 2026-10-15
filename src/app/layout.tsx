import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Hind_Siliguri, Poppins } from "next/font/google";
import ChatWidget from "@/components/chat-widget";
import JsonLd from "@/components/json-ld";
import MobileDock from "@/components/mobile-dock";
import OffersProvider from "@/components/offers-provider";
import SiteFooter from "@/components/site-footer";
import { getLivePromos } from "@/lib/promotions";
import { site } from "@/lib/site";
import { graph, localBusinessLd, organizationLd, websiteLd } from "@/lib/structured-data";
import { publishedServiceDetails, serviceSeoTitle } from "@/lib/services";
import { allServices } from "@/lib/site-content";
import SiteBanners from "@/components/site-banners";

/** Poppins covers English and Hindi (Devanagari); Hind Siliguri, from the same type foundry, covers Bengali. */
const poppins = Poppins({ subsets: ["latin", "devanagari"], weight: ["400", "500", "600", "700", "800"], variable: "--font-poppins", display: "swap" });
const hindSiliguri = Hind_Siliguri({ subsets: ["bengali"], weight: ["400", "500", "600", "700"], variable: "--font-bengali", display: "swap", preload: false });

/** Small search index for the chat assistant (titles and keywords only). */

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "NISE COMPORT - Pragya Kendra - CSC & Digital Services in Telco, Jamshedpur", template: "NISE COMPORT - Pragya Kendra - %s" },
  description: "Independent CSC and Pragya Kendra in Kharangajhar, Telco, Jamshedpur: PAN, Aadhaar guidance, Jharkhand certificates, banking, insurance, forms, bill payments and printing.",
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  category: "Government & citizen services",
  formatDetection: { telephone: true, address: true, email: true },
  openGraph: { type: "website", locale: "en_IN", siteName: site.name, images: [{ url: site.defaultOgImage, width: 1200, height: 630, alt: "NISE COMPORT – CSC & Pragya Kendra, Kharangajhar, Telco, Jamshedpur" }] },
  twitter: { card: "summary_large_image", images: [site.defaultOgImage] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  verification: {
    ...(site.verification.google ? { google: site.verification.google } : {}),
    ...(site.verification.yandex ? { yandex: site.verification.yandex } : {}),
    ...(site.verification.bing ? { other: { "msvalidate.01": site.verification.bing } } : {}),
  },
  alternates: { types: { "application/rss+xml": [{ url: "/blog/feed.xml", title: "NISE COMPORT local guides" }] } },
  other: {
    "geo.region": "IN-JH",
    "geo.placename": "Jamshedpur",
    ...(site.geo ? { "geo.position": `${site.geo.latitude};${site.geo.longitude}`, ICBM: `${site.geo.latitude}, ${site.geo.longitude}` } : {}),
  },
};

/** Festival and sports codes change daily, so every page is refreshed at least hourly. */
export const revalidate = 3600;

export const viewport: Viewport = { themeColor: "#070b1f", width: "device-width", initialScale: 1, viewportFit: "cover" };

const siteGraph = graph(
  organizationLd(),
  localBusinessLd(publishedServiceDetails.map((service) => ({ name: serviceSeoTitle(service), path: `/services/${service.slug}` }))),
  websiteLd(),
);

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Live festival / sports codes for the ticker, offer rails and chat (cached; falls back to the checked dates).
  const [promos, services] = await Promise.all([getLivePromos(), allServices()]);
  const chatServices = services.map((service) => ({ slug: service.slug, title: service.title, category: service.categorySlug, keywords: service.keywords }));
  return <html lang="en-IN">
    <body className={`${poppins.variable} ${hindSiliguri.variable}`}>
      <OffersProvider promos={promos}>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteBanners placement="strip"/>
        <div id="main-content">{children}</div>
        <SiteFooter/>
        <MobileDock/>
        <ChatWidget whatsapp={site.whatsapp.primary} phone={site.phones.primary.e164} mapsUrl={site.mapsUrl} hours={site.openingHours} services={chatServices}/>
      </OffersProvider>
      <JsonLd data={siteGraph["@graph"]}/>
    </body>
  </html>;
}
