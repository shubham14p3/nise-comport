import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/site-header";
import CounterDesk from "@/components/counter-desk";
import { getCurrentUser } from "@/lib/auth";
import { publishedServiceDetails } from "@/lib/services";

export const metadata: Metadata = { title: "Counter desk", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Owner-only. Staff use the staff dashboard. */
export default async function CounterDeskPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/desk");
  const services = publishedServiceDetails.map((service) => ({ slug: service.slug, title: service.title }));
  return <main className="page page--app"><SiteHeader/>
    <CounterDesk services={services}/>
  </main>;
}
