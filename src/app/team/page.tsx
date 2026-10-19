import type { Metadata } from "next";
import { TeamView } from "@/components/views/team-view";
import { pageMetadata } from "@/lib/seo";
import { languageAlternates } from "@/lib/tr";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata("Our Team in Kharangajhar, Telco", "Meet the NISE COMPORT service desk team in Kharangajhar, Telco, Jamshedpur: the people who help with PAN, certificates, banking, forms and printing.", "/team", { languages: languageAlternates("/team") });

export default function TeamPage() { return <TeamView lang="en"/>; }
