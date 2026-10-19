import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import JsonLd from "@/components/json-ld";
import TeamGrid from "@/components/team-grid";
import { pageMetadata } from "@/lib/seo";
import { webPageLd } from "@/lib/structured-data";
import { publicTeam } from "@/lib/team";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata("Our Team in Kharangajhar, Telco", "Meet the NISE COMPORT service desk team in Kharangajhar, Telco, Jamshedpur: the people who help with PAN, certificates, banking, forms and printing.", "/team");

export default async function TeamPage() {
  const people = await publicTeam();
  return <main className="content-page"><SiteHeader/>
    <JsonLd data={webPageLd({ name: "The NISE COMPORT team", description: "The people at the NISE COMPORT service desk in Kharangajhar, Telco, Jamshedpur.", path: "/team" })}/>
    <section className="content-hero team-hero"><span className="team-hero__orb team-hero__orb--a" aria-hidden="true"/><span className="team-hero__orb team-hero__orb--b" aria-hidden="true"/><div className="container">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Our team", path: "/team" }]}/>
      <span className="eyebrow eyebrow-muted">A LOCAL TEAM YOU CAN REACH</span>
      <h1>People who help<br/><em>get things moving.</em></h1>
      <p>NISE COMPORT is rooted in the Kharangajhar neighbourhood of Telco, Jamshedpur. Our team helps customers with everyday digital and government services, with clear steps and in-person support.</p>
      <div className="content-location"><MapPin size={15}/> Kharangajhar, Telco, Jamshedpur, Jharkhand 831004</div>
    </div></section>
    <section className="container team-section"><TeamGrid people={people}/></section>
    <section className="container provider-note"><p>Our staff guide you through applications and requests. They do not decide government approvals, insurance eligibility or third-party processing.</p><Link className="arrow-link" href="/contact">Contact the service desk <ArrowUpRight size={15}/></Link></section>
  </main>;
}
