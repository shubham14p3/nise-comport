import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, MapPin } from "lucide-react";
import { teamMembers } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
export const metadata:Metadata=pageMetadata("Our Team in Kharangajhar, Telco","Meet the NISE COMPORT service desk team in Kharangajhar, Telco, Jamshedpur: the people who help with PAN, certificates, banking, forms and printing.","/team");
export default function TeamPage(){return <main className="content-page"><SiteHeader/><section className="content-hero"><div className="container"><span className="eyebrow eyebrow-muted">A LOCAL TEAM YOU CAN REACH</span><h1>People who help<br/><em>get things moving.</em></h1><p>NISE COMPORT is rooted in the Kharangajhar neighbourhood of Telco, Jamshedpur. Our team helps customers navigate everyday digital services with clear steps and in-person support.</p><div className="content-location"><MapPin size={15}/> Kharangajhar, Telco, Jamshedpur, Jharkhand 831004</div></div></section><section className="container team-grid">{teamMembers.map(person=><article className="team-card" key={person.name}><Image src={person.image} alt={person.name} width={420} height={480}/><div><h2>{person.name}</h2><p>{person.role}</p></div></article>)}</section><section className="container provider-note"><p>Service staff can guide applications and requests; they do not decide government approvals, insurance eligibility or third-party processing.</p><Link className="arrow-link" href="/contact">Contact the service desk <ArrowUpRight size={15}/></Link></section></main>}
