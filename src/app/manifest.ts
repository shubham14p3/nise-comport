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
    background_color: "#f7f5ed",
    theme_color: "#14271f",
    lang: "en-IN",
    categories: ["government", "business", "utilities"],
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon", purpose: "any" },
      { src: "/images/logo/logo-footer.png", sizes: "any", type: "image/png", purpose: "any" },
    ],
    shortcuts: [
      { name: "Services", url: "/services" },
      { name: "Print a document", url: "/print" },
      { name: "Track my request", url: "/profile?section=requests" },
    ],
  };
}
