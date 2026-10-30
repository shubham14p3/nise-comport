import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import Breadcrumbs from "@/components/breadcrumbs";
import JsonLd from "@/components/json-ld";
import { PartsQuote, PcBuildForm } from "@/components/hardware-quote";
import { hardwareGroups } from "@/lib/hardware-items";
import { pageMetadata } from "@/lib/seo";
import { webPageLd } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata(
  "Hardware, PC Build & Parts in Jamshedpur",
  "Build a custom PC or get the latest price on RAM, SSD, graphics cards, monitors, printer ink and CCTV from NiSE COMPORT, Telco. Send your list on WhatsApp or to our desk.",
  "/hardware",
);

const PROMISES = [
  { title: "Service before extra charges", text: "No hidden fees. We tell you the price and you approve every estimate before we buy or fit anything." },
  { title: "Latest price, every time", text: "Part prices change often, so we confirm today's price on WhatsApp instead of printing an old one here." },
  { title: "Price-match promise", text: "Show us a written quote for the same part from another local shop and we will check it and match it where we can." },
  { title: "We stay with your order", text: "From quote to delivery or pickup, we keep you updated and explain every step." },
];

export default async function HardwarePage() {
  const groups = await hardwareGroups();
  return <main className="page page--app"><SiteHeader/>
    <JsonLd data={webPageLd({ name: "Hardware, PC build and parts", description: "Custom PC builds and hardware parts with the latest price on WhatsApp.", path: "/hardware" })}/>
    <section className="content-hero"><div className="container">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Hardware & PC", path: "/hardware" }]}/>
      <span className="eyebrow eyebrow-muted">HARDWARE · PC BUILD · PARTS</span>
      <h1>Build your PC, or get the <em>latest price</em> on parts.</h1>
      <p>Fill in the build form or pick parts from the list. Send it to our team (it appears in your account and we get an email), or send it on WhatsApp. We reply with prices before you buy.</p>
    </div></section>

    <section className="section"><div className="container">
      <div className="section-head section-head--left"><h2>Build a custom PC</h2><p>Tell us what you need. We suggest options within your budget.</p></div>
      <PcBuildForm/>
    </div></section>

    <section className="section section--tint"><div className="container">
      <div className="section-head section-head--left"><h2>Our promise</h2><p>Service comes first. Our terms are shared before you pay anything.</p></div>
      <div className="prep-grid">{PROMISES.map((promise) => <article key={promise.title}><h3>{promise.title}</h3><p>{promise.text}</p></article>)}</div>
    </div></section>

    <section className="section"><div className="container">
      <div className="section-head section-head--left"><h2>Parts and accessories</h2><p>Pick what you need. Prices are confirmed on WhatsApp, not shown here.</p></div>
      <PartsQuote groups={groups}/>
    </div></section>
  </main>;
}
