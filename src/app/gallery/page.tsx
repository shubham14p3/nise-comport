import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Images } from "lucide-react";
import { galleryItems } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
export const metadata:Metadata=pageMetadata("Gallery – Service Desk in Telco, Jamshedpur","Browse NISE COMPORT service explainers and community updates from our CSC / Pragya Kendra desk in Kharangajhar, Telco, Jamshedpur.","/gallery");
export default function GalleryPage(){return <main className="content-page"><SiteHeader/><section className="content-hero"><div className="container"><span className="eyebrow eyebrow-muted">OUR DESK, SERVICES &amp; UPDATES</span><h1>A look at what<br/><em>we help with.</em></h1><p>Explore NISE COMPORT service explainers and community artwork. For current eligibility, fees and availability, contact our Kharangajhar team.</p></div></section><section className="container gallery-grid">{galleryItems.map((item,index)=><figure className={`gallery-card gallery-${index%3}`} key={item.title}><Image src={item.image} alt={item.alt} width={900} height={640}/><figcaption><span>{item.category}</span><strong>{item.title}</strong></figcaption></figure>)}</section><section className="container provider-note"><Images size={18}/><p>These images are service information artwork. They do not represent live offers, government approval or guaranteed service availability.</p></section><div className="container gallery-cta"><Link className="button button-green" href="/services">Explore service pages <ArrowUpRight size={16}/></Link></div></main>}
