import type { Metadata } from "next";
import { BlogIndexView } from "@/components/views/blog-view";
import { pageMetadata } from "@/lib/seo";
import { languageAlternates } from "@/lib/tr";

export const metadata: Metadata = pageMetadata(
  "Local Guides: PAN, Aadhaar, Certificates & More",
  "Plain-language guides for Jamshedpur residents: PAN, Aadhaar updates, Jharkhand certificates, voter ID, scholarships, driving licence, AEPS safety and printing.",
  "/blog",
  { languages: languageAlternates("/blog") },
);

export default function BlogPage() { return <BlogIndexView lang="en"/>; }
