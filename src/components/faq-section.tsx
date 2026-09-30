import JsonLd from "@/components/json-ld";
import { faqLd } from "@/lib/structured-data";

/** Visible FAQs with matching FAQPage structured data (the markup must match what people see). */
export default function FaqSection({ faqs, eyebrow = "QUESTIONS CUSTOMERS ASK", title = "Frequently asked questions", id = "faq", lang }: {
  faqs: { question: string; answer: string }[]; eyebrow?: string; title?: string; id?: string; lang?: string;
}) {
  if (!faqs.length) return null;
  return <section className="container service-faq" id={id} lang={lang}>
    <span className="eyebrow eyebrow-muted">{eyebrow}</span>
    <h2>{title}</h2>
    <div>{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div>
    <JsonLd data={faqLd(faqs)}/>
  </section>;
}
