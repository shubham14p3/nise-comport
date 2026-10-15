import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock3, Mail, MapPin, MessageCircle, Navigation, Phone, Star } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import JsonLd from "@/components/json-ld";
import OpenStatus from "@/components/open-status";
import { formatTime12h, weeklyTable } from "@/lib/hours";
import { pageMetadata } from "@/lib/seo";
import { site, whatsappLink } from "@/lib/site";
import { webPageLd } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata(
  "Contact & Directions – Kharangajhar, Telco",
  `Call ${site.phones.primary.display}, WhatsApp or visit NISE COMPORT at Singh Building, Hanuman Mandir Road, Kharangajhar, Telco, Jamshedpur 831004. Hours and directions.`,
  "/contact",
);

export default function ContactPage() {
  const table = weeklyTable(site.openingHours);
  return <main className="content-page"><SiteHeader/>
    <JsonLd data={webPageLd({ name: "Contact NISE COMPORT", description: `Phone, WhatsApp, email and directions for ${site.name}, ${site.address.oneLine}.`, path: "/contact", type: "ContactPage" })}/>
    <section className="content-hero"><div className="container"><Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }]}/><span className="eyebrow eyebrow-muted">LET’S TALK</span><h1>Contact NISE COMPORT<br/><em>in Kharangajhar, Telco.</em></h1><p>Call, WhatsApp or visit the service desk for service requests, document help and print orders. <OpenStatus rules={site.openingHours}/></p></div></section>
    <section className="container contact-grid">
      <a className="contact-card" href={`tel:${site.phones.primary.e164}`}><span><Phone size={20}/></span><small>CALL OUR TEAM</small><h2>{site.phones.primary.display}</h2><p>Primary contact · also {site.phones.secondary.display}</p><ArrowUpRight className="contact-arrow" size={17}/></a>
      <a className="contact-card" href={whatsappLink("Hello NISE COMPORT, I need help with a service.")} target="_blank" rel="noopener noreferrer"><span><MessageCircle size={20}/></span><small>WHATSAPP</small><h2>Start a conversation</h2><p>{site.phones.primary.display} · {site.phones.secondary.display}</p><ArrowUpRight className="contact-arrow" size={17}/></a>
      <a className="contact-card" href={`mailto:${site.email}`}><span><Mail size={20}/></span><small>EMAIL</small><h2>Write to our team</h2><p>{site.email}</p><ArrowUpRight className="contact-arrow" size={17}/></a>
      <a className="contact-card" href={site.mapsUrl} target="_blank" rel="noopener noreferrer"><span><Navigation size={20}/></span><small>GET DIRECTIONS</small><h2>Open in Google Maps</h2><p>{site.address.oneLine}</p><ArrowUpRight className="contact-arrow" size={17}/></a>
      <a className="contact-card" href={`tel:${site.phones.landline.e164}`}><span><Phone size={20}/></span><small>LANDLINE</small><h2>{site.phones.landline.display}</h2><p>Call the service centre</p><ArrowUpRight className="contact-arrow" size={17}/></a>
      {site.reviewUrl ? <a className="contact-card" href={site.reviewUrl} target="_blank" rel="noopener noreferrer"><span><Star size={20}/></span><small>HAPPY WITH OUR HELP?</small><h2>Leave a Google review</h2><p>It helps neighbours find honest local help.</p><ArrowUpRight className="contact-arrow" size={17}/></a> :
        <Link className="contact-card" href="/areas-we-serve"><span><MapPin size={20}/></span><small>WE SERVE</small><h2>Jamshedpur &amp; nearby</h2><p>Kharangajhar, Telco, Govindpur, Birsanagar, Golmuri, Sakchi, Mango and more.</p><ArrowUpRight className="contact-arrow" size={17}/></Link>}
    </section>
    <section className="container contact-details">
      <div className="contact-address"><h2><MapPin size={18}/> Address</h2><address><b>{site.name}</b><br/>{site.address.lines.map((line) => <span key={line}>{line}<br/></span>)}{site.address.district} district, India</address><p lang="hi">{site.address.hindi}</p><p><a className="arrow-link" href={site.mapsUrl} target="_blank" rel="noopener noreferrer">Get directions <ArrowUpRight size={14}/></a></p></div>
      <div className="contact-hours"><h2><Clock3 size={18}/> Opening hours</h2>{site.openingHours.length ? <table><tbody>{table.map((row) => <tr key={row.day}><th scope="row">{row.english}</th><td>{row.slots.length ? row.slots.map((slot) => `${formatTime12h(slot.opens)} – ${formatTime12h(slot.closes)}`).join(", ") : "Closed"}</td></tr>)}</tbody></table> : <p>Monday to Saturday. Timings can change on public holidays, so please call {site.phones.primary.display} before visiting for time-sensitive work.</p>}<p className="contact-footnote">Public holiday timings may differ. For banking or government portal work, call first: partner systems are sometimes unavailable.</p></div>
    </section>
    <div className="container contact-footnote">For government and third-party applications, final approval and processing times are determined by the relevant authority. <Link href="/areas-we-serve">See the areas we serve</Link>.</div>
  </main>;
}
