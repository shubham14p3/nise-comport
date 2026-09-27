import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
export const metadata: Metadata = pageMetadata("Contact NISE COMPORT in Jamshedpur", "Contact NISE COMPORT for CSC, PAN, Aadhaar, printing and digital service help at Kharangajhar, Telco, Jamshedpur.", "/contact");
const primaryPhone = process.env.NEXT_PUBLIC_WHATSAPP_PRIMARY ?? "919771219893";
export default function ContactPage() {
  return <main className="content-page"><SiteHeader/>
    <section className="content-hero"><div className="container"><Link href="/" className="back-small"><ArrowLeft size={14}/> Home</Link><span className="eyebrow eyebrow-muted">LET’S TALK</span><h1>Need a hand?<br/><em>We’re easy to reach.</em></h1><p>Contact the NISE COMPORT team in Kharangajhar for service requests, document help and print orders.</p></div></section>
    <section className="container contact-grid">
      <a className="contact-card" href={`tel:+${primaryPhone}`}><span><Phone size={20}/></span><small>CALL OUR TEAM</small><h2>+91 97712 19893</h2><p>Primary contact</p><ArrowUpRight className="contact-arrow" size={17}/></a>
      <a className="contact-card" href={`https://wa.me/${primaryPhone}`}><span><MessageCircle size={20}/></span><small>WHATSAPP</small><h2>Start a conversation</h2><p>+91 97712 19893 · +91 98355 52756</p><ArrowUpRight className="contact-arrow" size={17}/></a>
      <a className="contact-card" href="mailto:info@nisecomport.com"><span><Mail size={20}/></span><small>EMAIL</small><h2>Write to our team</h2><p>info@nisecomport.com</p><ArrowUpRight className="contact-arrow" size={17}/></a>
      <a className="contact-card" href="https://www.google.com/maps/search/?api=1&query=Shop+No+3+Singh+Building+Kharangajhar+Jamshedpur" target="_blank" rel="noreferrer"><span><MapPin size={20}/></span><small>VISIT THE SERVICE DESK</small><h2>Kharangajhar, Telco</h2><p>Shop No 3, Ground Floor, Singh Building, Hanuman Mandir Road, Jamshedpur, Jharkhand</p><ArrowUpRight className="contact-arrow" size={17}/></a>
      <a className="contact-card" href="tel:+916572917622"><span><Phone size={20}/></span><small>LANDLINE</small><h2>0657 2917622</h2><p>Call the service centre</p><ArrowUpRight className="contact-arrow" size={17}/></a>
      <div className="contact-card"><span><MapPin size={20}/></span><small>WE SERVE</small><h2>Jamshedpur &amp; nearby</h2><p>Kharangajhar, Telco and the surrounding Jharkhand community.</p></div>
    </section><div className="container contact-footnote">For government and third-party applications, final approval and processing times are determined by the relevant authority.</div>
  </main>;
}
