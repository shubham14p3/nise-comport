import type { Metadata } from "next";
import { AboutView } from "@/components/views/about-view";
import { pageMetadata } from "@/lib/seo";
import { languageAlternates } from "@/lib/tr";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata(
  "About NiSE COMPORT – CSC & Pragya Kendra in Telco, Jamshedpur",
  "Since 1995, NiSE COMPORT has helped Jamshedpur residents with PAN, Aadhaar, certificates, banking, insurance, printing and computer needs. An independent CSC / Pragya Kendra service centre in Kharangajhar, Telco.",
  "/about",
  { languages: languageAlternates("/about") },
);

export default function AboutPage() { return <AboutView lang="en"/>; }
