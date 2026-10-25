"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { intakeSections, protectedIntakeField, type DetailedIntake } from "@/lib/detailed-intake";

/** Render only for an authenticated customer after final-step permission checks. */
export default function DetailedIntakePreview({intake}:{intake:DetailedIntake}) {
  const [showIds,setShowIds]=useState(false);
  const answers=intake.answers;
  return <div className="application-preview" aria-label="Complete applicant questionnaire">
    <div className="application-preview__title">
      <div><h3>Completed application details</h3><p>Verify each value carefully. This is your private preview, not an official government submission.</p></div>
      <button type="button" className="btn btn--ghost btn--sm" aria-pressed={showIds} onClick={()=>setShowIds(x=>!x)}>
        {showIds?<EyeOff size={16}/>:<Eye size={16}/>} {showIds?"Hide ID numbers":"Reveal ID numbers"}
      </button>
    </div>
    {intakeSections(intake.kind).map(section=>{
      const fields=section.fields.filter(f=>(!f.show||f.show(answers)) && (answers[f.id]??"").trim());
      if(!fields.length)return null;
      return <details className="application-preview__section" key={section.title} open>
        <summary>{section.title}<span>{fields.length} fields</span></summary>
        <dl>{fields.map(f=>{
          const answer=answers[f.id]??"";
          const masked=protectedIntakeField(f.id)&&!showIds;
          return <div key={f.id}><dt>{f.label}</dt><dd>{masked?"•••• "+answer.slice(-4):answer}</dd></div>;
        })}</dl>
      </details>;
    })}
    <details className="application-preview__section" open>
      <summary>Documents and enclosures<span>{intake.documents.length}</span></summary>
      {intake.documents.length?<ul>{intake.documents.map(d=><li key={d}>{d}</li>)}</ul>:<p>No document types confirmed. Staff will verify the checklist.</p>}
    </details>
  </div>;
}
