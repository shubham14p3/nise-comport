"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, FileText, Headphones, LoaderCircle, Mail, PhoneCall, ShieldCheck } from "lucide-react";
import "./service-start-panel.css";

type Option="callback"|"online";
type Props={slug:string;title:string;onlineHref:string};
const digits=(text:string)=>text.replace(/\D/g,"").slice(0,10);

/** A service enquiry is not an application: never ask for sensitive documents at this stage. */
export default function ServiceStartPanel({slug,title,onlineHref}:Props){
  const [option,setOption]=useState<Option>("callback");
  const [name,setName]=useState("");
  const [mobile,setMobile]=useState("");
  const [email,setEmail]=useState("");
  const [consent,setConsent]=useState(false);
  const [sending,setSending]=useState(false);
  const [complete,setComplete]=useState(false);
  const [error,setError]=useState("");
  async function requestCallback(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(sending)return;
    if(name.trim().length<2 || !/^[6-9]\d{9}$/.test(mobile) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !consent){
      setError("Please enter your name, a valid 10-digit Indian mobile number and email, and confirm we may contact you.");
      return;
    }
    setSending(true);setError("");
    try{
      const res=await fetch("/api/leads",{
        method:"POST",credentials:"same-origin",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          intent:"callback",source:"form",name:name.trim(),phone:mobile,email:email.trim(),
          serviceSlug:slug,topic:title,page:"/services/"+slug,consent,
        }),
      });
      const body: {error?:string} = await res.json();
      if(!res.ok)throw new Error(body.error || "Could not record your callback request.");
      setComplete(true);
    }catch(reason){setError(reason instanceof Error?reason.message:"Could not request a callback.");}
    finally{setSending(false);}
  }
  return <section id="service-start" className="service-start" aria-label="Choose how to begin your service">
    <span className="service-start__eyebrow">GET STARTED</span>
    <h3>How would you like to proceed?</h3>
    <p className="service-start__intro">Request a free call first, or fill out the service application online.</p>
    <div className="service-start__options" role="group" aria-label="Your preferred service route">
      <button type="button" className={option==="callback"?"is-selected":""} aria-pressed={option==="callback"} onClick={()=>{setOption("callback");setError("");}}>
        <Headphones size={22}/><b>Request a callback</b><small>No account needed</small>
      </button>
      <button type="button" className={option==="online"?"is-selected":""} aria-pressed={option==="online"} onClick={()=>{setOption("online");setError("");}}>
        <FileText size={22}/><b>Proceed online</b><small>Fill in the detailed form</small>
      </button>
    </div>
    {option==="online" ? <div className="service-start__online">
      <p>Fill the relevant application, upload supporting documents when requested, then sign in to verify your preview before submission.</p>
      <Link className="btn btn--primary btn--block" href={onlineHref}>Continue to online form <ArrowRight size={17}/></Link>
      <small>Available online assistance depends on the selected service.</small>
    </div> : complete ? <div className="service-start__success" role="status">
      <CheckCircle2 size={28}/><b>Callback requested</b>
      <p>We&apos;ve recorded your enquiry about {title}. Our team can explain the offline or online options when contacting you.</p>
      <button type="button" className="btn btn--ghost btn--sm" onClick={()=>setOption("online")}>Prefer to fill the form now? <ArrowRight size={15}/></button>
    </div> : <form onSubmit={requestCallback} className="service-start__form" noValidate>
      <label><span>Your full name *</span><input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Applicant name"/></label>
      <label><span>Mobile number *</span><div className="service-start__phone"><span>+91</span><input required type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" value={mobile} onChange={e=>setMobile(digits(e.target.value))} placeholder="10-digit mobile"/></div></label>
      <label><span>Email address *</span><input required type="email" autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
      <label className="service-start__consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/>
        <span>I agree to be contacted by Nise Comport about this service request.</span></label>
      {error&&<p className="service-start__error" role="alert">{error}</p>}
      <button type="submit" className="btn btn--primary btn--block" disabled={sending}>
        {sending?<LoaderCircle size={16}/>:<PhoneCall size={16}/>} {sending?"Saving callback…":"Request my callback"}
      </button>
      <small className="service-start__privacy"><ShieldCheck size={13}/> No Aadhaar, documents or payment needed for a callback.</small>
    </form>}
    <p className="service-start__note"><Mail size={14}/> If you choose online after speaking with us, we can email you a link to the correct form.</p>
  </section>;
}
