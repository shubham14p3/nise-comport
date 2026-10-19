import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, FileText, HandCoins, HeartHandshake, MapPin, MessagesSquare, ShieldCheck, Users } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import JsonLd from "@/components/json-ld";
import PartnerMarks from "@/components/partner-marks";
import TeamGrid from "@/components/team-grid";
import { CategoryIcon } from "@/components/icons";
import { areas } from "@/lib/areas";
import { categoryMeta } from "@/lib/categories";
import { pageMetadata } from "@/lib/seo";
import { site, whatsappLink } from "@/lib/site";
import { webPageLd } from "@/lib/structured-data";
import { publicTeam } from "@/lib/team";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata(
  "About NISE COMPORT – CSC & Pragya Kendra in Telco, Jamshedpur",
  "Since 2010, NISE COMPORT has helped Jamshedpur residents with PAN, Aadhaar, certificates, banking, insurance, printing and computer needs. An independent CSC / Pragya Kendra service centre in Kharangajhar, Telco.",
  "/about",
);

const steps = [
  { icon: MessagesSquare, title: "Tell us what you need", text: "Walk in, call, WhatsApp or send a request online. We explain the route, the documents and the charges first." },
  { icon: FileText, title: "We prepare it with you", text: "We check documents, fill the forms and let you review every detail before anything is submitted." },
  { icon: BadgeCheck, title: "We submit and follow up", text: "We submit on the official portal, give you the acknowledgement and tell you where to track it." },
  { icon: HandCoins, title: "Clear charges, clear receipt", text: "Our service charge is shown separately from government or portal fees, and you get a receipt." },
];

const promises = [
  { icon: HeartHandshake, title: "Honest service, fair price", text: "The same ethic we started with in 2010: serve every person honestly, at the best price available in the market." },
  { icon: ShieldCheck, title: "Your documents stay private", text: "Files are kept privately, used only for your request and deleted on schedule. Staff never ask for your OTP or PIN." },
  { icon: Users, title: "Real people, in person", text: "A friendly desk you can walk up to, in Hindi or English, with the same faces you saw last time." },
];

export default async function AboutPage() {
  const team = await publicTeam();
  return <main className="content-page about-page"><SiteHeader/>
    <JsonLd data={webPageLd({ name: "About NISE COMPORT", description: site.description, path: "/about", type: "AboutPage" })}/>

    <section className="content-hero about-hero"><div className="container about-hero__grid">
      <div>
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "About", path: "/about" }]}/>
        <span className="eyebrow eyebrow-muted">SINCE 2010 · KHARANGAJHAR, TELCO</span>
        <h1>Your neighbourhood<br/><em>digital seva kendra.</em></h1>
        <p>NISE COMPORT is an independent CSC / Pragya Kendra service centre in Jamshedpur. We help you reach government, banking, insurance and digital services without the running around: clear steps, careful attention and a friendly face.</p>
        <div className="about-hero__actions">
          <Link className="btn btn--primary" href="/request">Start a request <ArrowRight size={16}/></Link>
          <a className="btn btn--ghost" href={whatsappLink("Hello NISE COMPORT, I need help with a service.")} target="_blank" rel="noopener noreferrer">WhatsApp us</a>
        </div>
      </div>
      <Image className="about-hero__photo" src="/images/about/2.png" alt="NISE COMPORT service desk illustration" width={538} height={516} priority sizes="(max-width: 860px) 70vw, 420px"/>
    </div></section>

    <section className="container about-stats" aria-label="NISE COMPORT at a glance">
      <div><b>2010</b><span>Serving Jamshedpur since</span></div>
      <div><b>{categoryMeta.length}</b><span>Service categories under one roof</span></div>
      <div><b>{areas.length}+</b><span>Neighbourhoods we serve</span></div>
      <div><b>हिन्दी · English</b><span>Help in your language</span></div>
    </section>

    <section className="container about-story">
      <div className="section-head section-head--left"><span className="eyebrow">OUR STORY</span><h2>From NISE to NISE COMPORT</h2></div>
      <div className="about-story__body">
        <p>We began as <b>NISE</b> in 2010, a small computer and digital-services desk for our neighbourhood in Kharangajhar, Telco. People came for a print-out or a form, and stayed because someone patiently explained what to do next.</p>
        <p>Over the years that grew into <b>NISE COMPORT</b>: a CSC / Pragya Kendra service centre where families, students, shopkeepers and senior citizens find PAN and Aadhaar help, Jharkhand certificates, banking and AEPS, insurance, online forms, printing, and computer sales and repair, all in one place.</p>
        <p className="about-story__quote">“We have made our way from NISE to NISE COMPORT because of you. We have never forgotten our ethic: serve every person honestly, at the best price available today.”</p>
        <p>We look forward to continuing to serve our community, and to adding more services that help it grow.</p>
      </div>
    </section>

    <section className="section section--tint"><div className="container">
      <div className="section-head"><span className="eyebrow">WHAT WE DO</span><h2>Everything in one visit</h2><p>From government work to your laptop, these are the services our desk handles every day.</p></div>
      <div className="about-services">{categoryMeta.map((category) => <Link key={category.slug} href={`/services/${category.slug}`} className={`about-service tone-${category.tone}`}>
        <span className="about-service__icon"><CategoryIcon icon={category.icon} size={22}/></span>
        <b>{category.short.en}</b><small>{category.line.en}</small>
      </Link>)}</div>
    </div></section>

    <section className="container about-partners">
      <div className="section-head"><span className="eyebrow">SERVICES WE HELP YOU ACCESS</span><h2>We are the helping hand between you and these services</h2><p>The services and programmes below belong to their government departments, companies and providers. NISE COMPORT does not issue or approve them. We help you apply, prepare documents, submit and track.</p></div>
      <PartnerMarks/>
      <p className="about-partners__note">All names and logos belong to their respective owners. NISE COMPORT is an independent local facilitator; final decisions, fees and approvals rest with the relevant authority or provider.</p>
    </section>

    <section className="section section--tint"><div className="container">
      <div className="section-head"><span className="eyebrow">HOW WE WORK</span><h2>Simple, from the first question</h2></div>
      <ol className="about-steps">{steps.map((step, index) => <li key={step.title}><span className="about-steps__n">{index + 1}</span><step.icon size={22} aria-hidden="true"/><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
    </div></section>

    <section className="container about-promises">{promises.map((item) => <article key={item.title}><item.icon size={24} aria-hidden="true"/><h3>{item.title}</h3><p>{item.text}</p></article>)}</section>

    <section className="container team-section">
      <div className="section-head"><span className="eyebrow">THE PEOPLE</span><h2>Meet the team</h2><p>The faces you will see when you visit, and the voices you will hear when you call.</p></div>
      <TeamGrid people={team.slice(0, 8)}/>
      {team.length > 8 && <p className="center"><Link className="arrow-link" href="/team">See the whole team <ArrowRight size={14}/></Link></p>}
    </section>

    <section className="container about-visit">
      <MapPin size={24} aria-hidden="true"/>
      <div><h2>Visit us in Kharangajhar, Telco</h2><p>{site.address.oneLine}. We serve {areas.slice(0, 6).map((area) => area.name).join(", ")} and the wider Jamshedpur area. <Link href="/areas-we-serve">See all areas</Link>.</p></div>
      <Link className="btn btn--primary" href="/contact">Get directions <ArrowRight size={16}/></Link>
    </section>
    <section className="container provider-note"><p>We are not a government department and do not decide on applications. Our service charge is separate from any government or third-party fee. See <Link href="/pricing">pricing</Link> and our <Link href="/refund-policy">refund policy</Link>.</p></section>
  </main>;
}
