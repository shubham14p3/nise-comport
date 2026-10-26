"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, Clock3, Gift, PhoneCall, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { secureApi } from "@/lib/secure-api-client";
import "./service-callback.css";

type Props={serviceSlug:string;serviceName:string;size?:"sm"|"lg";className?:string};

/** Three contact fields only; submitting never creates an account or starts a paid application. */
export default function ServiceCallbackButton({serviceSlug,serviceName,size="sm",className=""}:Props){
  const [open,setOpen]=useState(false);
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [email,setEmail]=useState("");
  const [consent,setConsent]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [sent,setSent]=useState(false);
  const [accountEmailStatus,setAccountEmailStatus]=useState<"sent"|"unavailable"|"not_requested">("not_requested");
  const titleId=useId();
  const dialog=useRef<HTMLDivElement>(null);
  const closer=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    if(!open)return;
    const previous=document.body.style.overflow;
    const oldFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    document.body.style.overflow="hidden";
    closer.current?.focus();
    const keydown=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();setOpen(false);}
      if(event.key!=="Tab"||!dialog.current)return;
      const nodes=Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),a[href]'))
        .filter(element=>element.getClientRects().length>0);
      if(!nodes.length)return;
      if(event.shiftKey&&document.activeElement===nodes[0]){event.preventDefault();nodes[nodes.length-1].focus();}
      else if(!event.shiftKey&&document.activeElement===nodes[nodes.length-1]){event.preventDefault();nodes[0].focus();}
    };
    document.addEventListener("keydown",keydown);
    return()=>{document.removeEventListener("keydown",keydown);document.body.style.overflow=previous;oldFocus?.focus();};
  },[open]);

  const submit=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(busy)return;
    if(!consent){setError("Please allow our staff to contact you about this service.");return;}
    setBusy(true);setError("");
    try{
      const response=await secureApi<{accountEmailStatus?:"sent"|"unavailable"|"not_requested"}>("Q3n7B1xK5vR8",{
        source:"service-callback",serviceSlug,topic:serviceName,
        page:typeof window!=="undefined"?window.location.pathname:"",
        name:name.trim(),phone:phone.trim(),email:email.trim(),consent,
      });
      setAccountEmailStatus(response.accountEmailStatus??"unavailable");
      try {
        sessionStorage.setItem("nise-callback-signup",JSON.stringify({
          name:name.trim(),email:email.trim().toLowerCase(),phone:phone.trim(),
          emailCodeSent:response.accountEmailStatus==="sent",createdAt:Date.now()
        }));
      }catch{/* Direct sign-up works without browser storage. */}
      setSent(true);
    }catch(reason){setError(reason instanceof Error?reason.message:"Could not request a callback. Please try again.");}
    finally{setBusy(false);}
  };

  return <>
    <button type="button" className={`btn ${size==="lg"?"btn--lg":"btn--sm"} ${className||"btn--ghost"}`} onClick={()=>{setOpen(true);setError("");}}><PhoneCall size={size==="lg"?18:15}/> Request callback</button>
    {open&&typeof document!=="undefined"&&createPortal(<div className="service-callback-overlay" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false);}}>
      <div className="service-callback-dialog" ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="service-callback-dialog__header">
          <span className="service-callback-dialog__mark"><PhoneCall size={22}/></span>
          <div><span className="service-callback-dialog__eyebrow">NISE COMPORT · Personal assistance</span><h2 id={titleId}>{sent?"Callback requested":"Request a callback"}</h2></div>
          <button type="button" className="service-callback-dialog__close" ref={closer} onClick={()=>setOpen(false)} aria-label="Close callback form"><X size={20}/></button>
        </header>
        {sent?<div className="service-callback-success" role="status">
          <CheckCircle2 size={40} color="#18754e"/>
          <h3>Your request has been received</h3>
          <p>Our team will contact you about <strong>{serviceName}</strong>. You can decide to continue online or visit our desk after speaking to us.</p>
          <div className="service-callback-account">
            <ShieldCheck size={18}/>
            <div><b>Your NISE account setup has started</b>
              <p>{accountEmailStatus==="sent"
                ? "Check your email for a temporary 6-digit verification code. Confirm it to finish creating your account; then you can sign in or log out whenever you like."
                : "Your callback is saved. Email verification is not yet available; you can request a fresh code from the sign-up page."}</p>
              <Link href="/signup?callback=1" onClick={()=>setOpen(false)}>Finish account setup</Link>
              <p>Already registered? <Link href="/login" onClick={()=>setOpen(false)}>Sign in to your account</Link></p>
            </div>
          </div>
          <button type="button" className="btn btn--primary" onClick={()=>setOpen(false)}>Done</button>
        </div>:<form onSubmit={event=>{void submit(event);}} className="service-callback-form">
          <div className="service-callback-service"><Clock3 size={17}/><span>Enquiry for <strong>{serviceName}</strong></span></div>
          <p>Only your contact details are needed now. No documents, PAN or Aadhaar details.</p>
          <div className="service-callback-reward"><Gift size={16}/><span>We’ll start setting up your account by email. Earn ₹30 welcome credit after email verification, and another ₹20 after verifying your mobile, on eligible services and subject to coupon conditions.</span></div>
          <label>Full name <span>*</span><input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={80} required placeholder="Your full name"/></label>
          <label>Mobile number <span>*</span><input type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} maxLength={25} minLength={10} required placeholder="10-digit mobile number"/></label>
          <label>Email address <span>*</span><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={200} required placeholder="name@example.com"/></label>
          <label className="service-callback-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/><span>I agree to be contacted by NISE COMPORT about this service request. This does not subscribe me to promotions.</span></label>
          {error&&<p className="alert alert--error" role="alert">{error}</p>}
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>{busy?"Submitting…":"Request my callback"}</button>
          <p className="service-callback-privacy"><ShieldCheck size={14}/> No account or payment required for this enquiry.</p>
        </form>}
      </div>
    </div>,document.body)}
  </>;
}
