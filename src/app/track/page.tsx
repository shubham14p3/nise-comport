import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FileText, Contact, Landmark, Phone, Search, ShieldCheck } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import JsonLd from "@/components/json-ld";
import { pageMetadata } from "@/lib/seo";
import { site, whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/icons";
import { PanStatusTool } from "@/components/pan-tools";
import { panSources } from "@/lib/pan-content";
import { breadcrumbLd } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata(
  "Track a Request – NISE COMPORT, PAN, Certificates, Voter ID",
  "One place to track your NISE COMPORT request, PAN application, Jharkhand certificate or voter ID: which reference number you need and where to check status.",
  "/track",
);

const trackers = [
  {
    key: "nise-comport",
    icon: Landmark,
    title: "Your NISE COMPORT Service Request",
    portal: "Your NISE COMPORT customer profile",
    reference: "The request reference we gave you when you submitted a request through this site or at our desk.",
    steps: [
      "Sign in to your NISE COMPORT profile.",
      "Open “My requests” to see the current stage of every request you've sent us.",
      "We also update you by email/WhatsApp when a request's status changes.",
    ],
    href: "/profile#requests",
    hrefLabel: "Open your profile",
  },
  {
    key: "pan",
    icon: Contact,
    title: "PAN Card Application",
    portal: "Protean (NSDL) or UTIITSL, whichever provider took your application",
    reference: "The 15-digit acknowledgement number (Protean) or the coupon/acknowledgement number (UTIITSL) shown on your PAN receipt.",
    steps: [
      "Check your receipt to see which provider processed the application.",
      "Open that provider's PAN tracking page and enter the acknowledgement number.",
      "Complete the captcha. Under processing, dispatched or documents required will be shown.",
    ],
    href: panSources.proteanTrack,
    hrefLabel: "Track on Protean (NSDL)",
    href2: panSources.utiTrack,
    hrefLabel2: "Track on UTIITSL",
  },
  {
    key: "certificates",
    icon: FileText,
    title: "Income, Caste, Residence & Marriage Certificates",
    portal: "Jharkhand ServicePlus (serviceonline.gov.in)",
    reference: "The application/registration number shown on your acknowledgement slip after we submit the application (usually starts with letters followed by digits, e.g. “JH...”).",
    steps: [
      "Go to the ServicePlus citizen portal and open “Track Application Status” (or “View Status of Application”) from the citizen login or the home page.",
      "Enter your application reference number, or search by applicant details if you don't have it.",
      "Complete the captcha shown on the page to see the current status: submitted, under verification at the Circle Office, or approved/certificate ready.",
    ],
    href: "https://serviceonline.gov.in/",
    hrefLabel: "Track on serviceonline.gov.in",
  },
  {
    key: "voter-id",
    icon: ShieldCheck,
    title: "Voter ID (EPIC) – New Registration, Correction, Shifting",
    portal: "National Voters' Service Portal (voters.eci.gov.in) or the ECINET app",
    reference: "The Reference ID shown right after you submit Form 6, Form 6A or Form 8 (format like S27... followed by digits).",
    steps: [
      "Go to voters.eci.gov.in and open “Track Application Status”, or open the ECINET app.",
      "Enter your Reference ID and state.",
      "Check the status: application received, assigned to a Booth Level Officer (BLO) for field verification, approved, or if the EPIC number has been generated.",
    ],
    href: "https://voters.eci.gov.in/",
    hrefLabel: "Track on voters.eci.gov.in",
  },
];

export default function TrackPage() {
  const whatsapp = whatsappLink("Hi NISE COMPORT, I need help tracking my application. My reference number is: ");
  return <main className="page"><SiteHeader/>
    <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Track your application", path: "/track" }])}/>
    <section className="page-hero page-hero--service tone-blue">
      <div className="page-hero__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/></div>
      <div className="container">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Track your application", path: "/track" }]}/>
        <h1>Track a request</h1>
        <p className="page-hero__lead">Everything in one place. Your NISE COMPORT requests are tracked in your profile. PAN, certificates and Voter ID are tracked on the <b>official portal</b>, which holds that data. Pick what you applied for below.</p>
        <nav className="chip-row" aria-label="Jump to tracker">{trackers.map((item) => <a key={item.key} className="chip" href={`#${item.key}`}>{item.title.split(" – ")[0].replace("Your NISE COMPORT Service Request", "My NISE COMPORT request")}</a>)}</nav>
      </div>
    </section>

    <section className="section section--flush"><div className="container">
      <div className="svc-grid">{trackers.map((item) => {
        const Icon = item.icon;
        const external = item.href.startsWith("http");
        return <article key={item.key} id={item.key} className="svc-card tone-blue">
          <div className="svc-card__top"><span className="svc-card__icon"><Icon size={22}/></span></div>
          <h3>{item.title}</h3>
          <p><b>Portal:</b> {item.portal}</p>
          <p><b>What you need:</b> {item.reference}</p>
          <ol className="timeline">{item.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          <div className="svc-card__actions">
            {external
              ? <a className="btn btn--primary btn--sm" href={item.href} target="_blank" rel="noopener noreferrer">{item.hrefLabel} <ArrowUpRight size={16}/></a>
              : <Link className="btn btn--primary btn--sm" href={item.href}>{item.hrefLabel} <ArrowUpRight size={16}/></Link>}
            {"href2" in item && item.href2 ? <a className="btn btn--ghost btn--sm" href={item.href2} target="_blank" rel="noopener noreferrer">{item.hrefLabel2} <ArrowUpRight size={16}/></a> : null}
          </div>
        </article>;
      })}</div>
    </div></section>

    <section className="section section--flush"><div className="container"><PanStatusTool/></div></section>

    <section className="section section--tint"><div className="container">
      <div className="note-card"><Search size={22}/><p>Lost your reference number or not sure which portal to check? Send us a message with your name and roughly when you applied — we keep a note of applications we've helped submit and can help you find the right reference.</p></div>
      <div className="page-hero__ctas" style={{ marginTop: 16 }}>
        <a className="btn btn--wa btn--lg" href={whatsapp} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18}/> WhatsApp us</a>
        <a className="btn btn--glass btn--lg" href={`tel:${site.phones.primary.e164}`}><Phone size={18}/> Call</a>
      </div>
    </div></section>
  </main>;
}
