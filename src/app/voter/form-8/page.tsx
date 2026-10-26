import SiteHeader from "@/components/site-header";
import VoterForm8 from "@/components/voter-form8";
import { getCurrentUser } from "@/lib/auth";
import { privateMetadata } from "@/lib/seo";
import "./form8.css";

export const metadata = privateMetadata("Voter Form 8 preparation", "Prepare, verify and print a voter Form 8 assistance request.");

export default async function Form8Page() {
  const user = await getCurrentUser().catch(() => null);
  const indiaDateParts = new Intl.DateTimeFormat("en-GB", {timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const datePart = (name:string) => indiaDateParts.find(part=>part.type===name)?.value ?? "";
  const maxDate = [datePart("year"),datePart("month"),datePart("day")].join("-");
  return <main className="page page--app"><SiteHeader/>
    <VoterForm8 signedIn={Boolean(user)} demo={user?.role === "demo"} maxDate={maxDate}/>
  </main>;
}
