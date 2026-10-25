"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, Eye, EyeOff, Search, ShieldCheck } from "lucide-react";
import "./pan-49a-fields.css";
import { COUNTRIES, citiesFor, statesFor } from "@/lib/india-geo";
import { intakeDocumentGuide, intakeFields, intakeSections, validateDetailedIntake, type DetailedIntake, type IntakeField } from "@/lib/detailed-intake";

type Props = {
  intake: DetailedIntake;
  onChange: (value: DetailedIntake) => void;
  errors?: Record<string,string>;
  photo?: File | null;
  onPhotoChange?: (file: File | null) => void;
};

const todayISO = () => {
  const now = new Date();
  return [now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
};
function toISO(raw: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return "";
  const [day,month,year]=raw.split("/");
  return `${year}-${month}-${day}`;
}
function fromISO(raw: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const [year,month,day]=raw.split("-");
  return `${day}/${month}/${year}`;
}

export default function DetailedIntakeFields({ intake, onChange, errors = {}, photo, onPhotoChange }: Props) {
  const id = useId().replaceAll(":","");
  const is49a = intake.kind === "pan49a" || intake.kind === "pan93";
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});
  const [touched,setTouched]=useState<Record<string,boolean>>({});
  const [attempted,setAttempted]=useState(false);
  const [showAadhaar,setShowAadhaar]=useState(false);
  const formRef=useRef<HTMLDivElement>(null);
  const visibleFields=intakeFields(intake.kind,intake.answers);
  const visible=new Set(visibleFields.map(field => field.id));
  const liveErrors=is49a?validateDetailedIntake(intake):{};
  const allErrors={...liveErrors,...errors};
  const nameAsAadhaar = [intake.answers.personFirst,intake.answers.personMiddle,intake.answers.personSurname]
    .filter(Boolean).join(" ").trim().replace(/\s+/g," ").toLowerCase();
  const aadhaarMismatch=is49a && intake.answers.aadhaarAllotted==="Yes" && intake.answers.aadhaarName?.trim()
    && nameAsAadhaar && nameAsAadhaar!==intake.answers.aadhaarName.trim().replace(/\s+/g," ").toLowerCase();

  useEffect(()=>{
    if(!Object.keys(errors).length) return;
    setAttempted(true);
    const toOpen:Record<string,boolean>={};
    const first=intakeSections(intake.kind).find(section=>section.fields.some(f=>errors[f.id]));
    if(first) {
      toOpen[first.title]=true;
      setExpanded(old=>Object.entries(toOpen).every(([key,v])=>old[key]===v)?old:{...old,...toOpen});
      const frame=requestAnimationFrame(()=>{
        const target=Array.from(formRef.current?.querySelectorAll<HTMLElement>("[data-intake-id]")||[])
          .find(element=>Object.keys(errors).includes(element.dataset.intakeId||""));
        target?.scrollIntoView({behavior:"smooth",block:"center"});
        target?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")?.focus({preventScroll:true});
      });
      return ()=>cancelAnimationFrame(frame);
    }
  },[errors,intake.kind]);

  function setAnswer(field: IntakeField, value: string) {
    let clean=value;
    if(is49a && (/Pin$/.test(field.id)||field.id==="aadhaarNumber"||field.id==="phoneCountryCode"||field.id==="phoneAreaCode")) {
      clean=value.replace(/\D/g,"").slice(0,field.id==="aadhaarNumber"?12:/Pin$/.test(field.id)?6:6);
    }
    const next={...intake.answers,[field.id]:clean};
    if(is49a) {
      if(["personFirst","personMiddle","personSurname"].includes(field.id)) {
        next.printedName=[next.personFirst,next.personMiddle,next.personSurname].filter(Boolean).join(" ").replace(/\s+/g," ").trim();
      }
      if(field.id==="communicationSameAsResidence") {
        next.communicationAddress=clean==="Yes"?"Residence":"";
      }
      if(field.id==="residenceCountry") {next.residenceState="";next.residenceCity="";}
      if(field.id==="residenceState") next.residenceCity="";
      if(field.id==="officeCountry") {next.officeState="";next.officeCity="";}
      if(field.id==="officeState") next.officeCity="";
      if(field.id==="raCountry") {next.raState="";next.raCity="";}
      if(field.id==="raState") next.raCity="";
      if(field.id==="aadhaarAllotted" && clean==="No") {delete next.aadhaarNumber;delete next.aadhaarName;}
    }
    const nextVisible=new Set(intakeFields(intake.kind,next).map(f=>f.id));
    for(const key of Object.keys(next)) if(!nextVisible.has(key)) delete next[key];
    onChange({...intake,answers:next});
    if(is49a) setTouched(old=>({...old,[field.id]:true}));
  }
  const geoOptions=(fieldId:string)=>{
    if(/Country$/.test(fieldId))return COUNTRIES;
    if(/State$/.test(fieldId))return statesFor(intake.answers[fieldId.replace(/State$/,"Country")]||"India");
    if(/City$/.test(fieldId))return citiesFor(
      intake.answers[fieldId.replace(/City$/,"Country")]||"India",
      intake.answers[fieldId.replace(/City$/,"State")]||""
    );
    return [];
  };

  function fieldControl(f:IntakeField) {
    const value=intake.answers[f.id]||"";
    const fid=id+"-"+f.id;
    const shownError=(is49a ? Boolean(touched[f.id] || attempted || errors[f.id]) : Boolean(errors[f.id])) ? allErrors[f.id] : "";
    const common={id:fid,"aria-invalid":Boolean(shownError) as boolean,"aria-describedby":shownError?fid+"-error":undefined};
    const selectedOptions=is49a?geoOptions(f.id):[];
    const isGeo=is49a&&/(Country|State|City)$/.test(f.id);
    const isDate=is49a&&f.type==="date";
    const isAadhaar=is49a&&f.id==="aadhaarNumber";
    const isGenerated=is49a&&f.id==="printedName";
    return <div className={f.type==="textarea"?"field field--full":"field"} key={f.id} data-intake-id={f.id}>
      <label className="field__label" htmlFor={fid}>{f.label}{f.required ? " *" : ""}</label>
      {isGenerated ? <input {...common} value={value} readOnly autoComplete="off" aria-readonly="true" title="Automatically combines first, middle and surname"/> :
      isDate ? <div className="intake-date">
        <input {...common} type="text" value={value} maxLength={10} inputMode="numeric" placeholder="DD/MM/YYYY"
          onChange={e=>setAnswer(f,e.target.value)} onBlur={()=>setTouched(old=>({...old,[f.id]:true}))} autoComplete="off"/>
        <label className="intake-date__picker"><CalendarDays size={18} aria-hidden="true"/><span className="sr-only">Choose date with calendar</span>
          <input type="date" aria-label={f.label+" — calendar"} value={toISO(value)} min="1900-01-01"
            max={todayISO()} onChange={e=>setAnswer(f,fromISO(e.target.value))}/>
        </label>
      </div> :
      f.type==="select" ? <select {...common} value={value} onChange={e=>setAnswer(f,e.target.value)}
          onBlur={()=>setTouched(old=>({...old,[f.id]:true}))}>
        <option value="">Choose…</option>{f.options?.map(o=><option key={o} value={o}>{o}</option>)}
      </select> :
      f.type==="textarea" ? <textarea {...common} value={value} rows={3} maxLength={400} onChange={e=>setAnswer(f,e.target.value)}
          onBlur={()=>setTouched(old=>({...old,[f.id]:true}))}/> :
      isAadhaar ? <div className="intake-sensitive">
        <input {...common} type={showAadhaar?"text":"password"} value={value} maxLength={12} inputMode="numeric"
          autoComplete="off" pattern="[0-9]{12}" placeholder="12-digit Aadhaar number"
          onChange={e=>setAnswer(f,e.target.value)} onBlur={()=>setTouched(old=>({...old,[f.id]:true}))}/>
        <button type="button" aria-label={showAadhaar?"Hide Aadhaar number":"Show Aadhaar number"} title={showAadhaar?"Hide number":"Show number"}
          aria-pressed={showAadhaar} onClick={()=>setShowAadhaar(current=>!current)}>{showAadhaar?<EyeOff size={18}/>:<Eye size={18}/>}</button>
      </div> :
      isGeo ? <div className="intake-geo">
        <input {...common} type="text" value={value} list={fid+"-options"} maxLength={100}
          placeholder={"Search or type "+f.label.toLowerCase()} autoComplete="off"
          onChange={e=>setAnswer(f,e.target.value)} onBlur={()=>setTouched(old=>({...old,[f.id]:true}))}/>
        <Search size={16} aria-hidden="true"/><datalist id={fid+"-options"}>{selectedOptions.map(o=><option key={o} value={o}/>)}</datalist>
      </div> :
      <input {...common} type={f.type==="date"?"text":f.type||"text"} value={value}
        placeholder={f.type==="date"?"DD/MM/YYYY":undefined}
        inputMode={f.type==="date"||/Pin|aadhaarNumber|disabilityPercent/.test(f.id)?"numeric":undefined}
        maxLength={is49a&&/Pin$/.test(f.id)?6:f.type==="date"?10:/aadhaarNumber/.test(f.id)?12:400}
        onChange={e=>setAnswer(f,e.target.value)}
        onBlur={()=>setTouched(old=>({...old,[f.id]:true}))} autoComplete="off"/>}
      {isGenerated&&<span className="field__hint">First name + middle name + surname, updated automatically.</span>}
      {isGeo&&<span className="field__hint">Type to filter suggested locations, or choose from the list.</span>}
      {f.hint&&<span className="field__hint">{f.hint}</span>}
      {f.id==="aadhaarName"&&aadhaarMismatch&&<span className="field__hint field__hint--warn" role="status">Aadhaar name differs from the applicant name. Compare the documents before submitting.</span>}
      {shownError&&<span className="field__error" id={fid+"-error"} role="alert">{shownError}</span>}
    </div>;
  }
  return <div ref={formRef} className={is49a?"detailed-intake detailed-intake--49a":"detailed-intake"} aria-label={intake.kind+" application information"}>
    <div className="alert alert--info">{is49a?
      "Fill the form in order. AO codes are optional, and the printed name is generated automatically. Dates use DD/MM/YYYY. No OTPs or passwords.":
      "Fill in the details for NISE COMPORT to prepare your application. This is not submission to the government portal. Dates use DD/MM/YYYY. Do not enter OTPs or passwords."}</div>
    {is49a&&<div className="intake-live-info"><ShieldCheck size={16}/> Live validation is active. Errors appear as you enter details and when you continue.</div>}
    {intakeSections(intake.kind).map((section,index)=>{
      const fields=section.fields.filter(f=>visible.has(f.id));
      if(!fields.length)return null;
      const invalid=fields.some(f=>Boolean(errors[f.id]||((touched[f.id]||attempted)&&liveErrors[f.id])));
      const complete=fields.filter(f=>f.required&&Boolean(intake.answers[f.id]?.trim())).length;
      const required=fields.filter(f=>f.required).length;
      return <details className={invalid?"detailed-intake__section detailed-intake__section--error":"detailed-intake__section"}
        key={section.title} open={expanded[section.title]??(index===0)}
        onToggle={event=>{
          const now=event.currentTarget.open;
          setExpanded(old=>old[section.title]===now?old:{...old,[section.title]:now});
        }}>
        <summary><strong>{section.title}</strong><span>{complete}/{required} required fields filled{invalid?" · Needs attention":""}</span></summary>
        <div className="form-grid">{fields.map(fieldControl)}</div>
      </details>;
    })}
    {intake.kind==="voter" && intake.answers.requestType==="Correction" && intake.answers.correctionTarget==="Photograph" && <div className="field">
      <label className="field__label">New photograph (JPG, PNG, WebP) *</label>
      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={!onPhotoChange} onChange={e=>onPhotoChange?.(e.target.files?.[0]??null)}/>
      {!onPhotoChange && <small>After signing in, return to this step to attach your photograph securely. File uploads are not stored in your browser draft.</small>}
      {photo&&<small>{photo.name} · {(photo.size/1024/1024).toFixed(1)} MB</small>}
      {errors.photoFileId&&<span className="field__error" role="alert">{errors.photoFileId}</span>}
    </div>}
    <details className="detailed-intake__section" defaultOpen>
      <summary><strong>Enclosures & document checklist</strong><span>Confirm what you have available</span></summary>
      <p className="field__hint">Staff will verify accepted proofs with the issuing authority.</p>
      <div className="check-grid">{intakeDocumentGuide[intake.kind].map(item=><label className="check" key={item}>
        <input type="checkbox" checked={intake.documents.includes(item)}
          onChange={e=>onChange({...intake,documents:e.target.checked?[...intake.documents,item]:intake.documents.filter(v=>v!==item)})}/>
        <span>{item}</span>
      </label>)}</div>
    </details>
  </div>;
}
