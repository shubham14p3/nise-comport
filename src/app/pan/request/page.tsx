import SiteHeader from "@/components/site-header";
import PanRequestForm from "@/components/pan-request-form";
import { getCurrentUser } from "@/lib/auth";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("PAN assistance request", "Prepare a PAN assistance request with NISE COMPORT in four steps.");

export default async function PanRequestPage() {
  const user = await getCurrentUser().catch(() => null);
  return <main className="page page--app"><SiteHeader/>
    <PanRequestForm service="new" demo={user?.role === "demo"} signedIn={Boolean(user)}/>
  </main>;
}
