"use client";

import { useEffect, useRef, useState } from "react";
import { FileCheck2, FileText } from "lucide-react";
import type { PanIntake } from "@/lib/pan-validation";
import "./pan-93-exact-preview.css";

/**
 * Background is extracted from the user's five real Form 93 examples without any
 * customer details, payment references, barcodes or signatures.
 * Unlike the legacy 49A recreation, this renders the identical blank Form 93 PDF.
 */
type Props={answers:Record<string,string>;pan:PanIntake;onEdit?:()=>void};
type Entry={page:1|2;x:number;y:number;w:number;h:number;value:string;chars?:boolean;boxCount?:number};
const field=(page:1|2,x:number,y:number,w:number,h:number,value:string,chars=true,boxCount?:number):Entry=>({page,x,y,w,h,value,chars,boxCount});
const upper=(s?:string)=>(s||"").trim().toUpperCase();
const isoDOB=(s:string)=>(/^\d{4}-\d{2}-\d{2}$/.test(s)?s.split("-").reverse().join("/"):s);
const noNonDigits=(v?:string)=> (v||"").replace(/\D/g,"");

function Entries({page,answers:a,pan}:{page:1|2;answers:Record<string,string>;pan:PanIntake}) {
  const date=(a.dob||isoDOB(pan.birthDate)).split("/");
  const n=(prefix:string,key:string)=>upper(a[prefix+key]);
  const applicant=upper(a.printedName||pan.fullName);
  const income=[["incomeSalary",181,807],["incomeBusiness",247,807],["incomeHouse",378,807],
    ["incomeCapital",182,826],["incomeOther",247,826],["incomeNone",378,826]] as const;
  const entries:Entry[]=[
    field(1,179,264,369,13,n("person","First")),
    field(1,179,278,369,12,n("person","Middle")),
    field(1,179,291,369,13,n("person","Surname")),
    field(1,179,314,369,13,upper(a.aadhaarName||applicant)),
    field(1,180,377,29,14,date[0]||"",true,2),
    field(1,218,377,29,14,date[1]||"",true,2),
    field(1,257,377,57,14,date[2]||"",true,4),
    // Aadhaar remains masked in customer-visible previews; official print is staff-controlled.
    field(1,179,415,369,14,upper(a.residenceHouse)),
    field(1,179,429,369,13,upper(a.residenceBuilding)),
    field(1,179,442,369,14,upper(a.residenceStreet)),
    field(1,179,455,369,14,upper(a.residenceLocality)),
    field(1,179,468,369,14,upper(a.residenceCity)),
    field(1,180,482,235,14,upper(a.residenceState)),
    field(1,460,482,90,14,noNonDigits(a.residencePin),true,6),
    field(1,238,495,311,14,upper(a.residenceCountry||"India"),false),
    field(1,180,514,369,14,upper(a.officeHouse)),
    field(1,179,528,369,14,upper(a.officeBuilding)),
    field(1,179,542,369,14,upper(a.officeStreet)),
    field(1,179,555,369,14,upper(a.officeLocality)),
    field(1,179,568,369,14,upper(a.officeCity)),
    field(1,180,582,236,14,upper(a.officeState)),
    field(1,460,582,90,14,noNonDigits(a.officePin),true,6),
    field(1,238,595,311,14,upper(a.officeCountry),false),
    field(1,234,718,97,14,noNonDigits(a.phoneCountryCode||"91")),
    field(1,420,718,154,14,noNonDigits(a.mobile||pan.phone)),
    field(1,180,739,334,13,upper(a.email||pan.email),false),
    field(1,179,767,90,14,noNonDigits(a.phoneAreaCode)),
    field(2,179,60,369,14,n("father","First")),
    field(2,179,73,369,14,n("father","Middle")),
    field(2,179,86,369,14,n("father","Surname")),
    field(2,179,110,369,14,n("mother","First")),
    field(2,179,123,369,14,n("mother","Middle")),
    field(2,179,137,369,14,n("mother","Surname")),
    field(2,189,221,42,14,upper(a.aoArea),true,3),
    field(2,273,221,30,14,upper(a.aoType)),
    field(2,339,221,42,14,upper(a.aoRange)),
    field(2,418,221,29,14,upper(a.aoNumber)),
    field(2,179,260,369,14,n("ra","First")),
    field(2,179,273,369,14,n("ra","Middle")),
    field(2,179,287,369,14,n("ra","Surname")),
    field(2,179,367,369,14,upper(a.raHouse)),
    field(2,179,380,369,14,upper(a.raBuilding)),
    field(2,179,393,369,14,upper(a.raStreet)),
    field(2,179,407,369,14,upper(a.raLocality)),
    field(2,179,420,369,14,upper(a.raCity)),
    field(2,179,434,237,14,upper(a.raState)),
    field(2,459,434,90,14,noNonDigits(a.raPin)),
    field(2,238,447,311,14,upper(a.raCountry),false),
    field(2,179,598,328,11,upper(a.identityProof),false),
    field(2,179,610,328,11,upper(a.addressProof),false),
    field(2,179,622,328,11,upper(a.birthProof),false),
    field(2,72,706,164,11,upper(a.declarationName||applicant),false),
    field(2,289,706,135,11,upper(a.declarationCapacity||"SELF"),false),
    field(2,78,750,135,12,upper(a.declarationPlace),false),
    field(2,78,771,113,10,upper(a.declarationDate),false),
  ];
  const checked: {page:1|2;x:number;y:number;yes:boolean}[]=[
    {page:1,x:186,y:366,yes:a.gender==="Male"},
    {page:1,x:236,y:366,yes:a.gender==="Female"},
    {page:1,x:296,y:366,yes:a.gender==="Transgender"},
    {page:1,x:186,y:626,yes:(a.residenceStatus||"Resident")==="Resident"},
    {page:1,x:251,y:626,yes:a.residenceStatus==="Non Resident"},
    {page:1,x:316,y:626,yes:a.residenceStatus==="Resident but Not ordinarily Resident"},
    ...income.map(([key,x,y])=>({page:1 as const,x,y,yes:a[key]==="Yes"})),
    {page:2,x:185,y:40,yes:a.singleMother==="Yes"},
    {page:2,x:235,y:40,yes:a.singleMother!=="Yes"},
    {page:2,x:186,y:171,yes:a.printedParent==="Father"||(!a.printedParent&&a.singleMother!=="Yes")},
    {page:2,x:226,y:171,yes:a.printedParent==="Mother"||a.singleMother==="Yes"},
    {page:2,x:187,y:558,yes:a.communicationAddress!=="Office"&&a.communicationAddress!=="Representative"},
    {page:2,x:290,y:558,yes:a.communicationAddress==="Representative"},
    {page:2,x:475,y:558,yes:a.communicationAddress==="Office"},
  ];
  return <svg className="pan93-overlay" viewBox="0 0 595.2 841.92" preserveAspectRatio="none" aria-label={"Filled entries for form page "+page}>
    {entries.filter(e=>e.page===page&&e.value).map((e,i)=>e.chars
      ? e.value.slice(0,e.boxCount||Math.floor(e.w/11.6)).split("").map((ch,j)=>
        <text key={i+"-"+j} x={e.x+(j+.5)*e.w/(e.boxCount||Math.floor(e.w/11.6))} y={e.y+e.h*.69} fill="#111" fontSize={Math.min(8.4,e.h*.71)} textAnchor="middle" fontFamily="Arial,sans-serif">{ch}</text>)
      : <text key={i} x={e.x+2} y={e.y+e.h*.70} fontSize={Math.min(7,e.h*.7)} fontFamily="Arial,sans-serif" fill="#111">{e.value.slice(0,58)}</text>)}
    {checked.filter(c=>c.page===page&&c.yes).map((c,i)=><text x={c.x} y={c.y+4} key={i} fontSize="13" fontWeight="bold" fill="#111" textAnchor="middle">✓</text>)}
  </svg>;
}

export default function Pan93ExactPreview({answers,pan,onEdit}:Props){
  const [pages,setPages]=useState<"loading"|"available"|"missing"|"error">("loading");
  const canvases=useRef<(HTMLCanvasElement|null)[]>([]);
  const [file,setFile]=useState<File|null>(null);
  // SHA-256 of the sanitized, blank 2-page background extracted from the supplied Form 93 samples.
  // Never render overlays on arbitrary filled customer PDFs or incompatible editions.
  const TEMPLATE_SHA256="9b15457e9334ab3dbd0a47c29b9b43b8144df80609d1229dc2d042a799a7e8e6";
  useEffect(()=>{
    if(file)return;
    let active=true;
    fetch("/forms/pan-93-template.pdf",{cache:"force-cache"}).then(async response=>{
      if(!active)return;
      if(response.status===404){setPages("missing");return;}
      if(!response.ok)throw Error("Unable to load Form 93 template");
      setFile(new File([await response.blob()],"pan-93-template.pdf",{type:"application/pdf"}));
    }).catch(()=>{if(active)setPages("error")});
    return()=>{active=false};
  },[file]);
  useEffect(()=>{
    if(!file)return;
    let cancelled=false;
    type PDFPage={getViewport:(options:{scale:number})=>{width:number;height:number};render:(options:{canvas:HTMLCanvasElement;canvasContext:CanvasRenderingContext2D;viewport:{width:number;height:number}})=>{promise:Promise<unknown>}};
    let document:{numPages:number;getPage:(n:number)=>Promise<PDFPage>;destroy:()=>Promise<unknown>}|undefined;
    (async()=>{
      try{
        const pdfjs=await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.min.mjs",import.meta.url).toString();
        const bytes=await file.arrayBuffer();
        const fingerprint=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),b=>b.toString(16).padStart(2,"0")).join("");
        if(fingerprint!==TEMPLATE_SHA256) throw new Error("Incorrect background PDF");
        document=await pdfjs.getDocument({data:new Uint8Array(bytes)}).promise;
        if(document.numPages!==2)throw Error("Two-page source required");
        for(let i=0;i<2;i++){
          const canvas=canvases.current[i];
          if(!canvas)continue;
          const page=await document.getPage(i+1);
          const viewport=page.getViewport({scale:2});
          canvas.width=Math.round(viewport.width);canvas.height=Math.round(viewport.height);
          const context=canvas.getContext("2d");
          if(!context)throw Error("Canvas unavailable");
          await page.render({canvas,canvasContext:context,viewport}).promise;
        }
        if(!cancelled)setPages("available");
      }catch{if(!cancelled)setPages("error")}
    })();
    return()=>{cancelled=true;void document?.destroy()};
  },[file]);
  return <section className="pan93-preview">
    <div className="pan93-preview__tools">
      <div><strong>Form No. 93 — data verification</strong><p>Actual two-page template. Application barcode, inward barcode, receipt, photos and signatures remain blank during customer verification.</p></div>
      <div>{onEdit&&<button type="button" className="btn btn--ghost btn--sm" onClick={onEdit}>Edit details</button>}<button type="button" className="btn btn--primary btn--sm" onClick={()=>window.print()}>Print verification draft</button></div>
    </div>
    {pages==="missing"&&<div className="alert alert--info"><FileText size={18}/> Add the blank Form 93 template at <code>public/forms/pan-93-template.pdf</code> to enable the exact preview; never substitute the unrelated 49A template. <label>Or select it locally: <input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)}/></label></div>}
    {pages==="error"&&<p role="alert">The supplied Form 93 template could not be rendered. Check that it is a valid two-page PDF.</p>}
    {pages==="loading"&&<p role="status"><FileCheck2 size={16}/> Preparing exact Form 93 pages…</p>}
    {file&&<div className="pan93-pages">{([1,2] as const).map((page,i)=><div key={page} className="pan93-page">
      <canvas ref={el=>{canvases.current[i]=el;}} aria-hidden="true"/>
      <Entries page={page} answers={answers} pan={pan}/>
    </div>)}</div>}
  </section>;
}
