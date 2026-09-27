import type { Metadata, Viewport } from "next";
import "./globals.css";
import localFont from "next/font/local";

const metropolis = localFont({ src: [{ path: "../../legacy/assets/fonts/metropolis/Metropolis-Regular.woff", weight: "400" }, { path: "../../legacy/assets/fonts/metropolis/Metropolis-Medium.woff", weight: "500" }, { path: "../../legacy/assets/fonts/metropolis/Metropolis-SemiBold.woff", weight: "600" }, { path: "../../legacy/assets/fonts/metropolis/Metropolis-Bold.woff", weight: "700" }, { path: "../../legacy/assets/fonts/metropolis/Metropolis-Black.woff", weight: "800" }], variable: "--font-metropolis", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nisecomport.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "NISE COMPORT | Digital Services in Jamshedpur", template: "%s | NISE COMPORT" },
  description: "Trusted CSC and Pragya Kendra assistance in Kharangajhar, Jamshedpur for PAN, Aadhaar, certificates, banking, insurance, forms, bill payments and printing.",
  applicationName: "NISE COMPORT",
  alternates: { canonical: "/" },
  keywords: ["CSC service centre Jamshedpur", "Pragya Kendra Kharangajhar", "PAN card assistance", "Aadhaar services", "online form filling", "printing and scanning", "सीएससी सेवा केंद्र जमशेदपुर"],
  openGraph: { type: "website", locale: "en_IN", siteName: "NISE COMPORT", title: "NISE COMPORT | Digital Services in Jamshedpur", description: "Local help for government and digital services in Kharangajhar, Jamshedpur.", url: "/", images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "NISE COMPORT local digital service desk" }] },
  twitter: { card: "summary_large_image", title: "NISE COMPORT | Digital Services in Jamshedpur", description: "CSC and Pragya Kendra assistance in Jamshedpur.", images: ["/og-image.svg"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

export const viewport: Viewport = { themeColor: "#14271f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const localBusiness = {
    "@context": "https://schema.org", "@type": "ProfessionalService", name: "NISE COMPORT", url: siteUrl,
    description: "Independent CSC and Pragya Kendra assistance for digital and government-related services.",
    telephone: "+91-97712-19893", email: "support@nisecomport.com", priceRange: "₹",
    address: { "@type": "PostalAddress", streetAddress: "Shop No 3, Ground Floor, Singh Building, Hanuman Mandir Road, Kharangajhar, Telco", addressLocality: "Jamshedpur", addressRegion: "Jharkhand", postalCode: "831004", addressCountry: "IN" },
    areaServed: ["Kharangajhar", "Jamshedpur", "Jharkhand"],
  };
  return <html lang="en-IN"><body className={metropolis.variable}>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} /></body></html>;
}
