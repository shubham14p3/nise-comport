import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import FaqFinder, { type FinderFaq } from "@/components/faq-finder";
import JsonLd from "@/components/json-ld";
import { categoryMeta } from "@/lib/categories";
import { GENERAL_TOPICS, generalFaqs } from "@/lib/faq-data";
import { panGuides } from "@/lib/pan-content";
import { pageMetadata } from "@/lib/seo";
import { serviceEditorial } from "@/lib/service-editorial";
import { allServices } from "@/lib/site-content";
import { faqLd } from "@/lib/structured-data";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata(
  "FAQs: Services, Fees, Tracking, Documents & Privacy",
  "Search answers about NISE COMPORT services in Telco, Jamshedpur: PAN, Aadhaar, certificates, voter ID, passport, driving licence, banking, insurance, printing, fees, tracking and privacy.",
  "/faq",
);

export default async function FaqPage() {
  const services = await allServices();
  const topicOf = (categorySlug: string) => categoryMeta.find((item) => item.slug === categorySlug)?.short.en ?? "Other services";
  const seen = new Set<string>();
  const faqs: FinderFaq[] = [];
  const add = (faq: FinderFaq) => {
    const key = faq.question.trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    faqs.push(faq);
  };

  generalFaqs.forEach((faq, index) => add({ id: `g-${index}`, topic: faq.topic, question: faq.question, answer: faq.answer }));
  for (const service of services) {
    const topic = topicOf(service.categorySlug);
    const href = `/services/${service.slug}`;
    const shortTitle = service.title.replace(/\s+in\s+Jamshedpur.*$/i, "").replace(/\s*\(.*$/, "");
    [...(service.faqs ?? []), ...(serviceEditorial[service.slug]?.faqs ?? [])].forEach((faq, index) =>
      add({ id: `s-${service.slug}-${index}`, topic, question: faq.question, answer: faq.answer, serviceTitle: shortTitle, serviceHref: href }));
    if (service.slug === "pan-card") {
      for (const guide of panGuides) guide.faqs.forEach((faq, index) =>
        add({ id: `pan-${guide.slug}-${index}`, topic, question: faq.q, answer: faq.a, serviceTitle: `PAN guide: ${guide.title}`, serviceHref: `/pan/${guide.slug}` }));
    }
  }

  const serviceTopics = [...new Set(faqs.map((faq) => faq.topic).filter((name) => !(GENERAL_TOPICS as readonly string[]).includes(name)))];
  const topics = [...GENERAL_TOPICS, ...serviceTopics];

  return <main className="content-page"><SiteHeader/>
    <section className="content-hero"><div className="container">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "FAQs", path: "/faq" }]}/>
      <Link href="/" className="back-small"><ArrowLeft size={14}/> Home</Link>
      <span className="eyebrow eyebrow-muted">GOOD QUESTIONS, CLEAR ANSWERS</span>
      <h1>Frequently asked<br/><em>questions.</em></h1>
      <p>Search any question, or pick a topic or service. Can’t find yours? <Link href="/contact">Ask the service desk</Link>.</p>
    </div></section>
    <section className="container"><FaqFinder faqs={faqs} topics={topics}/></section>
    <JsonLd data={faqLd(faqs.slice(0, 60).map((faq) => ({ question: faq.question, answer: faq.answer })))}/>
  </main>;
}
