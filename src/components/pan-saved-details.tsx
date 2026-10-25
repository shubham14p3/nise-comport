"use client";

import Link from "next/link";
import { Eye, FileText, Pencil } from "lucide-react";
import { useState } from "react";
import Pan49AModal from "@/components/pan-49a-modal";
import { panIntakeSchema,panServiceLabels } from "@/lib/pan-validation";

const labels:Record<string,string>={
  service:"Requested service",citizenship:"Citizenship / entity origin",applicant:"Applicant category",
  residency:"Address location",existingPan:"PAN already allotted",fullName:"Applicant name",
  birthDate:"Birth / formation date",contactName:"Contact person",email:"Contact email",
  phone:"Phone",address:"Address",city:"City",state:"State / province",country:"Country",
  postalCode:"Postal code",representative:"Parent / authorised representative",entityType:"Entity type",
  corrections:"Changes requested",documentPlan:"Documents ready",notes:"Notes",
};

export default function PanSavedDetails({details,editReference}:{details:Record<string,unknown>;editReference?:string}) {
  const [showPreview,setShowPreview]=useState(false);
  const parsed=panIntakeSchema.safeParse(details.pan);
  if(!parsed.success)return null;
  const raw=details.intake;
  const intake=raw && typeof raw==="object" ? raw as {kind?:string;answers?:Record<string,string>}:null;
  const available=intake?.kind==="pan49a" && Boolean(intake.answers);
  return <section className="pan-card">
    <h2>Saved PAN assistance details</h2>
    <p>This is your NISE assistance request; official provider tracking uses a separate acknowledgement after submission.</p>
    {available&&<div className="pan49-open-card">
      <div className="pan49-open-card__info">
        <span className="pan49-open-card__icon"><FileText size={23}/></span>
        <div><strong>Your saved Form 49A is available</strong>
          <p>Re-open both document pages after submission, inspect entries, and print a copy.</p>
        </div>
      </div>
      <button type="button" className="pan49-open-card__button" onClick={()=>setShowPreview(true)}><Eye size={17}/> Open saved preview</button>
      {editReference&&<Link className="btn btn--ghost btn--sm" href={`/pan/49a?edit=${encodeURIComponent(editReference)}`}><Pencil size={15}/> Edit and re-verify</Link>}
    </div>}
    <dl className="pan-review">
      {Object.entries(labels).map(([key,label])=>{
        const value=parsed.data[key as keyof typeof parsed.data];
        return <div key={key}><dt>{label}</dt><dd>{key==="service"?panServiceLabels[parsed.data.service]:
          Array.isArray(value)?value.join(", ")||"None selected":String(value||"Not provided")}</dd></div>;
      })}
    </dl>
    {available&&<Pan49AModal open={showPreview} pan={parsed.data} answers={intake!.answers!} onClose={()=>setShowPreview(false)}/>}
  </section>;
}
