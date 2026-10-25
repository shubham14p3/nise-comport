import Link from "next/link";
import { ArrowRight, CheckCircle2, FilePenLine, ShieldCheck, UserRoundPlus } from "lucide-react";
import SiteHeader from "@/components/site-header";
import { pageMetadata } from "@/lib/seo";

export const metadata=pageMetadata("Voter ID - New Form 6 and Correction Form 8","Prepare Form 6 for a new elector or Form 8 for corrections, residence shifting, replacement EPIC and disability marking.","/voter");

export default function VoterServicesPage(){
  return <main className="page"><SiteHeader/>
    <section className="container" style={{padding:"35px 16px 65px"}}>
      <nav style={{fontSize:13,marginBottom:13}}><Link href="/services/voter-id">Voter services</Link> / Choose a form</nav>
      <h1 style={{fontSize:"clamp(1.9rem,4vw,3rem)",marginBottom:10}}>Which voter form do you need?</h1>
      <p style={{maxWidth:790,color:"#5c6d83",lineHeight:1.7}}>Choose the correct Election Commission form first. Both flows let you fill, review and print a draft before sending a Nise Comport assistance request.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,330px),1fr))",gap:20,marginTop:30}}>
        <article style={{padding:26,border:"1px solid #d9e5f3",borderRadius:18,background:"linear-gradient(150deg,#ecf5ff,#fff)",display:"grid",gap:14}}>
          <UserRoundPlus size={30} color="#1c6cb0"/><span style={{fontSize:12,fontWeight:800,color:"#326798"}}>NEW VOTER REGISTRATION</span>
          <h2 style={{fontSize:"1.6rem",margin:0}}>Form 6</h2><p>Applying for inclusion in the electoral roll as a new elector.</p>
          <div style={{display:"grid",gap:9,fontSize:13}}>
            <span><CheckCircle2 size={14}/> Personal and relative details</span>
            <span><CheckCircle2 size={14}/> Address, age proof and photograph</span>
            <span><CheckCircle2 size={14}/> Three-page declaration preview</span>
          </div>
          <Link className="btn btn--primary" href="/voter/form-6">Start Form 6 <ArrowRight size={17}/></Link>
        </article>
        <article style={{padding:26,border:"1px solid #d9e5f3",borderRadius:18,background:"linear-gradient(150deg,#f2edff,#fff)",display:"grid",gap:14}}>
          <FilePenLine size={30} color="#6643bf"/><span style={{fontSize:12,fontWeight:800,color:"#6643bf"}}>EXISTING VOTER / EPIC</span>
          <h2 style={{fontSize:"1.6rem",margin:0}}>Form 8</h2><p>Correct an existing electoral entry, shift residence, replace an EPIC, or request disability marking.</p>
          <div style={{display:"grid",gap:9,fontSize:13}}>
            <span><CheckCircle2 size={14}/> Up to four corrections in one form</span>
            <span><CheckCircle2 size={14}/> Document proof and optional photograph</span>
            <span><CheckCircle2 size={14}/> Two-page correction preview</span>
          </div>
          <Link className="btn btn--primary" href="/voter/form-8">Start Form 8 <ArrowRight size={17}/></Link>
        </article>
      </div>
      <p className="f8-warning" style={{marginTop:24}}><ShieldCheck size={18}/> Nise Comport is an independent assistance provider, not ECI. Neither form creates an official government acknowledgement or completes government submission.</p>
    </section>
  </main>;
}
