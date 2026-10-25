import SiteHeader from "@/components/site-header";
import VoterForm8 from "@/components/voter-form8";
import { getCurrentUser } from "@/lib/auth";
import { privateMetadata } from "@/lib/seo";
import "./form8.css";

export const metadata = privateMetadata("Voter Form 8 preparation", "Prepare, verify and print a voter Form 8 assistance request.");

export default async function Form8Page() {
  const user = await getCurrentUser().catch(() => null);
  return <main className="page page--app"><SiteHeader/>
    <VoterForm8 signedIn={Boolean(user)} demo={user?.role === "demo"}/>
  </main>;
}
