import Link from "next/link";
import SiteHeader from "@/components/site-header";
import PanRequestForm from "@/components/pan-request-form";
import { getCurrentUser } from "@/lib/auth";
import { privateMetadata } from "@/lib/seo";

export const metadata=privateMetadata("Form 93 preparation and verification","Customer-facing Form 93 verification using the exact 2026 two-page reference.");

export default async function Form93Page({searchParams}:{searchParams:Promise<{edit?:string}>}){
  const user=await getCurrentUser().catch(()=>null);
  const params=await searchParams;
  const editReference=user&&user.role!=="demo"&&typeof params.edit==="string"&&/^PAN-[A-Z0-9-]{4,70}$/i.test(params.edit)?params.edit:undefined;
  return <main className="page page--app"><SiteHeader/>
    <div className="container" style={{paddingTop:22}}>
      <div className="alert alert--info" role="note">
        <span><b>Form No. 93 · preparation only.</b> Verify your applicant information before payment. Your official application number, payment reference, barcode, photograph, and signature are supplied through separate staff/authority workflows. <Link href="/track">Track your NISE request</Link>.</span>
      </div>
      {!user&&<p className="alert alert--info">You can fill the PAN form without an account. Sign in to unlock the filled preview, then verify and submit your NISE request.</p>}
    </div>
    <PanRequestForm service="new" demo={user?.role==="demo"} signedIn={Boolean(user)} form93 editReference={editReference}/>
  </main>;
}
