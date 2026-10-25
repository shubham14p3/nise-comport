"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Eye, EyeOff, FileDown, FileText, ShieldCheck } from "lucide-react";
import VoterForm8Modal from "@/components/voter-form8-modal";
import { INDIA_STATES } from "@/lib/india-geo";
import {
  FORM8_CORRECTIONS, form8CorrectionNames, intakeFields, intakeSections,
  validateDetailedIntake, type DetailedIntake, type IntakeField, type IntakeValue,
} from "@/lib/detailed-intake";
import { newIdempotencyKey } from "@/lib/client-id";
import { rememberReturn } from "@/lib/after-login";
import { secureApi, secureUpload, SecureApiError } from "@/lib/secure-api-client";

type Props = { signedIn: boolean; demo: boolean };
type RequestResult = { request: { reference: string } };
const blank: DetailedIntake = { kind: "voter-form8", answers: { constituencyType: "Assembly" }, documents: [] };
const requestSections: Record<string, number> = {
  "Shift residence": 1, Correction: 2, "Replacement EPIC": 3, "Disability marking": 4,
};
const labels = ["Applicant & request", "Request details", "Documents & declaration", "Verify & preview"];
const maxPhotoBytes = 5 * 1024 * 1024;
const proofTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const dash = (value?: string) => value?.trim() || "________________________";
const item = (label: string, value?: string) => <div className="f8-field"><span>{label}</span><strong>{dash(value)}</strong></div>;
const tick = (yes: boolean) => <span className="f8-tick" aria-label={yes ? "Selected" : "Not selected"}>{yes ? "✓" : ""}</span>;

function Form8Print({ answers: a, photoUrl }: { answers: IntakeValue; photoUrl: string }) {
  const selected = form8CorrectionNames(a);
  const types = [
    ["Shift residence", "Shifting of Residence"],
    ["Correction", "Correction of Entries in Existing Electoral Roll"],
    ["Replacement EPIC", "Issue of Replacement EPIC without correction"],
    ["Disability marking", "Request for marking as Person with Disability"],
  ] as const;
  const proofRows = FORM8_CORRECTIONS.filter(([name]) => selected.includes(name)).map(([name, field, proof]) => ({
    name, value: a[field], proof: a[proof],
  }));
  return <div className="form8-preview" aria-label="Two page Form 8 preparation draft">
    <article className="form8-sheet">
      <div className="f8-watermark" aria-hidden="true">DRAFT · NOT ECI ACKNOWLEDGEMENT</div>
      <div className="f8-meta"><span>Acknowledgement Number: <b>Issued by ECI after filing</b></span><span>Submission Date: <b>Not submitted to ECI</b></span></div>
      <header className="f8-header">
        <b>FORM 8</b>
        <small>(See Rules 13(3) and (26) of the Registration of Electors Rules, 1960)</small>
        <strong>भारत निर्वाचन आयोग · ELECTION COMMISSION OF INDIA</strong>
        <h2>Voter Application Form for Shifting of Residence / Correction of Entries in Existing Electoral Roll / Replacement of EPIC / Marking of PwD</h2>
      </header>
      <section className="f8-part">
        <p>To, The Electoral Registration Officer</p>
        <div className="f8-row">{item(a.constituencyType === "Assembly" ? "Assembly Constituency No." : "Parliamentary Constituency No.", a.constituencyNumber)}{item("Name",a.constituencyName)}</div>
      </section>
      <section className="f8-part">
        {item("(I) Name of the applicant",a.applicantName)}
        {item("EPIC No.",a.epicNumber)}
        <p>Aadhaar Details (tick appropriate box):</p>
        <p>{tick(a.aadhaarStatus === "Have Aadhaar")} Aadhaar Number: {a.aadhaarStatus === "Have Aadhaar" ? dash(a.aadhaarNumber) : "____________"}</p>
        <p>{tick(a.aadhaarStatus === "Do not have Aadhaar")} I cannot furnish Aadhaar because I do not have an Aadhaar number</p>
        {item("Mobile No. of Self",a.mobile)}
        {item("Mobile No. of Father/Mother/Other relative",a.relativeMobile)}
        {item("Email ID of Self",a.email)}
        {item("Email ID of Father/Mother/Other relative",a.relativeEmail)}
      </section>
      <section className="f8-part">
        <b>(II) I submit application for (tick one)</b>
        <div className="f8-choices">{types.map(([value,name],i)=><p key={value}>{i+1}. {tick(a.requestType===value)} {name}</p>)}</div>
      </section>
      <section className="f8-part">
        <h3>1. Application for Shifting of Residence</h3>
        <p>I have shifted my residence and request that my name be moved to the present address given below, and a replacement EPIC issued where applicable.</p>
        <div className="f8-row">{item("House / Building / Apartment No.",a.requestType==="Shift residence"?a.addressHouse:"")}{item("Street / Area / Locality / Mohalla / Road",a.requestType==="Shift residence"?a.addressStreet:"")}</div>
        <div className="f8-row">{item("Town / Village",a.requestType==="Shift residence"?a.addressTown:"")}{item("Post Office",a.requestType==="Shift residence"?a.addressPostOffice:"")}</div>
        <div className="f8-row">{item("PIN Code",a.requestType==="Shift residence"?a.addressPin:"")}{item("Tehsil / Taluka / Mandal",a.requestType==="Shift residence"?a.addressTehsil:"")}</div>
        <div className="f8-row">{item("District",a.requestType==="Shift residence"?a.addressDistrict:"")}{item("State / UT",a.requestType==="Shift residence"?a.addressState:"")}</div>
        <p>Self-attested address proof:</p>
        <p><b>{a.requestType==="Shift residence"?dash(a.addressProofType):"Not applicable"}</b>{a.addressProofOther ? " — "+a.addressProofOther : ""}</p>
        <small>Examples shown in the sample: utility bill, Aadhaar, bank/post office passbook, Indian passport, land records, registered rent/lease deed or sale deed.</small>
      </section>
      <footer className="f8-page-number">Preparation copy · Page 1 of 2 · No official acknowledgement issued</footer>
    </article>

    <article className="form8-sheet">
      <div className="f8-watermark" aria-hidden="true">DRAFT · NOT ECI ACKNOWLEDGEMENT</div>
      <section className="f8-part">
        <h3>2. Application for Correction of Entries in Existing Electoral Roll</h3>
        <p>Maximum of four entries/particulars can be corrected. Self-attested documentary proof should support each claim.</p>
        <div className="f8-choices f8-corrections">{FORM8_CORRECTIONS.map(([name])=><p key={name}>{tick(a.requestType==="Correction" && selected.includes(name))} {name}</p>)}</div>
        <div className="f8-photo">{photoUrl ? <Image src={photoUrl} alt="Applicant photograph preview" width={150} height={190} unoptimized/> : <p>SPACE FOR ONE RECENT PASSPORT SIZE UNSIGNED COLOR PHOTOGRAPH (4.5 × 3.5 CM), WHITE BACKGROUND. ONLY IF PHOTO IS CHANGED.</p>}</div>
        <p><b>The correct particulars in the entry to be corrected:</b></p>
        <table className="f8-table"><tbody>{[0,1,2,3].map(index => <tr key={index}><th>{String.fromCharCode(97+index)}.</th><td>{proofRows[index] ? proofRows[index].name+": "+dash(proofRows[index].value || (proofRows[index].name==="Photo"?"New photograph attached":"")) : ""}</td></tr>)}</tbody></table>
        <p><b>Name of document in support of above claim attached:</b></p>
        <table className="f8-table"><tbody>{[0,1,2,3].map(index => <tr key={index}><th>{String.fromCharCode(97+index)}.</th><td>{proofRows[index]?.proof || ""}</td></tr>)}</tbody></table>
        <p>I request a replacement EPIC if required due to a change in personal details and will return my old EPIC when required.</p>
      </section>
      <section className="f8-part">
        <h3>3. Application for Issue of Replacement EPIC without correction</h3>
        <p>My original EPIC is: {["Lost","Destroyed due to flood, fire or natural disaster","Mutilated"].map(name=><span className="f8-inline" key={name}>{tick(a.requestType==="Replacement EPIC" && a.replacementReason===name)} {name}</span>)}</p>
        <p>I will return the earlier EPIC if recovered and provide any applicable supporting evidence or police report.</p>
      </section>
      <section className="f8-part">
        <h3>4. Application for Marking Person with Disability</h3>
        <p>{["Locomotor","Visual","Deaf & Dumb","Other"].map(name=><span className="f8-inline" key={name}>{tick(a.requestType==="Disability marking" && a.disabilityType===name)} {name}</span>)}</p>
        {item("Percentage of disability",a.requestType==="Disability marking"?a.disabilityPercent:"")}
        {item("Other (description)",a.requestType==="Disability marking"?a.disabilityOther:"")}
        <p>Certificate attached: {tick(a.hasDisabilityCertificate==="Yes" && a.requestType==="Disability marking")} Yes {tick(a.hasDisabilityCertificate==="No" && a.requestType==="Disability marking")} No</p>
      </section>
      <section className="f8-part f8-declaration">
        <h3>DECLARATION</h3>
        <p>I HEREBY DECLARE that to the best of my knowledge and belief I am a citizen of India. I understand that making a statement which I know or believe to be false, or do not believe to be true, is punishable under Section 31 of the Representation of the People Act, 1950.</p>
        <div className="f8-row">{item("Date",a.declarationDate)}{item("Place",a.declarationPlace)}</div>
        <p>Accessibility instructions: in applicable cases under the Rights of Persons with Disabilities Act, 2016 and Rules, 2017, a signature or left-thumb impression of the elector or legal guardian is required.</p>
      </section>
      <section className="f8-part f8-receipt">
        <h3>Acknowledgement / Receipt for application</h3>
        <p>Official acknowledgement number, digitally signed application and ERO/AERO/BLO receipt are issued only through the Election Commission of India&apos;s authorised process.</p>
        {item("Name on preparation draft",a.applicantName)}
      </section>
      <footer className="f8-page-number">Preparation copy · Page 2 of 2 · NISE COMPORT is an independent assistance provider</footer>
    </article>
  </div>;
}

export default function VoterForm8({ signedIn, demo }: Props) {
  const router = useRouter();
  const [intake,setIntake] = useState<DetailedIntake>(blank);
  const [step,setStep] = useState(0);
  const [errors,setErrors] = useState<Record<string,string>>({});
  const [proof,setProof] = useState<File|null>(null);
  const [photo,setPhoto] = useState<File|null>(null);
  const [photoUrl,setPhotoUrl] = useState("");
  const [confirmed,setConfirmed] = useState(false);
  const [busy,setBusy] = useState(false);
  const [problem,setProblem] = useState("");
  const [reference,setReference] = useState("");
  const [revisionOf,setRevisionOf] = useState("");
  const [sampleMode,setSampleMode] = useState(false);
  const [showPreview,setShowPreview] = useState(false);
  const [reviewed,setReviewed] = useState(false);
  const [showAadhaar,setShowAadhaar] = useState(false);
  const [touched,setTouched] = useState<string[]>([]);
  const requestKey=useRef<string|null>(null);
  const sections=useMemo(()=>intakeSections("voter-form8"),[]);
  const answers=intake.answers;
  const requestSection=sections[requestSections[answers.requestType] ?? 2];
  const visible=new Set(intakeFields("voter-form8",answers).map(f=>f.id));
  const liveProblems=validateDetailedIntake(photo ? {...intake,photoFileId:"selected-local-photo"} : intake);
  const errorFor=(key:string) => errors[key] || (touched.includes(key) ? liveProblems[key] : "");
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,10);
  function dateAsIso(raw:string) {
    const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
    return m ? m[3]+"-"+m[2]+"-"+m[1] : "";
  }
  function markTouched(key:string){setTouched(current=>current.includes(key)?current:[...current,key]);}
  function focusError(key:string){
    const errorStep=key==="photoFileId" ? 1 : sections[0].fields.some(f=>f.id===key) ? 0
      : sections[5].fields.some(f=>f.id===key) ? 2 : 1;
    setStep(errorStep);
    requestAnimationFrame(()=>{
      const control=document.getElementById("form8-"+(key==="photoFileId"?"photo":key));
      control?.scrollIntoView({behavior:"smooth",block:"center"});
      control?.focus({preventScroll:true});
    });
  }

  const photoVersion=useRef(0);
  function choosePhoto(file:File|null) {
    setPhoto(file);
    setPhotoUrl("");
    const version=++photoVersion.current;
    if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
      if(version===photoVersion.current && typeof reader.result==="string")setPhotoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function setAnswers(next: IntakeValue) {
    const allowed=new Set(intakeFields("voter-form8",next).map(f=>f.id));
    for(const key of Object.keys(next)) if(!allowed.has(key)) delete next[key];
    setIntake(old=>({...old,answers:next}));
    setErrors({}); setProblem(""); setConfirmed(false); setReviewed(false); requestKey.current=null;
  }
  function setAnswer(field: IntakeField,value:string) {
    let next=value;
    if(field.id==="epicNumber") next=value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,10);
    else if(["aadhaarNumber","mobile","relativeMobile","correctMobile","addressPin","constituencyNumber"].includes(field.id)) {
      const max=field.id==="aadhaarNumber"?12:field.id==="addressPin"?6:field.id==="constituencyNumber"?4:10;
      next=value.replace(/\D/g,"").slice(0,max);
    }
    if(next)markTouched(field.id);
    setAnswers({...answers,[field.id]:next});
  }
  function showSampleCorrection() {
    setIntake({kind:"voter-form8",documents:[],answers:{
      applicantName:"EXAMPLE VOTER",epicNumber:"ABC1234567",constituencyType:"Assembly",constituencyNumber:"67",
      constituencyName:"EXAMPLE CONSTITUENCY",aadhaarStatus:"Do not have Aadhaar",
      mobile:"9000000000",email:"example@example.com",requestType:"Correction",
      corrections:"Relation Type|Relation Name|Mobile Number",
      correctRelationType:"Husband",correctRelationName:"EXAMPLE RELATIVE",correctMobile:"9123456789",
      proofRelationType:"Aadhaar",proofRelationName:"Aadhaar",
      declarationDate:"25/10/2026",declarationPlace:"Jamshedpur",declaration:"Yes",
    }});
    setReference("");setRevisionOf("");requestKey.current=null;
    setPhoto(null);setPhotoUrl("");setProof(null);setStep(1);setSampleMode(true);
    setConfirmed(false);setReviewed(false);setTouched([]);setErrors({});setProblem("");setShowPreview(true);
  }
  function clearSample(){
    setIntake(blank);setStep(0);setPhoto(null);setPhotoUrl("");setProof(null);
    setSampleMode(false);setConfirmed(false);setReviewed(false);setTouched([]);setErrors({});
    setShowPreview(false);setProblem("");requestKey.current=null;
  }
  function setCorrection(name: (typeof FORM8_CORRECTIONS)[number][0],checked:boolean){
    const current=form8CorrectionNames(answers);
    if(checked && current.length===4){setErrors({corrections:"Form 8 permits at most four correction particulars."});return;}
    const next=checked?[...current,name]:current.filter(x=>x!==name);
    const updated: IntakeValue = {...answers,corrections:next.join("|")};
    markTouched("corrections");
    if(checked && name==="Photo")updated.correctPhoto="Yes";
    if(!checked){
      const row=FORM8_CORRECTIONS.find(([label])=>label===name);
      if(row){delete updated[row[1]];delete updated[row[2]];}
      if(name==="Photo")choosePhoto(null);
    }
    setAnswers(updated);
  }
  function renderField(f: IntakeField) {
    if(!visible.has(f.id))return null;
    if(f.id==="corrections"){
      const selected=form8CorrectionNames(answers);
      return <fieldset className="f8-correction-input" key="corrections"><legend>Choose up to four particulars to correct *</legend>
        <div className="f8-options">{FORM8_CORRECTIONS.map(([name])=><label key={name}><input type="checkbox" checked={selected.includes(name)} onChange={event=>setCorrection(name,event.target.checked)}/>{name}</label>)}</div>
        <p className="f8-hint">{selected.length} of 4 selected</p>{errorFor("corrections")&&<small role="alert" className="f8-error">{errorFor("corrections")}</small>}
      </fieldset>;
    }
    if(f.id==="correctPhoto")return null;
    const id="form8-"+f.id;
    const error=errorFor(f.id);
    const isDate=f.type==="date" || f.id==="correctDob";
    return <label key={f.id} className={"f8-input"+(f.type==="textarea"?" f8-wide":"")+(error?" f8-input--invalid":"")}>
      <span>{f.label}{f.required?" *":""}</span>
      {f.type==="select"?
        <select id={id} value={answers[f.id]??""} onChange={e=>setAnswer(f,e.target.value)} onBlur={()=>markTouched(f.id)} aria-invalid={Boolean(error)}>
          <option value="">Select an option</option>{f.options?.map(option=><option key={option} value={option}>{option}</option>)}
        </select>:
        f.type==="textarea"?<textarea id={id} value={answers[f.id]??""} onChange={e=>setAnswer(f,e.target.value)} onBlur={()=>markTouched(f.id)} rows={3} maxLength={400}/>:
        <div className={isDate?"f8-date-input":f.id==="aadhaarNumber"?"f8-secret-input":"f8-input-control"}>
          <input id={id} type={f.id==="aadhaarNumber"&&!showAadhaar?"password":f.type==="date"?"text":f.type||"text"}
            list={f.id==="addressState"?"form8-india-states":undefined}
            inputMode={isDate || /Pin$|aadhaarNumber|constituencyNumber|disabilityPercent|Mobile|mobile/.test(f.id)?"numeric":undefined}
            maxLength={isDate?10:f.id==="aadhaarNumber"?12:400}
            placeholder={isDate?f.id==="correctDob"?"DD/MM/YYYY or age":"DD/MM/YYYY":undefined}
            autoComplete="off" value={answers[f.id]??""} onChange={e=>setAnswer(f,e.target.value)}
            onBlur={()=>markTouched(f.id)} aria-invalid={Boolean(error)} aria-describedby={error?id+"-error":undefined}/>
          {f.id==="aadhaarNumber"&&<button type="button" className="f8-inline-button" onClick={()=>setShowAadhaar(v=>!v)}
            aria-label={showAadhaar?"Hide Aadhaar number":"Show Aadhaar number"}>{showAadhaar?<EyeOff size={17}/>:<Eye size={17}/>}</button>}
          {isDate&&<div className="f8-calendar"><CalendarDays size={16} aria-hidden="true"/>
            <input type="date" aria-label={"Pick date for "+f.label} min="1900-01-01" max={today}
              value={dateAsIso(answers[f.id]??"")} onChange={e=>{
                const next=e.target.value;
                if(next){setAnswer(f,next.split("-").reverse().join("/"));markTouched(f.id);}
              }}/></div>}
          {f.id==="addressState"&&<datalist id="form8-india-states">{INDIA_STATES.map(state=><option key={state} value={state}/>)}</datalist>}
        </div>}
      {f.id==="aadhaarNumber"&&<small className="f8-hint">12 digits. Hidden on screen and stored encrypted with the request.</small>}
      {isDate&&<small className="f8-hint">{f.id==="correctDob"?"Enter DOB or age in completed years.":"Future dates are not allowed."}</small>}
      {error&&<small id={id+"-error"} className="f8-error" role="alert">{error}</small>}
    </label>;
  }
  function currentFields(){
    if(step===0)return sections[0].fields;
    if(step===1)return requestSection.fields;
    if(step===2)return sections[5].fields;
    return [];
  }
  function advance(){
    const found=liveProblems;
    const sectionIds=new Set(currentFields().filter(f=>visible.has(f.id)).map(f=>f.id));
    if(step===2 && answers.requestType==="Correction" && form8CorrectionNames(answers).includes("Photo"))sectionIds.add("photoFileId");
    const local=Object.fromEntries(Object.entries(found).filter(([id])=>sectionIds.has(id)));
    if(Object.keys(local).length){
      setErrors(local);setTouched(t=>[...new Set([...t,...Object.keys(local)])]);
      setProblem("Please correct the highlighted information.");
      focusError(Object.keys(local)[0]);
      return;
    }
    if(step===0 && !answers.requestType){setErrors({requestType:"Select what you need to do."});return;}
    setErrors({});setProblem("");setStep(n=>Math.min(3,n+1));
    if(step===2)setShowPreview(true);
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function validFile(file:File,limit:number){
    if(!proofTypes.includes(file.type)||file.size>limit||!file.size)throw new Error("Upload a PDF, JPG, PNG or WebP file within the size limit.");
  }
  async function submit(){
    const found=liveProblems;
    if(Object.keys(found).length){
      setErrors(found);setTouched(t=>[...new Set([...t,...Object.keys(found)])]);
      setProblem("Please review the form. Some details are incomplete or invalid.");
      focusError(Object.keys(found)[0]);
      return;
    }
    if(!reviewed){setProblem("Please inspect both preview pages and select Done reviewing.");setShowPreview(true);return;}
    if(!confirmed){setProblem("Please confirm that the applicant has verified the details.");return;}
    if(sampleMode){setProblem("This is fictional sample data. Clear the sample before saving a real request.");return;}
    if(!signedIn){rememberReturn("/voter/form-8");router.push("/login");return;}
    if(demo){setProblem("The demo account cannot submit actual requests.");return;}
    setBusy(true);setProblem("");
    try{
      let fileId:string|undefined;
      let photoFileId:string|undefined;
      if(proof){validFile(proof,20*1024*1024);fileId=(await secureUpload<{file:{id:string}}>("U7b3R8mQ4zL1",proof)).file.id;}
      if(photo){validFile(photo,maxPhotoBytes);photoFileId=(await secureUpload<{file:{id:string}}>("U7b3R8mQ4zL1",photo)).file.id;}
      const checked:DetailedIntake={...intake,...(photoFileId?{photoFileId}:{})};
      requestKey.current??=newIdempotencyKey();
      const response=await secureApi<RequestResult>("S5w2J9nF3kL7",{
        serviceSlug:"voter-id",
        description:"Form 8 preparation and assistance: "+answers.requestType,
        preferredContact:"whatsapp",
        contactName:answers.applicantName,
        contactPhone:answers.mobile || answers.relativeMobile,
        intake:checked,
        ...(fileId?{fileId}:{}),
        idempotencyKey:requestKey.current,
      });
      setReference(response.request.reference);
      setRevisionOf("");
      window.scrollTo({top:0,behavior:"smooth"});
    }catch(error){
      if(error instanceof SecureApiError && error.status===401){rememberReturn("/voter/form-8");router.push("/login");return;}
      if(error instanceof SecureApiError && error.body && typeof error.body==="object" && "fields" in error.body){
        const serverFields=(error.body as {fields?:Record<string,string>}).fields;
        if(serverFields){setErrors(serverFields);focusError(Object.keys(serverFields)[0]??"applicantName");}
      }
      setProblem(error instanceof Error?error.message:"Could not save the Form 8 assistance request.");
    }finally{setBusy(false);}
  }
  const heading=step===0?sections[0].title:step===1?requestSection.title:step===2?"Proof & declaration":"Verify each detail";
  return <div className="form8-workspace">
    <div className="form8-intro"><Link href="/services/voter-id">Voter ID services</Link><span> / Form 8</span>
      <h1>Voter Form 8 — prepare, verify & preview</h1>
      <p>Fill details once and review them in a two-page document based on the uploaded Form 8 sample. Corrections, address shifting, replacement EPIC and disability marking are handled separately.</p>
      <div className="f8-warning"><ShieldCheck size={18}/> This is an assisted preparation form, not the Election Commission of India portal. No official acknowledgement or submission date is created here.</div>
    </div>
    {reference ? <section className="f8-success">
      <Check size={32}/><h2>Assistance request saved</h2>
      <p>NISE COMPORT reference: <b>{reference}</b>. This is not an ECI acknowledgement number.</p>
      <div className="f8-actions"><button type="button" onClick={()=>window.print()}><FileDown size={16}/> Print / Save draft as PDF</button><Link href="/account">View account</Link></div>
      <Form8Print answers={answers} photoUrl={photoUrl}/>
    </section> : <>
      <nav className="f8-progress" aria-label="Application steps">{labels.map((label,index)=><button type="button" key={label} className={index===step?"active":index<step?"complete":""} onClick={()=>{if(index<step){setStep(index);setErrors({});}}} disabled={index>step}>{index+1}. {label}</button>)}</nav>
      <div className="f8-layout">
        <div className="f8-editor">
          <h2>{heading}</h2>
          {step===0&&<p className="f8-hint">Enter the elector&apos;s current details from their existing voter record. Do not use the sample applicant&apos;s details.</p>}
          {(step===0||step===1||step===2)&&<div className="f8-input-grid">
            {currentFields().map(renderField)}
            {step===2&&<div className="f8-file f8-wide">
              <label htmlFor="form8-proof">Supporting proof (one PDF or image, up to 20 MB)</label>
              <input id="form8-proof" type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={e=>{setProof(e.target.files?.[0]??null);requestKey.current=null;}}/>
              <p className="f8-hint">Upload the self-attested evidence for the requested change. If there are multiple proofs, staff can arrange the remaining documents separately.</p>
              {proof&&<small>{proof.name}</small>}
            </div>}
            {((step===1&&answers.requestType==="Correction"&&form8CorrectionNames(answers).includes("Photo"))||step===2&&answers.requestType==="Correction"&&form8CorrectionNames(answers).includes("Photo"))&&<div className="f8-file f8-wide">
              <label htmlFor="form8-photo">New photograph (JPG, PNG, WebP; up to 5 MB) *</label>
              <input id="form8-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{choosePhoto(e.target.files?.[0]??null);requestKey.current=null;}}/>
              {photo&&<small>{photo.name}</small>}{errors.photoFileId&&<small className="f8-error">{errors.photoFileId}</small>}
            </div>}
          </div>}
          {step===3&&<div className="f8-review">
            <p>Read both pages of the preview, including the selected Form 8 section and all proof references. Fix any incorrect values before saving.</p>
            <div className="f8-review-grid">{sections.filter((section,index)=>index===0||index===5||index===requestSections[answers.requestType]).map(section=><div key={section.title}><h3>{section.title}</h3>
              {section.fields.filter(f=>visible.has(f.id)&&f.id!=="corrections"&&f.id!=="correctPhoto").map(f=><p key={f.id}><span>{f.label}</span><b>{dash(answers[f.id])}</b></p>)}
            </div>)}</div>
            <label className="f8-confirm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> The applicant has reviewed the details and understands that only the official ECI process can submit the application and issue an acknowledgement.</label>
          </div>}
          {problem&&<p className="f8-alert" role="alert">{problem}</p>}
          <div className="f8-actions">
            {step>0&&<button type="button" className="f8-secondary" onClick={()=>{setStep(n=>n-1);setProblem("");setErrors({});}}><ChevronLeft size={17}/> Back</button>}
            {step<3?<button type="button" onClick={advance}>Continue <ChevronRight size={17}/></button>:<>
              <button type="button" className="f8-secondary" onClick={()=>window.print()}><FileDown size={17}/> Print / Save as PDF</button>
              <button type="button" disabled={busy||!confirmed} onClick={submit}><FileText size={17}/>{busy?"Saving securely…":"Save assistance request"}</button>
            </>}
          </div>
          {step===3&&!signedIn&&<p className="f8-hint">You can preview and print without signing in. Sign-in is required to save data to your account. Unsaved form data is not stored in the browser.</p>}
        </div>
        <aside className="f8-preview-rail">
          <div className="f8-preview-heading"><h2>Live two-page preview</h2><button type="button" onClick={()=>window.print()}><FileDown size={15}/> Save PDF</button></div>
          <Form8Print answers={answers} photoUrl={photoUrl}/>
        </aside>
      </div>
    </>}
  </div>;
}
