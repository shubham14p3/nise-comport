import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MapPin, Navigation } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import JsonLd from "@/components/json-ld";
import SiteHeader from "@/components/site-header";
import { areas } from "@/lib/areas";
import { pageMetadata } from "@/lib/seo";
import { directionsFrom, site } from "@/lib/site";
import { webPageLd } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata(
  "Areas We Serve in Jamshedpur – Directions",
  "CSC and Pragya Kendra help near Kharangajhar, Telco, Govindpur, Birsanagar, Golmuri, Sakchi, Mango, Jugsalai, Bistupur, Sonari, Kadma and Adityapur. Directions from your area.",
  "/areas-we-serve",
);

const popular = [
  { href: "/services/pan-card-jamshedpur", label: "PAN card" },
  { href: "/services/aadhaar-assistance-jamshedpur", label: "Aadhaar update help" },
  { href: "/services/jharkhand-certificates-jamshedpur", label: "Income, caste & residence certificates" },
  { href: "/services/banking-aeps-money-transfer", label: "AEPS & money transfer" },
  { href: "/services/printing-scanning-jamshedpur", label: "Printing & photocopy" },
];

export default function AreasPage() {
  return <main className="content-page"><SiteHeader/>
    <JsonLd data={webPageLd({ name: "Areas served by NISE COMPORT", description: "Neighbourhoods in Jamshedpur served by the NISE COMPORT CSC / Pragya Kendra desk in Kharangajhar, Telco.", path: "/areas-we-serve" })}/>
    <section className="content-hero"><div className="container">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Areas we serve", path: "/areas-we-serve" }]}/>
      <span className="eyebrow eyebrow-muted">ONE DESK · ALL OF JAMSHEDPUR</span>
      <h1>Areas we serve<br/><em>across Jamshedpur.</em></h1>
      <p>Our only service desk is in Kharangajhar, Telco. People visit us from across Jamshedpur and nearby Jharkhand. Pick your area to open directions in Google Maps, or send a request online first so we can confirm what to bring.</p>
      <div className="content-location"><MapPin size={15}/> {site.address.oneLine}</div>
    </div></section>
    <section className="container area-grid">
      {areas.map((area) => <article className="area-card" id={area.slug} key={area.slug}>
        <h2>{area.name} <span lang="hi">{area.hindi}</span></h2>
        <p>{area.note}</p>
        <a className="arrow-link" href={directionsFrom(area.name)} target="_blank" rel="noopener noreferrer"><Navigation size={14}/> Directions from {area.name}</a>
      </article>)}
    </section>
    <section className="container related-services"><span className="eyebrow eyebrow-muted">MOST REQUESTED</span><h2>Popular services</h2><div className="related-links">{popular.map((item) => <Link key={item.href} href={item.href}>{item.label} <ArrowUpRight size={13}/></Link>)}</div></section>
    <section className="container provider-note"><p>Not sure whether your work needs a visit? Call {site.phones.primary.display} or <Link href="/contact">contact us</Link>. हिन्दी में जानकारी के लिए <Link href="/hi" lang="hi">यहाँ देखें</Link>।</p></section>
  </main>;
}
