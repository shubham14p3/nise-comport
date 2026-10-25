"use client";

import { useId } from "react";
import { intakeDocumentGuide, intakeFields, intakeSections, type DetailedIntake, type IntakeField } from "@/lib/detailed-intake";

type Props = {
  intake: DetailedIntake;
  onChange: (value: DetailedIntake) => void;
  errors?: Record<string,string>;
  photo?: File | null;
  onPhotoChange?: (file: File | null) => void;
};

export default function DetailedIntakeFields({ intake, onChange, errors = {}, photo, onPhotoChange }: Props) {
  const id = useId();
  const visible = new Set(intakeFields(intake.kind, intake.answers).map(field => field.id));
  function setAnswer(field: IntakeField, value: string) {
    const next = { ...intake.answers, [field.id]: value };
    // Drop dependent answers that have become hidden, so stale data cannot be submitted.
    const nextVisible = new Set(intakeFields(intake.kind, next).map(f=>f.id));
    for(const key of Object.keys(next)) if(!nextVisible.has(key)) delete next[key];
    onChange({ ...intake, answers: next });
  }
  return <div className="detailed-intake" aria-label={intake.kind+" application information"}>
    <div className="alert alert--info">Fill in the details for NISE COMPORT to prepare your application. This is not submission to the government portal. Dates use DD/MM/YYYY. Do not enter OTPs or passwords.</div>
    {intakeSections(intake.kind).map((section, index) => {
      const fields=section.fields.filter(f=>visible.has(f.id));
      if(!fields.length) return null;
      const invalid = fields.some(f=>Boolean(errors[f.id]));
      return <details className="detailed-intake__section" key={section.title} open={index===0 || invalid}>
        <summary><strong>{section.title}</strong><span>{fields.filter(f=>Boolean(intake.answers[f.id])).length}/{fields.filter(f=>f.required).length} required fields filled</span></summary>
        <div className="form-grid">
          {fields.map(f => {
            const fid=id+"-"+f.id;
            const value=intake.answers[f.id]??"";
            return <label key={f.id} className={f.type==="textarea"?"field field--full":"field"}>
              <span className="field__label">{f.label}{f.required ? " *" : ""}</span>
              {f.type==="select" ? <select id={fid} value={value} onChange={e=>setAnswer(f,e.target.value)} aria-invalid={Boolean(errors[f.id])}>
                <option value="">Choose…</option>{f.options?.map(o=><option value={o} key={o}>{o}</option>)}
              </select> : f.type==="textarea" ? <textarea id={fid} rows={3} maxLength={400} value={value} onChange={e=>setAnswer(f,e.target.value)} aria-invalid={Boolean(errors[f.id])}/>
              : <input id={fid} type={f.type==="date"?"text":(f.type??"text")} value={value}
                  placeholder={f.type==="date"?"DD/MM/YYYY":undefined}
                  inputMode={f.type==="date"||/Pin|aadhaarNumber|disabilityPercent/.test(f.id)?"numeric":undefined}
                  maxLength={f.type==="date"?10:/aadhaarNumber/.test(f.id)?12:400}
                  onChange={e=>setAnswer(f,e.target.value)} aria-invalid={Boolean(errors[f.id])}
                  autoComplete="off"/>}
              {f.hint && <span className="field__hint">{f.hint}</span>}
              {errors[f.id] && <span className="field__error" role="alert">{errors[f.id]}</span>}
            </label>;
          })}
        </div>
      </details>;
    })}
    {intake.kind==="voter" && intake.answers.requestType==="Correction" && intake.answers.correctionTarget==="Photograph" && <div className="field">
      <label className="field__label">New photograph (JPG, PNG, WebP) *</label>
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>onPhotoChange?.(e.target.files?.[0]??null)}/>
      {photo && <small>{photo.name} · {(photo.size/1024/1024).toFixed(1)} MB</small>}
      {errors.photoFileId && <span className="field__error" role="alert">{errors.photoFileId}</span>}
    </div>}
    <details className="detailed-intake__section" open>
      <summary><strong>Enclosures & document checklist</strong><span>Confirm what you have available</span></summary>
      <p className="field__hint">Illustrative checklist from the supplied application samples. Staff will verify the current accepted proofs with the issuing authority.</p>
      <div className="check-grid">{intakeDocumentGuide[intake.kind].map(item=><label className="check" key={item}>
        <input type="checkbox" checked={intake.documents.includes(item)} onChange={e=>onChange({...intake,documents:e.target.checked?[...intake.documents,item]:intake.documents.filter(v=>v!==item)})}/>
        <span>{item}</span>
      </label>)}</div>
    </details>
  </div>;
}
