"use client";

import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import SiteHeader from "@/components/site-header";
import { WhatsAppIcon } from "@/components/icons";
import { PRICE_ENQUIRY as P } from "@/lib/i18n-forms";
import { site, whatsappLink } from "@/lib/site";
import { useLocale } from "@/lib/use-locale";

/** Shown instead of the upload form while file uploads are switched off (see src/lib/features.ts). */
export default function PrintPriceEnquiry() {
  const locale = useLocale();
  return <main className="page page--app"><SiteHeader/>
    <section className="container" style={{ paddingBlock: "clamp(32px, 6vw, 72px)", maxWidth: 720 }}>
      <span className="eyebrow">{P.eyebrow[locale]}</span>
      <h1>{P.title[locale]}</h1>
      <p>{P.body[locale]}</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
        <Link className="btn btn--primary" href="/request?service=printing-scanning">{P.ask[locale]}<ArrowRight size={18}/></Link>
        <a className="btn btn--ghost" href={whatsappLink(P.message[locale])} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18}/> {P.whatsapp[locale]}</a>
        <a className="btn btn--ghost" href={`tel:${site.phones.primary.e164}`}><Phone size={18}/> {P.call[locale]}</a>
      </div>
      <p style={{ marginTop: 20 }}><Link href="/pricing">{P.pricing[locale]}</Link></p>
    </section>
  </main>;
}
