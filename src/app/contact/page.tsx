import type { Metadata } from "next";
import { ContactView } from "@/components/views/contact-view";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { languageAlternates } from "@/lib/tr";

export const metadata: Metadata = pageMetadata(
  "Contact & Directions – Kharangajhar, Telco",
  `Call ${site.phones.primary.display}, WhatsApp or visit NiSE COMPORT at Singh Building, Hanuman Mandir Road, Kharangajhar, Telco, Jamshedpur 831004. Hours and directions.`,
  "/contact",
  { languages: languageAlternates("/contact") },
);

export default function ContactPage() { return <ContactView lang="en"/>; }
