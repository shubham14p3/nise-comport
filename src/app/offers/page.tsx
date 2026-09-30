import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgePercent, Gift, ShieldCheck, TicketCheck } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import { WhatsAppIcon } from "@/components/icons";
import OfferCard from "@/components/offer-card";
import { liveOffers } from "@/lib/offers";
import { pageMetadata } from "@/lib/seo";
import { whatsappLink } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata("Live Offers & Vouchers in Jamshedpur", "Current NISE COMPORT offers: savings on our service charge for insurance, forms, printing and more at Kharangajhar, Telco, Jamshedpur. Clear terms, applied inside your request.", "/offers");

export default function OffersPage() {
  const offers = liveOffers();
  return <main className="page"><SiteHeader/>
    <section className="page-hero page-hero--compact page-hero--warm">
      <div className="page-hero__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/><span className="blob blob--3"/></div>
      <div className="container">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Offers", path: "/offers" }]}/>
        <span className="badge badge--live"><i/>LIVE NOW</span>
        <h1>Offers that make it <span className="grad-text grad-text--warm">even easier.</span></h1>
        <p className="page-hero__lead">Pick an offer and it’s added to your request automatically. Offers reduce our service charge only, never government fees or an insurer’s premium.</p>
      </div>
    </section>
    <section className="section section--flush">
      <div className="container">
        {offers.length ? <div className="offer-grid offer-grid--page">{offers.map((offer) => <OfferCard key={offer.id} offer={offer}/>)}</div>
          : <div className="empty-state"><span className="empty-state__icon"><BadgePercent size={24}/></span><h3>No live offers right now</h3><p>New offers appear here first. Ask us on WhatsApp about anything running at the counter.</p><a className="btn btn--wa" href={whatsappLink("Hello NISE COMPORT, please tell me about current offers.")} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18}/>Ask on WhatsApp</a></div>}
        <div className="how-offers">
          <article><span className="mini-icon tone-pink"><Gift size={18}/></span><h3>1. Pick an offer</h3><p>Tap “Claim”. It opens the right request with the offer attached.</p></article>
          <article><span className="mini-icon tone-violet"><TicketCheck size={18}/></span><h3>2. Finish 4 quick steps</h3><p>We check eligibility (like “first time only”) when you send it.</p></article>
          <article><span className="mini-icon tone-green"><ShieldCheck size={18}/></span><h3>3. See it on your receipt</h3><p>The saving shows on our service charge. Government and provider fees don’t change.</p></article>
        </div>
        <div className="section-foot"><Link className="btn btn--primary" href="/request">Start a request <ArrowRight size={18}/></Link><Link className="btn btn--ghost" href="/print">Have a coupon? Use it when printing</Link></div>
      </div>
    </section>
  </main>;
}
