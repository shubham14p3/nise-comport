import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} – CSC & Pragya Kendra, Jamshedpur`,
    short_name: site.name,
    description: site.shortDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#070b1f",
    theme_color: "#070b1f",
    lang: "en-IN",
    categories: ["government", "business", "utilities"],
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Start a request", url: "/request" },
      { name: "Services", url: "/services" },
      { name: "Print a document", url: "/print" },
      { name: "Track my request", url: "/profile#requests" },
    ],
  };
}
