"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Eye, EyeOff, FileDown, FileText, ShieldCheck } from "lucide-react";
import { INDIA_STATES } from "@/lib/india-geo";
import { intakeFields, intakeSections, validateDetailedIntake, type DetailedIntake, type IntakeField, type IntakeValue } from "@/lib/detailed-intake";
import { newIdempotencyKey } from "@/lib/client-id";
import { rememberReturn } from "@/lib/after-login";
import { clearTemporaryVoterDraft, readTemporaryVoterDraft, saveTemporaryVoterDraft } from "@/lib/voter-browser-draft";
import { secureApi, secureUpload, SecureApiError } from "@/lib/secure-api-client";
import VoterForm8Modal from "@/components/voter-form8-modal";
import VoterForm6Preview from "@/components/voter-form6-preview";
import "./voter-form6.css";

type Props={signedIn:boolean;demo:boolean;maxDate:string};
type Response={request:{reference:string}};
const makeBlank=():DetailedIntake=>({kind:"voter-form6",answers:{constituencyType:"Assembly"},documents:[]});
const stages=["Elector details","Present residence","Family & accessibility","Declarations","Review and submit"];
const pageTitles=["Personal particulars and supporting age proof","Address, family member and declaration","Supplementary SIR declaration"];
const uploadTypes=["application/pdf","image/jpeg","image/png","image/webp"];

export default function VoterForm6({signedIn,demo,maxDate}:Props){
  const router=useRouter();
  const [intake,setIntake]=useState<DetailedIntake>(makeBlank);
  const [step,setStep]=useState(0);
  const [touched,setTouched]=useState<string[]>([]);
  const [errors,setErrors]=useState<Record<string,string>>({});
  const [message,setMessage]=useState("");
  const [photo,setPhoto]=useState<File|null>(null);
  const [photoUrl,setPhotoUrl]=useState("");
  const photoVersion=useRef(0);

  const [proof,setProof]=useState<File|null>(null);
  const [showAadhaar,setShowAadhaar]=useState(false);
  const [showPreview,setShowPreview]=useState(false);
  const [reviewed,setReviewed]=useState(false);
  const [confirmed,setConfirmed]=useState(false);
  const [busy,setBusy]=useState(false);
  const [reference,setReference]=useState("");
  const [revisionOf,setRevisionOf]=useState("");
  const requestKey=useRef<string|null>(null);
  useEffect(()=>{
    if(!signedIn || demo)return;
    let cancelled=false;
    void readTemporaryVoterDraft("voter-form6").then(draft=>{
      if(cancelled || !draft)return;
      const problems=validateDetailedIntake(draft.photo?{...draft.intake,photoFileId:"restored-photo"}:draft.intake);
      if(Object.keys(problems).length)return;
      setIntake(draft.intake);
      setPhoto(draft.photo);
      setProof(draft.proof);
      setPhotoUrl("");
      const version=++photoVersion.current;
      if(draft.photo){
        const reader=new FileReader();
        reader.onload=()=>{if(version===photoVersion.current && typeof reader.result==="string")setPhotoUrl(reader.result);};
        reader.readAsDataURL(draft.photo);
      }
      setStep(4);
      setTouched([]);
      setErrors({});
      setReviewed(false);
      setConfirmed(false);
      setMessage("Signed in successfully. Your completed Form 6 was restored. Review all three pages.");
      setShowPreview(true);
    }).catch(()=>{if(!cancelled)setMessage("Your temporary form could not be restored. Please check your details.");});
    return ()=>{cancelled=true;};
  },[signedIn,demo]);
  const sections=intakeSections("voter-form6");
  const answers=intake.answers;
  const active=intakeFields("voter-form6",answers);
  const visible=new Set(active.map(f=>f.id));
  const problems=validateDetailedIntake(photo?{...intake,photoFileId:"local-photo-selected"}:intake);
  const errorFor=(id:string)=>errors[id]||(touched.includes(id)?problems[id]:"");
  function dateToIso(value:string){const m=/^(\d\d)\/(\d\d)\/(\d{4})$/.exec(value);return m?m[3]+"-"+m[2]+"-"+m[1]:"";}
  function choosePhoto(file:File|null){
    setPhoto(file);setPhotoUrl("");
    const version=++photoVersion.current;
    if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{if(version===photoVersion.current&&typeof reader.result==="string")setPhotoUrl(reader.result);};
    reader.readAsDataURL(file);
    setReviewed(false);setConfirmed(false);requestKey.current=null;
  }
  function changeAnswer(f:IntakeField,value:string){
    let nextValue=value;
    if(["mobile","relativeMobile","aadhaarNumber","addressPin"].includes(f.id)){
      nextValue=value.replace(/\D/g,"").slice(0,f.id==="aadhaarNumber"?12:f.id==="addressPin"?6:10);
    }
    const next: IntakeValue={...answers,[f.id]:nextValue};
    const allowed=new Set(intakeFields("voter-form6",next).map(field=>field.id));
    Object.keys(next).forEach(key=>{if(!allowed.has(key))delete next[key];});
    setIntake(current=>({...current,answers:next}));
    setTouched(t=>t.includes(f.id)?t:[...t,f.id]);
    setErrors({});setMessage("");setReviewed(false);setConfirmed(false);requestKey.current=null;
  }
  function jumpToError(key:string){
    const target=key==="photoFileId"?0:Math.max(0,sections.findIndex(sec=>sec.fields.some(f=>f.id===key)));
    const screen=target>3?3:target;
    setStep(screen);
    requestAnimationFrame(()=>{document.getElementById("f6-"+(key==="photoFileId"?"photo":key))?.scrollIntoView({block:"center",behavior:"smooth"});});
  }
  async function advance(){
    const keys=new Set(sections[step]?.fields.map(f=>f.id).filter(k=>visible.has(k))??[]);
    if(step===0)keys.add("photoFileId");
    if(step===3)sections[4].fields.forEach(f=>{if(visible.has(f.id))keys.add(f.id);});
    const subset=Object.fromEntries(Object.entries(problems).filter(([key])=>keys.has(key)));
    if(Object.keys(subset).length){
      setErrors(subset);setTouched(t=>[...new Set([...t,...Object.keys(subset)])]);
      setMessage("Please complete the highlighted fields before continuing.");
      jumpToError(Object.keys(subset)[0]);return;
    }
    setErrors({});setMessage("");setStep(Math.min(step+1,4));
    if(step===3)await requestPreview();
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function renderField(f:IntakeField){
    if(!visible.has(f.id))return null;
    const error=errorFor(f.id),value=answers[f.id]||"",isDate=f.type==="date";
    return <label className={"f6-input"+(error?" f6-invalid":"")+(f.type==="textarea"?" f6-wide":"")} key={f.id} htmlFor={"f6-"+f.id}>
      <span>{f.label}{f.required?" *":""}</span>
      {f.type==="select"?<select id={"f6-"+f.id} value={value} onChange={e=>changeAnswer(f,e.target.value)}
        onBlur={()=>setTouched(t=>[...new Set([...t,f.id])])} aria-invalid={Boolean(error)}>
          <option value="">Select an option</option>{f.options?.map(opt=><option value={opt} key={opt}>{opt}</option>)}
        </select>:f.type==="textarea"?<textarea id={"f6-"+f.id} value={value} rows={3} onChange={e=>changeAnswer(f,e.target.value)}/>:
        <div className="f6-field-control">
          <input id={"f6-"+f.id} type={f.id==="aadhaarNumber"&&!showAadhaar?"password":f.type==="date"?"text":f.type||"text"}
            inputMode={isDate||/mobile|Pin|aadhaarNumber/i.test(f.id)?"numeric":undefined}
            autoComplete="off" list={["addressState","birthState"].includes(f.id)?"f6-india-states":undefined}
            value={value} maxLength={isDate?10:f.id==="aadhaarNumber"?12:250}
            onChange={e=>changeAnswer(f,e.target.value)}
            onBlur={()=>setTouched(t=>[...new Set([...t,f.id])])}
            placeholder={isDate?"DD/MM/YYYY":undefined} aria-invalid={Boolean(error)}/>
          {f.id==="aadhaarNumber"&&<button type="button" aria-label={showAadhaar?"Hide Aadhaar":"Show Aadhaar"} onClick={()=>setShowAadhaar(s=>!s)}>{showAadhaar?<EyeOff size={16}/>:<Eye size={16}/>}</button>}
          {isDate&&<div className="f6-calendar"><CalendarDays size={15}/>
            <input type="date" aria-label={"Pick "+f.label} min="1900-01-01" max={maxDate}
              value={dateToIso(value)} onChange={e=>{if(e.target.value)changeAnswer(f,e.target.value.split("-").reverse().join("/"));}}/></div>}
          {["addressState","birthState"].includes(f.id)&&<datalist id="f6-india-states">{INDIA_STATES.map(s=><option key={s} value={s}/>)}</datalist>}
        </div>}
      {error&&<small role="alert" className="f6-error">{error}</small>}
    </label>;
  }
  async function requestPreview(){
    const issues=validateDetailedIntake(photo?{...intake,photoFileId:"local-photo-selected"}:intake);
    if(Object.keys(issues).length){
      setErrors(issues);setTouched(t=>[...new Set([...t,...Object.keys(issues)])]);
      setMessage("Please complete all highlighted fields before previewing.");
      jumpToError(Object.keys(issues)[0]);return;
    }
    if(signedIn&&!demo){setMessage("");setShowPreview(true);return;}
    if(demo){setMessage("Sign in with a regular account to preview your completed Form 6.");return;}
    setBusy(true);setMessage("Saving your completed Form 6 securely for sign-in…");
    try{
      await saveTemporaryVoterDraft("voter-form6",{intake,photo,proof});
      rememberReturn("/voter/form-6");
      router.push("/login");
    }catch(error){
      setMessage(error instanceof Error?error.message:"Your temporary form could not be saved. No data was discarded.");
    }finally{setBusy(false);}
  }
  async function submit(){
    if(Object.keys(problems).length){
      setErrors(problems);setTouched(t=>[...new Set([...t,...Object.keys(problems)])]);
      setMessage("Please correct the incomplete fields before saving.");
      jumpToError(Object.keys(problems)[0]);return;
    }
    if(!reviewed){setMessage("Review all three pages of the document before saving.");setShowPreview(true);return;}
    if(!confirmed){setMessage("Confirm that the applicant has checked every detail.");return;}
    if(!signedIn){rememberReturn("/voter/form-6");router.push("/login");return;}
    if(demo){setMessage("The demo account cannot save real requests.");return;}
    setBusy(true);setMessage("");
    try{
      if(!photo||!uploadTypes.includes(photo.type)||photo.size>5*1024*1024||!photo.size)throw new Error("Attach a valid photograph under 5 MB.");
      const photoFileId=(await secureUpload<{file:{id:string}}>("U7b3R8mQ4zL1",photo)).file.id;
      let fileId:string|undefined;
      if(proof){
        if(!uploadTypes.includes(proof.type)||proof.size>20*1024*1024||!proof.size)throw new Error("Upload a valid PDF or image of up to 20 MB.");
        fileId=(await secureUpload<{file:{id:string}}>("U7b3R8mQ4zL1",proof)).file.id;
      }
      requestKey.current??=newIdempotencyKey();
      const result=await secureApi<Response>("S5w2J9nF3kL7",{
        serviceSlug:"voter-id",
        description:"Form 6 new voter registration preparation and assistance",
        contactName:[answers.firstNameEnglish,answers.middleNameEnglish,answers.surnameEnglish].filter(Boolean).join(" "),
        contactPhone:answers.mobile||answers.relativeMobile,
        preferredContact:"whatsapp",
        intake:{...intake,photoFileId},
        ...(fileId?{fileId}:{}),
        idempotencyKey:requestKey.current,
      });
      setReference(result.request.reference);setRevisionOf("");
      void clearTemporaryVoterDraft("voter-form6").catch(()=>undefined);
      window.scrollTo({top:0,behavior:"smooth"});
    }catch(error){
      if(error instanceof SecureApiError&&error.status===401){rememberReturn("/voter/form-6");router.push("/login");return;}
      if(error instanceof SecureApiError&&error.body&&typeof error.body==="object"&&"fields" in error.body){
        const fields=(error.body as {fields?:Record<string,string>}).fields;
        if(fields){setErrors(fields);jumpToError(Object.keys(fields)[0]||"firstNameEnglish");}
      }
      setMessage(error instanceof Error?error.message:"Unable to save this assistance request.");
    }finally{setBusy(false);}
  }
  const summary=[sections[0],sections[1],sections[2],sections[3],sections[4]];
  return <div className="form8-workspace f6-workspace">
    <div className="form8-intro">
      <Link href="/voter">Voter services</Link> / Form 6
      <h1>New voter registration — Form 6</h1>
      <p>Complete the application once. Verify it against the two Form 6 pages and the supplementary declaration shown in your reference PDF.</p>
      <div className="f8-warning"><ShieldCheck size={17}/> This is Nise Comport assistance. Only the Election Commission of India can accept an official application and issue an acknowledgement.</div>
      {revisionOf&&<div className="f8-warning">Editing a new copy of {revisionOf}. Original request unchanged.</div>}
    </div>
    {reference?<section className="f8-success">
      <Check size={32}/><h2>Assistance request saved</h2>
      <p>Nise Comport reference: <b>{reference}</b>. This is not an ECI acknowledgement number.</p>
      <div className="f8-actions">
        <button type="button" onClick={()=>setShowPreview(true)}><Eye size={17}/> Reopen Form 6</button>
        <button type="button" className="f8-secondary" onClick={()=>window.print()}><FileDown size={17}/> Print / Save PDF</button>
        <button type="button" className="f8-secondary" onClick={()=>{
          setRevisionOf(reference);setReference("");setStep(0);setConfirmed(false);setReviewed(false);requestKey.current=null;
        }}>Edit a new copy</button>
        <Link href="/profile#requests">View saved requests</Link>
      </div>
      <VoterForm6Preview answers={answers} photoUrl={photoUrl}/>
    </section>:<>
      <nav className="f8-progress f6-progress" aria-label="Form 6 steps">{stages.map((stage,i)=><button key={stage} type="button"
        className={step===i?"active":i<step?"complete":""} onClick={()=>{if(i<step){setStep(i);setMessage("");}}}
        disabled={i>step}>{i+1}. {stage}</button>)}</nav>
      <div className="f8-layout">
        <section className="f8-editor"><h2>{step===4?"Check the complete application":sections[step].title}</h2>
          {step<4&&<div className="f8-inline-preview"><span><Eye size={17}/> Live filled three-page document</span>
            <button type="button" onClick={()=>void requestPreview()}>Open preview</button></div>}
          {step<4&&<div className="f6-input-grid">{sections[step].fields.map(renderField)}
            {step===3&&<div className="f6-wide f6-sir-guidance"><h3>Supplementary SIR declaration</h3>
              <p>The uploaded Form 6 examples include a third-page SIR declaration. Choose whether this supplementary declaration applies; if yes, complete its available historical electoral-roll and family details.</p></div>}
            {step===3&&sections[4].fields.map(renderField)}
            {step===0&&<div className="f6-photo-field f6-wide">
              <label htmlFor="f6-photo">Recent passport-size colour photograph (JPG/PNG/WebP up to 5 MB) *</label>
              <input id="f6-photo" type="file" accept="image/jpeg,image/png,image/webp"
                onChange={e=>choosePhoto(e.target.files?.[0]??null)}/>
              {photo&&<small>{photo.name}</small>}{errorFor("photoFileId")&&<small className="f6-error">{errorFor("photoFileId")}</small>}
            </div>}
            {step===3&&<div className="f6-photo-field f6-wide">
              <label htmlFor="f6-proof">Combined date-of-birth and residence proof (PDF or image, up to 20 MB)</label>
              <input id="f6-proof" type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={e=>setProof(e.target.files?.[0]??null)}/>
              <small>Use a single combined PDF when providing multiple proofs. The selected proof types are recorded above.</small>
              {proof&&<small>{proof.name}</small>}
            </div>}
          </div>}
          {step===4&&<div className="f8-review">
            <div className="f8-final-preview"><div><b>Ready for a three-page Form 6 preview</b>
              <p>{reviewed?"All three pages reviewed.":"Open, check both application pages and the supplementary declaration, then select Done reviewing."}</p></div>
              <button type="button" onClick={()=>void requestPreview()}><Eye size={17}/> {reviewed?"Reopen":"Open final preview"}</button>
            </div>
            {summary.map((section,i)=><details key={section.title} className="f6-review-section" open={i===0?true:undefined}>
              <summary>{section.title}</summary><dl>{section.fields.filter(f=>visible.has(f.id)&&answers[f.id]).map(f=><div key={f.id}><dt>{f.label}</dt><dd>{f.id==="aadhaarNumber"?"••••••••"+answers[f.id].slice(-4):answers[f.id]}</dd></div>)}</dl>
            </details>)}
            <label className="f8-confirm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>
              Applicant has checked all particulars and understands that an official ECI acknowledgement is issued separately.</label>
          </div>}
          {message&&<p className="f8-alert" role="alert">{message}</p>}
          <div className="f8-actions">
            {step>0&&<button type="button" className="f8-secondary" onClick={()=>{setStep(n=>n-1);setMessage("");}}><ChevronLeft size={17}/> Back</button>}
            {step<4?<button type="button" onClick={advance}>Continue <ChevronRight size={17}/></button>:
              <button type="button" onClick={submit} disabled={busy}><FileText size={17}/>{busy?"Saving securely…":"Save assistance request"}</button>}
          </div>
          {step===4&&!signedIn&&<p className="f8-hint">Complete all fields, then sign in to unlock the preview. Your draft and attachments are protected in temporary encrypted browser storage during sign-in (30-minute expiry).</p>}
        </section>
        <aside className="f8-preview-rail">
          <div className="f8-preview-heading"><h2>Form 6 · Live preview</h2><button type="button" onClick={()=>void requestPreview()}><Eye size={15}/> Expand</button></div>
          {signedIn&&!demo&&!Object.keys(problems).length&&reviewed ?
            <VoterForm6Preview answers={answers} photoUrl={photoUrl}/> :
            <div className="f8-preview-locked"><ShieldCheck size={31}/>
              <b>Preview available after completion and sign-in</b>
              <p>Complete the new-voter application, then click Preview. After successful sign-in, this form and its photo will reopen automatically.</p>
            </div>}
        </aside>
      </div>
    </>}
    <VoterForm8Modal open={showPreview&&signedIn&&!demo&&!Object.keys(problems).length} onClose={()=>setShowPreview(false)}
      onEdit={reference?undefined:()=>{setShowPreview(false);setStep(0);setReviewed(false);setConfirmed(false);}}
      onReviewed={()=>{setReviewed(true);setMessage("");}}
      formTitle="Voter Form 6" pageTitles={pageTitles}>
      <VoterForm6Preview answers={answers} photoUrl={photoUrl}/>
    </VoterForm8Modal>
  </div>;
}
