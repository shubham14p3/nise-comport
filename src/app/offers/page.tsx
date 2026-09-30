import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import Breadcrumbs from "@/components/breadcrumbs";
import OffersExperience from "@/components/offers-experience";
import { getPromoCalendar } from "@/lib/promotions";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const revalidate = 600;

export const metadata: Metadata = pageMetadata(
  "Festival Offers & Promo Codes in Jamshedpur",
  "₹50 promo codes for Diwali, Durga Puja, Chhath, Eid, Christmas, Sarhul, Karma and every big Team India match, plus a ₹50 welcome coupon. NISE COMPORT, Kharangajhar, Telco, Jamshedpur.",
  "/offers",
);

export default async function OffersPage() {
  const { views } = await getPromoCalendar();
  return <main className="page"><SiteHeader/>
    <OffersExperience views={views} siteUrl={site.url} crumbs={<Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Offers", path: "/offers" }]}/>}/>
  </main>;
}
