import type { Metadata } from "next";

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title, description, alternates: { canonical: path },
    openGraph: { type: "website", locale: "en_IN", siteName: "NISE COMPORT", title, description, url: path, images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "NISE COMPORT local digital service desk" }] },
    twitter: { card: "summary_large_image", title, description, images: ["/og-image.svg"] },
  };
}
