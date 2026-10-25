import SiteHeader from "@/components/site-header";
import VoterForm6 from "@/components/voter-form6";
import { getCurrentUser } from "@/lib/auth";
import { privateMetadata } from "@/lib/seo";
import "../form-8/form8.css";

export const metadata=privateMetadata("New voter Form 6 preparation","Fill and verify all sections of Form 6 and the supplementary declaration.");

export default async function VoterForm6Page(){
  const user=await getCurrentUser().catch(()=>null);
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const part=(kind:string)=>parts.find(item=>item.type===kind)?.value??"";
  const maxDate=[part("year"),part("month"),part("day")].join("-");
  return <main className="page page--app"><SiteHeader/>
    <VoterForm6 signedIn={Boolean(user)} demo={user?.role==="demo"} maxDate={maxDate}/>
  </main>;
}
