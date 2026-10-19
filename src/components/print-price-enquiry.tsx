import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import SiteHeader from "@/components/site-header";
import { site, whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/icons";

/** Shown instead of the upload form while file uploads are switched off (see src/lib/features.ts). */
export default function PrintPriceEnquiry() {
  const message = "Hello NISE COMPORT, I would like the price for printing / photocopy / scanning. ";
  return <main className="page page--app"><SiteHeader/>
    <section className="container" style={{ paddingBlock: "clamp(32px, 6vw, 72px)", maxWidth: 720 }}>
      <span className="eyebrow">PRINT &amp; DIGITAL SERVICES</span>
      <h1>Printing, scanning &amp; photocopy</h1>
      <p>Online file upload is not available right now. Tell us what you need, such as pages, size, colour or black and white, and copies, and we reply with the price. You can also visit the desk in Kharangajhar, Telco.</p>
      <div className="form-actions" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
        <Link className="btn btn--primary" href="/request?service=printing-scanning">Ask for a price<ArrowRight size={18}/></Link>
        <a className="btn btn--ghost" href={whatsappLink(message)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18}/> WhatsApp us</a>
        <a className="btn btn--ghost" href={`tel:${site.phones.primary.e164}`}><Phone size={18}/> Call us</a>
      </div>
      <p style={{ marginTop: 20 }}><Link href="/pricing">See our pricing</Link></p>
    </section>
  </main>;
}
