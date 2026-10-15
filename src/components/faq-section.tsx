import { Plus } from "lucide-react";
import JsonLd from "@/components/json-ld";
import { faqLd } from "@/lib/structured-data";

/** Visible FAQs (opening one closes the others) with matching FAQPage structured data. */
export default function FaqSection({ faqs, eyebrow = "QUESTIONS CUSTOMERS ASK", title = "Frequently asked questions", id = "faq", lang }: {
  faqs: { question: string; answer: string }[]; eyebrow?: string; title?: string; id?: string; lang?: string;
}) {
  if (!faqs.length) return null;
  // Details elements sharing a name behave as an accordion: opening one closes the others.
  const exclusive = { name: `${id}-group` } as Record<string, string>;
  return <section className="section faq-block" id={id} lang={lang}>
    <div className="container faq-block__inner">
      <div className="section-head section-head--left">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <div className="faq-list">{faqs.map((faq, index) => <details key={faq.question} {...exclusive} open={index === 0}>
        <summary><span>{faq.question}</span><i aria-hidden="true"><Plus size={18}/></i></summary>
        <p>{faq.answer}</p>
      </details>)}</div>
    </div>
    <JsonLd data={faqLd(faqs)}/>
  </section>;
}
