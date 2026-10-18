import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/site-header";
import ReviewForm from "@/components/review-form";
import Breadcrumbs from "@/components/breadcrumbs";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Rate your experience", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/review/${reference}`)}`);
  return <main className="page"><SiteHeader/>
    <section className="page-hero page-hero--service tone-blue">
      <div className="page-hero__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/></div>
      <div className="container">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "My requests", path: "/profile#requests" }, { name: "Rate your experience", path: `/review/${reference}` }]}/>
        <h1>Rate your experience</h1>
        <p className="page-hero__lead">Tell us how it went — it takes under a minute and helps us get better.</p>
      </div>
    </section>
    <section className="section section--flush"><div className="container" style={{ maxWidth: 560 }}>
      <ReviewForm reference={reference}/>
    </div></section>
  </main>;
}
