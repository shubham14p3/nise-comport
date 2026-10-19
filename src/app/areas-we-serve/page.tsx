import type { Metadata } from "next";
import { AreasView } from "@/components/views/areas-view";
import { pageMetadata } from "@/lib/seo";
import { languageAlternates } from "@/lib/tr";

export const metadata: Metadata = pageMetadata(
  "Areas We Serve in Jamshedpur – Directions",
  "CSC and Pragya Kendra help near Kharangajhar, Telco, Govindpur, Birsanagar, Golmuri, Sakchi, Mango, Jugsalai, Bistupur, Sonari, Kadma and Adityapur. Directions from your area.",
  "/areas-we-serve",
  { languages: languageAlternates("/areas-we-serve") },
);

export default function AreasPage() { return <AreasView lang="en"/>; }
