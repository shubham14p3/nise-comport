import type { Metadata, Viewport } from "next";
import "./globals.css";
import localFont from "next/font/local";
import JsonLd from "@/components/json-ld";
import SiteFooter from "@/components/site-footer";
import { site } from "@/lib/site";
import { graph, localBusinessLd, organizationLd, websiteLd } from "@/lib/structured-data";
import { publishedServiceDetails, serviceSeoTitle } from "@/lib/services";

const metropolis = localFont({ src: [{ path: "../../legacy/assets/fonts/metropolis/Metropolis-Regular.woff", weight: "400" }, { path: "../../legacy/assets/fonts/metropolis/Metropolis-Medium.woff", weight: "500" }, { path: "../../legacy/assets/fonts/metropolis/Metropolis-SemiBold.woff", weight: "600" }, { path: "../../legacy/assets/fonts/metropolis/Metropolis-Bold.woff", weight: "700" }, { path: "../../legacy/assets/fonts/metropolis/Metropolis-Black.woff", weight: "800" }], variable: "--font-metropolis", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "NISE COMPORT | CSC & Pragya Kendra in Telco, Jamshedpur", template: "%s | NISE COMPORT" },
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

export const viewport: Viewport = { themeColor: "#14271f", width: "device-width", initialScale: 1 };

const siteGraph = graph(
  organizationLd(),
  localBusinessLd(publishedServiceDetails.map((service) => ({ name: serviceSeoTitle(service), path: `/services/${service.slug}` }))),
  websiteLd(),
);

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-IN">
    <body className={metropolis.variable}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div id="main-content">{children}</div>
      <SiteFooter/>
      <JsonLd data={siteGraph["@graph"]}/>
    </body>
  </html>;
}
