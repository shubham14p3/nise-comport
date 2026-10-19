import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import { COLOR_PAGE_RATE } from "@/lib/print-pricing";
import { publicPrices, priceLabel } from "@/lib/service-prices";
import { publishedServiceDetails } from "@/lib/services";
import { priceList } from "@/lib/price-list";
import { pageMetadata } from "@/lib/seo";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Pricing & Service Charges",
  "How NISE COMPORT charges: printing rates, service charges confirmed before work starts, and how government fees are shown separately.",
  "/pricing",
);

const blackWhite = [
  { pages: "1 – 10 pages", rate: 5 },
  { pages: "11 – 50 pages", rate: 3 },
  { pages: "51 pages and above", rate: 2 },
];

const confirmed = [
  { service: "PAN card, Aadhaar updates, certificates, voter ID", note: "Our assistance charge is confirmed on WhatsApp or at the desk before work starts. Government and portal fees, if any, are shown separately." },
  { service: "AEPS, money transfer, bill and fee payments", note: "A small service charge applies and is told to you before the transaction." },
  { service: "Insurance, banking and student forms", note: "Our assistance charge is confirmed per form. Premiums and bank charges go to the insurer or bank." },
  { service: "Laptop, printer and PC repair, hardware", note: "Quoted after checking the device. Parts are priced on the day, so we send the latest price on WhatsApp." },
];

export const revalidate = 300;

export default async function PricingPage() {
  const set = await publicPrices().catch(() => []);
  const named = set.map((price) => ({ price, title: publishedServiceDetails.find((service) => service.slug === price.slug)?.title })).filter((row): row is { price: (typeof set)[number]; title: string } => Boolean(row.title));
  return <main className="content-page"><SiteHeader/>
    <section className="content-hero"><div className="container">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }]}/>
      <span className="eyebrow eyebrow-muted">HONEST, SEPARATE, CONFIRMED FIRST</span>
      <h1>Simple pricing,<br/><em>nothing hidden.</em></h1>
      <p>Our service charge is always shown separately from any government, portal, bank or insurer fee. You hear the amount before we start, and the receipt lists what was collected.</p>
    </div></section>

    <section className="container legal-content">
      <h2>Printing and photocopy</h2>
      <p>Rates for the online print order, per page. Black &amp; white pricing depends on the total pages in the order. Walk-in single pages start higher (see Common charges).</p>
      <table className="price-table"><thead><tr><th>Type</th><th>Rate per page</th></tr></thead><tbody>
        {blackWhite.map((row) => <tr key={row.pages}><th scope="row">Black &amp; white, {row.pages}</th><td>₹{row.rate}</td></tr>)}
        <tr><th scope="row">Colour, any quantity</th><td>₹{COLOR_PAGE_RATE}</td></tr>
      </tbody></table>
      <p>Rates can change with the file, size and quantity, so ask us for the exact price before you print. <Link href="/print">Ask for a printing price <ArrowRight size={13}/></Link></p>

      {named.length > 0 && <><h2>Our service charges</h2>
      <p>Our own charge for each service. Government, portal or courier fees are separate.</p>
      <table className="price-table"><tbody>{named.map((row) => <tr key={row.price.slug}><th scope="row"><Link href={`/services/${row.price.slug}`}>{row.title}</Link>{row.price.note && <small><br/>{row.price.note}</small>}</th><td>{priceLabel(row.price)}</td></tr>)}</tbody></table>
      <p>No price listed for a service? Message or call us and we will quote it before any work starts.</p></>}

      <h2>Common charges</h2>
      <p>Typical amounts for the jobs we do most. We confirm the exact figure before we start.</p>
      {priceList.map((group) => <div key={group.title}>
        <h3>{group.title}</h3>{group.intro && <p>{group.intro}</p>}
        <table className="price-table"><tbody>{group.rows.map((row) => <tr key={row.item}><th scope="row">{row.item}{row.note && <small><br/>{row.note}</small>}</th><td>{row.price}</td></tr>)}</tbody></table>
      </div>)}

      <h2>Services quoted before work starts</h2>
      <table className="price-table"><thead><tr><th>Service</th><th>How it is priced</th></tr></thead><tbody>
        {confirmed.map((row) => <tr key={row.service}><th scope="row">{row.service}</th><td>{row.note}</td></tr>)}
      </tbody></table>

      <h2>What is never included</h2>
      <ul>
        <li>Government, portal, court, bank, insurer or other third-party fees. These go to them, not to us.</li>
        <li>Delivery charges for print orders, unless stated.</li>
        <li>Fees for correcting or re-filing an application that was wrong because of incomplete details.</li>
      </ul>

      <h2>Offers</h2>
      <p>Promo codes and welcome coupons reduce our service charge only, never government fees. See current <Link href="/offers">offers</Link>.</p>

      <h2>Payment</h2>
      <p>You can pay at the desk in cash or UPI, or on your request's payment page: UPI QR is free (we confirm it manually, so it takes a little time), and instant card, net-banking or UPI payment adds a small payment-processing fee that is shown before you pay.</p>

      <h2>Cancellations and refunds</h2>
      <p>See the <Link href="/refund-policy">refund &amp; cancellation policy</Link>.</p>

      <p>Need an exact figure? <a href={whatsappLink("Hello NISE COMPORT, please tell me the charge for: ")} target="_blank" rel="noopener noreferrer">WhatsApp us</a> or call {site.phones.primary.display}.</p>
    </section>
  </main>;
}
