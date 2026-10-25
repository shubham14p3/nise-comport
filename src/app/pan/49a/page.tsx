import Link from "next/link";
import SiteHeader from "@/components/site-header";
import PanRequestForm from "@/components/pan-request-form";
import { getCurrentUser } from "@/lib/auth";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Form 49A reference worksheet", "Collect and review the 16 fields of the archived Form 49A in a printable two-page preview.");

export default async function Pan49AReferencePage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const user = await getCurrentUser().catch(() => null);
  const query = await searchParams;
  const editReference = user && user.role !== "demo" && typeof query.edit==="string" && /^PAN-[A-Z0-9-]{4,70}$/i.test(query.edit) ? query.edit : undefined;
  return <main className="page page--app"><SiteHeader/>
    <div className="container" style={{paddingTop:22}}>
      <div className="alert alert--info" role="note">
        <span><b>Archived form preview — not an official PAN submission.</b> Form 49A stopped being accepted for new applications after 31 March 2026. Individuals who are Indian citizens now use Form 93; Indian entities use Form 94. <Link href="/pan/forms">View current form guidance</Link>.</span>
      </div>
    </div>
    {!user && <div className="container"><p className="alert alert--info">Demo mode: you can enter details and preview both pages without signing in. Your entries are not saved or submitted. <Link href="/login">Sign in</Link> to save a real assistance request.</p></div>}
    <PanRequestForm service="new" demo={!user || user.role==="demo"} signedIn legacy49a editReference={editReference}/>
  </main>;
}
