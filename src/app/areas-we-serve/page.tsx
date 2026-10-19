import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, MessagesSquare, Navigation, Route } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import JsonLd from "@/components/json-ld";
import SiteHeader from "@/components/site-header";
import { areas, type AreaZone } from "@/lib/areas";
import { pageMetadata } from "@/lib/seo";
import { directionsFrom, site } from "@/lib/site";
import { webPageLd } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata(
  "Areas We Serve in Jamshedpur – Directions",
  "CSC and Pragya Kendra help near Kharangajhar, Telco, Govindpur, Birsanagar, Golmuri, Sakchi, Mango, Jugsalai, Bistupur, Sonari, Kadma and Adityapur. Directions from your area.",
  "/areas-we-serve",
);

const popular = [
  { href: "/services/pan-card", label: "PAN card" },
  { href: "/services/aadhaar", label: "Aadhaar update help" },
  { href: "/services/income-caste-residence-certificate", label: "Income, caste & residence certificates" },
  { href: "/services/aeps-money-transfer", label: "AEPS & money transfer" },
  { href: "/services/printing-scanning", label: "Printing & photocopy" },
  { href: "/services/voter-id", label: "Voter ID" },
  { href: "/services/passport-driving-licence", label: "Passport & driving licence" },
  { href: "/services/ration-card", label: "Ration card" },
  { href: "/services/ayushman-card", label: "Ayushman card" },
  { href: "/services/insurance", label: "Insurance" },
  { href: "/services/computer-repair", label: "Computer & laptop repair" },
];

const zones: { name: AreaZone; blurb: string }[] = [
  { name: "Telco and nearby", blurb: "Our own neighbourhood. Walk in any time during opening hours." },
  { name: "Central Jamshedpur", blurb: "Sakchi, Bistupur, Sonari, Kadma and the city centre." },
  { name: "East and south", blurb: "Mango, Golmuri, Baridih and the neighbourhoods beyond." },
  { name: "Beyond the city", blurb: "Adityapur, Gamharia, Ghatshila and further. Start online, visit only when needed." },
];

const howFar = [
  { icon: MessagesSquare, title: "Message us first", text: "Send your service and a photo of your documents on WhatsApp. We tell you exactly what to bring and whether you need to come at all." },
  { icon: Mail, title: "Start online", text: "Many services can begin with an online request, so your visit is short or not needed." },
  { icon: Route, title: "Come once", text: "Use the directions link for your area, bring the originals we listed, and we finish the work in one visit." },
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
    {zones.map((zone) => {
      const list = areas.filter((area) => area.zone === zone.name);
      if (!list.length) return null;
      return <section className="container area-zone" key={zone.name}>
        <div className="section-head section-head--left"><h2>{zone.name}</h2><p>{zone.blurb}</p></div>
        <div className="area-grid">{list.map((area) => <article className="area-card" id={area.slug} key={area.slug}>
          <h3>{area.name} <span lang="hi">{area.hindi}</span></h3>
          <p>{area.note}</p>
          <a className="arrow-link" href={directionsFrom(area.name)} target="_blank" rel="noopener noreferrer"><Navigation size={14}/> Directions from {area.name}</a>
        </article>)}</div>
      </section>;
    })}
    <section className="container area-zone">
      <div className="section-head section-head--left"><h2>Living further away?</h2><p>You do not have to be in Jamshedpur to use NISE COMPORT. Here is how it works from a distance.</p></div>
      <ol className="about-steps">{howFar.map((step, index) => <li key={step.title}><span className="about-steps__n">{index + 1}</span><step.icon size={22} aria-hidden="true"/><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
    </section>
    <section className="container related-services"><span className="eyebrow eyebrow-muted">MOST REQUESTED</span><h2>Popular services</h2><div className="related-links">{popular.map((item) => <Link key={item.href} href={item.href}>{item.label} <ArrowUpRight size={13}/></Link>)}</div></section>
    <section className="container provider-note"><p>Not sure whether your work needs a visit? Call {site.phones.primary.display} or <Link href="/contact">contact us</Link>. हिन्दी में जानकारी के लिए <Link href="/hi" lang="hi">यहाँ देखें</Link>।</p></section>
  </main>;
}
