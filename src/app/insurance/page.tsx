import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CircleCheck, CircleX, Phone, ShieldCheck } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import FaqSection from "@/components/faq-section";
import { WhatsAppIcon } from "@/components/icons";
import InsuranceForm from "@/components/insurance-form";
import JsonLd from "@/components/json-ld";
import SiteBanners from "@/components/site-banners";
import SiteHeader from "@/components/site-header";
import {
  ADD_ONS, BIKE_TP_RATES, CLAIM_STEPS, COVERED, DOCUMENTS, FACILITATOR_NOTE, IDV_DEPRECIATION, INSURERS, NCB_SLABS, NOT_COVERED,
  POLICY_TYPES, PREMIUM_FACTORS, REJECTION_REASONS, RENEWAL_FACTS, SOLICITATION_NOTE, type InsurancePurpose,
} from "@/lib/motor-insurance";
import { pageMetadata } from "@/lib/seo";
import { liveBanners } from "@/lib/site-content";
import { site, whatsappLink } from "@/lib/site";
import { serviceLd } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata(
  "Car & Bike Insurance – New, Renewal & Claims in Jamshedpur",
  "Compare car and bike insurance quotes, renew before expiry, renew an expired policy or get claim help at NISE COMPORT, Telco, Jamshedpur. NCB, IDV and add-ons explained.",
  "/insurance",
);
export const revalidate = 3600;

type Search = Promise<Record<string, string | string[] | undefined>>;
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

const FAQS = [
  { question: "Is NISE COMPORT an insurance company?", answer: FACILITATOR_NOTE },
  { question: "When should I renew?", answer: "Up to 45 days before the end date. Renewing before expiry needs no inspection and keeps your No Claim Bonus. We send a WhatsApp reminder before your next due date." },
  { question: "My policy has expired. What now?", answer: "Don't drive until it's renewed: there's no cover and you can be fined. We arrange renewal; the insurer may ask for an inspection. Renew within 90 days of expiry to keep your NCB." },
  { question: "Can I change my insurer at renewal and keep my NCB?", answer: "Yes. The NCB belongs to you, not the insurer. Bring your last policy; we get your NCB applied with the new insurer." },
  { question: "What is IDV?", answer: "The Insured Declared Value is the vehicle's current value after depreciation. It's the most the insurer pays if the vehicle is stolen or totally damaged. A very low IDV lowers the premium but also the payout." },
  { question: "Do I really need zero depreciation?", answer: "For vehicles up to about 5 years old, yes, usually: without it, plastic, rubber and fibre parts are paid at 50% and other parts after age-based depreciation." },
  { question: "Who settles my claim?", answer: "The insurance company that issued your policy decides and pays the claim. We help you register it, prepare documents, follow up with the insurer and the garage until it's settled." },
];

export default async function InsurancePage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const purpose = (["new", "renew", "expired", "claim"] as const).find((item) => item === one(params.need)) as InsurancePurpose | undefined;
  const vehicle = one(params.vehicle) === "car" ? "car" : one(params.vehicle) === "bike" ? "bike" : undefined;
  const logos = await liveBanners("insurer");
  return <main className="page"><SiteHeader/>
    <JsonLd data={serviceLd({ name: "Car & bike insurance help", description: "New policies, renewals, expired policies and claim support for cars and two-wheelers in Jamshedpur.", path: "/insurance", serviceType: "Motor insurance assistance", category: "Insurance" })}/>
    <section className="page-hero page-hero--compact tone-violet">
      <div className="page-hero__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/></div>
      <div className="container">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, { name: "Insurance", path: "/services/insurance" }, { name: "Car & bike insurance", path: "/insurance" }]}/>
        <h1>Car &amp; bike insurance, <span className="grad-text">sorted.</span></h1>
        <p className="page-hero__lead">New policy, renewal, expired policy or a claim: tell us once, we compare quotes from several insurers and do the paperwork. We stay with you until the claim is settled.</p>
        <div className="page-hero__ctas">
          <a className="btn btn--primary btn--lg" href="#quote">Get my quotes <ArrowRight size={18}/></a>
          <a className="btn btn--wa btn--lg" href={whatsappLink("Hi NISE COMPORT, I need help with vehicle insurance.")} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18}/> WhatsApp</a>
          <a className="btn btn--glass btn--lg" href={`tel:${site.phones.primary.e164}`}><Phone size={18}/> Call</a>
        </div>
      </div>
    </section>

    <div className="container ins-layout">
      <section className="ins-main" id="quote">
        <InsuranceForm initialPurpose={purpose} initialVehicle={vehicle}/>
      </section>
      <aside className="ins-aside">
        <div className="ins-card ins-card--trust"><ShieldCheck size={20}/><div><b>How we work</b><p>{FACILITATOR_NOTE}</p></div></div>
        <div className="ins-card"><b>Renewal in short</b><ul>{RENEWAL_FACTS.slice(0, 4).map((item) => <li key={item}><CircleCheck size={15}/>{item}</li>)}</ul></div>
        <SiteBanners placement="service-page" category="insurance"/>
      </aside>
    </div>

    <section className="section container ins-knowledge">
      <div className="section-head"><span className="eyebrow">INSURERS</span><h2>Quotes from several insurers</h2><p className="muted">We compare what the insurers we work with offer for your vehicle: premium, IDV, add-ons, cashless garages near Jamshedpur and claim service. Which insurers we can quote depends on our partner tie-ups at the time.</p></div>
      {logos.length ? <div className="insurer-logos">{logos.map((logo) => logo.image ? <InsurerLogo key={logo.id} src={logo.image} name={logo.title.en}/> : <span key={logo.id} className="insurer-chip">{logo.title.en}</span>)}</div>
        : <div className="insurer-names">{INSURERS.map((name) => <span key={name} className="insurer-chip">{name}</span>)}</div>}
      <p className="fine">Names and logos belong to their owners. Listing an insurer doesn’t mean it endorses NISE COMPORT.</p>

      <div className="ins-grid">
        {POLICY_TYPES.map((type) => <article key={type.id} className="ins-card"><b>{type.name}</b><p>{type.text}</p></article>)}
      </div>

      <div className="ins-two">
        <article className="ins-card"><h3>What’s covered</h3><ul>{COVERED.map((item) => <li key={item}><CircleCheck size={15}/>{item}</li>)}</ul></article>
        <article className="ins-card"><h3>What’s not covered</h3><ul className="is-no">{NOT_COVERED.map((item) => <li key={item}><CircleX size={15}/>{item}</li>)}</ul></article>
      </div>

      <h3 className="ins-h3">Add-ons worth knowing</h3>
      <div className="ins-grid ins-grid--tight">{ADD_ONS.map((item) => <article key={item.id} className="ins-card"><b>{item.name}</b><p>{item.text}</p></article>)}</div>

      <div className="ins-tables">
        <article className="ins-card"><h3>No Claim Bonus (NCB)</h3><p className="muted">Discount on the own-damage premium for every claim-free year. It belongs to you, so it moves with you if you change insurer.</p>
          <table className="ins-table"><tbody>{NCB_SLABS.map((row) => <tr key={row.years}><td>{row.years}</td><td>{row.discount}%</td></tr>)}</tbody></table></article>
        <article className="ins-card"><h3>IDV depreciation</h3><p className="muted">IDV = showroom price (plus declared accessories) minus this depreciation. Over 5 years, the value is agreed with the insurer.</p>
          <table className="ins-table"><tbody>{IDV_DEPRECIATION.map((row) => <tr key={row.age}><td>{row.age}</td><td>{row.percent}%</td></tr>)}</tbody></table></article>
        <article className="ins-card"><h3>Bike third-party premium</h3><p className="muted">Fixed by IRDAI for every insurer (before GST). Car rates depend on engine size; we share the exact figure with your quote.</p>
          <table className="ins-table"><thead><tr><th>Engine</th><th>1 year</th><th>5 years</th></tr></thead><tbody>{BIKE_TP_RATES.map((row) => <tr key={row.engine}><td>{row.engine}</td><td>₹{row.oneYear.toLocaleString("en-IN")}</td><td>₹{row.fiveYear.toLocaleString("en-IN")}</td></tr>)}</tbody></table></article>
      </div>

      <div className="ins-two">
        <article className="ins-card"><h3>Renewing: what to know</h3><ul>{RENEWAL_FACTS.map((item) => <li key={item}><BadgeCheck size={15}/>{item}</li>)}</ul></article>
        <article className="ins-card"><h3>What decides your premium</h3><ul>{PREMIUM_FACTORS.map((item) => <li key={item}><CircleCheck size={15}/>{item}</li>)}</ul></article>
      </div>

      <div className="ins-grid ins-grid--three">
        <article className="ins-card"><h3>Documents: new vehicle</h3><ol>{DOCUMENTS.new.map((item) => <li key={item}>{item}</li>)}</ol></article>
        <article className="ins-card"><h3>Documents: renewal</h3><ol>{DOCUMENTS.renew.map((item) => <li key={item}>{item}</li>)}</ol></article>
        <article className="ins-card"><h3>Documents: claim</h3><ol>{DOCUMENTS.claim.map((item) => <li key={item}>{item}</li>)}</ol></article>
      </div>

      <div className="ins-two">
        <article className="ins-card"><h3>How a claim works</h3><ol>{CLAIM_STEPS.map((item) => <li key={item}>{item}</li>)}</ol><p className="muted">We help at every step; the insurer’s surveyor and claims team decide the amount.</p></article>
        <article className="ins-card"><h3>Common reasons claims are refused</h3><ul className="is-no">{REJECTION_REASONS.map((item) => <li key={item}><CircleX size={15}/>{item}</li>)}</ul></article>
      </div>
      <p className="ins-cta"><a className="btn btn--primary" href="#quote">Get my quotes <ArrowRight size={16}/></a> <Link className="btn btn--ghost" href="/services/health-life-insurance">Health &amp; life insurance help</Link></p>
      <p className="fine">{SOLICITATION_NOTE} {FACILITATOR_NOTE}</p>
    </section>
    <FaqSection faqs={FAQS} title="Motor insurance questions"/>
  </main>;
}

function InsurerLogo({ src, name }: { src: string; name: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- logo uploaded by the owner in Admin → Site content
  return <span className="insurer-logo"><img src={src} alt={name} loading="lazy"/></span>;
}
