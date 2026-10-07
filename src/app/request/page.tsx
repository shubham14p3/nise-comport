import SiteHeader from "@/components/site-header";
import RequestWizard from "@/components/request-wizard";
import { privateMetadata } from "@/lib/seo";
import { shortServiceName } from "@/lib/services";
import { allServices } from "@/lib/site-content";
import { site } from "@/lib/site";

export const metadata = privateMetadata("Start a request", "Send a service request to NISE COMPORT in four quick steps.");

type Search = Promise<Record<string, string | string[] | undefined>>;
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.slice(0, 300);

/** Four-step request flow. Services that have their own flow (PAN, printing) link out from step 1. */
export default async function RequestPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const services = (await allServices()).map((service) => ({ slug: service.slug, name: shortServiceName(service.title), category: service.categorySlug, description: service.description }));
  return <main className="page page--app"><SiteHeader/>
    <RequestWizard services={services} hours={site.openingHours} initial={{ service: one(params.service), category: one(params.category), offer: one(params.offer), note: one(params.note), coupon: one(params.coupon), resume: one(params.resume) === "1" }}/>
  </main>;
}
