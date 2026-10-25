"use client";

import { useEffect, useRef, useState } from "react";
import type { PanIntake } from "@/lib/pan-validation";
type Props={ file: File; answers:Record<string,string>; pan:PanIntake };
// Only this exact 2-page PDF may use the calibrated character-box coordinates.
const ORIGINAL_49A_SHA256="f0692dd49744e62ce2cfe3c1da4a6a07dea1e4a885d7e746ed7d7563d3bbf2fd";
type PdfDoc={numPages:number;getPage:(n:number)=>Promise<{getViewport:(p:{scale:number})=>{width:number;height:number};render:(p:{canvas:HTMLCanvasElement;canvasContext:CanvasRenderingContext2D;viewport:{width:number;height:number}})=>{promise:Promise<unknown>}}>;destroy:()=>Promise<unknown>};
const l=(answers:Record<string,string>,key:string,fallback="")=>(answers[key]||fallback).toUpperCase();
function Overlay({page,a,pan}:{page:number;a:Record<string,string>;pan:PanIntake}){
 const texts:{x:number;y:number;v:string;n?:number;s?:number}[]=[];
 const checks:{x:number;y:number;when:boolean}[]=[];
 const t=(x:number,y:number,v:string,n=30,s=9)=>texts.push({x,y,v,n,s});
 const c=(x:number,y:number,when:boolean)=>checks.push({x,y,when});
 const letters=(x:number,y:number,value:string,max=27,w=19)=>{const chars=value.slice(0,max).split("");chars.forEach((ch,i)=>t(x+i*w,y,ch,1,11));};
 const tick=(value:string,opts:[string,number,number][])=>opts.forEach(([label,x,y])=>c(x,y,value.toLowerCase()===label.toLowerCase()));
 const name=(prefix:string,x:number,ys:number[],w=19,max=25)=>["Surname","First","Middle"].forEach((s,i)=>letters(x,ys[i],l(a,prefix+s),max,w));
 const address=(prefix:string,x:number,ys:number[],w=19,max=24)=>["House","Building","Street","Locality","City"].forEach((s,i)=>letters(x,ys[i],l(a,prefix+s),max,w));
 if(page===1){
  letters(155,145,l(a,"aoArea"),4,36);letters(269,145,l(a,"aoType"),2,36);
  letters(342,145,l(a,"aoRange"),3,36);letters(454,145,l(a,"aoNumber"),3,36);
  tick(l(a,"personTitle"),[["Shri",253,253],["Smt.",325,253],["Kumari",393,253],["M/s",468,253]]);
  name("person",252,[277,297,317]);
  letters(55,351,l(a,"printedName",pan.fullName),36,19);
  tick(l(a,"previousName"),[["Yes",335,389],["No",410,389]]);
  tick(l(a,"formerTitle"),[["Shri",254,424],["Smt.",325,424],["Kumari",395,424],["M/s",468,424]]);
  name("former",251,[446,463,484]);
  tick(l(a,"gender"),[["Male",293,507],["Female",366,507],["Transgender",439,507]]);
  const dob=l(a,"dob",pan.birthDate.split("-").reverse().join("/")).replace(/\D/g,"");
  letters(57,550,dob,8,23);
  tick(l(a,"singleMother"),[["Yes",603,574],["No",642,574]]);
  name("father",163,[618,637,657]);
  name("mother",163,[690,709,728]);
  tick(l(a,"printedParent",l(a,"singleMother")==="YES"?"Mother":"Father"),[["Father",61,758],["Mother",184,758]]);
  address("residence",251,[833,850,870,886,902]);
  t(55,930,l(a,"residenceState"),35,9);letters(326,931,l(a,"residencePin"),6,18);
  t(458,932,l(a,"residenceCountry"),20,9);
  t(252,962,l(a,"officeName"),35,9);
  address("office",251,[982,1001,1020,1039,1058]);
  t(55,1093,l(a,"officeState"),35,9);letters(326,1092,l(a,"officePin"),6,18);t(462,1092,l(a,"officeCountry"),15,9);
 }else{
  tick(l(a,"communicationAddress","Residence"),[["Residence",333,33],["Office",474,33]]);
  letters(117,95,l(a,"phoneCountryCode"),3,19);letters(194,95,l(a,"phoneAreaCode"),6,19);letters(345,95,l(a,"mobile",pan.phone).replace(/\D/g,""),13,19);
  t(116,119,l(a,"email",pan.email),48,11);
  tick(l(a,"status","Individual"),[
    ["Individual",64,185],["Hindu undivided family",169,185],["Company",319,185],
    ["Partnership Firm",450,185],["Association of Persons",609,185],
    ["Trusts",64,210],["Body of Individuals",169,210],["Local Authority",319,210],
    ["Artificial Juridical Persons",450,210],["Limited Liability Partnership",610,210],["Government",614,158]]);
  letters(60,254,l(a,"registrationNumber"),28,19);
  letters(308,294,l(a,"aadhaarNumber"),12,19);
  letters(227,331,l(a,"aadhaarEnrolmentId"),28,19);
  letters(229,368,l(a,"aadhaarName"),24,19);
  tick(l(a,"incomeSalary"),[["Yes",48,449]]);tick(l(a,"incomeBusiness"),[["Yes",48,473]]);
  tick(l(a,"incomeHouse"),[["Yes",48,496]]);tick(l(a,"incomeCapital"),[["Yes",597,449]]);
  tick(l(a,"incomeOther"),[["Yes",597,475]]);tick(l(a,"incomeNone"),[["Yes",597,497]]);
  letters(391,475,l(a,"professionCode"),2,19);
  tick(l(a,"raTitle"),[["Shri",260,606],["Smt.",333,606],["Kumari",400,606],["M/s",475,606]]);
  name("ra",257,[636,655,674]);
  address("ra",257,[705,725,744,763,785]);
  t(61,827,l(a,"raState"),30,9);letters(331,827,l(a,"raPin"),6,19);
  t(164,882,l(a,"identityProof"),27,10);t(463,882,l(a,"addressProof"),25,10);
  t(182,905,l(a,"birthProof"),27,10);
  t(88,969,l(a,"declarationName",l(a,"printedName",pan.fullName)),30,10);
  t(504,969,l(a,"declarationCapacity"),25,10);
  t(124,1017,l(a,"declarationPlace"),30,10);
  letters(123,1080,l(a,"declarationDate").replace(/\D/g,""),8,19);
 }
 return <svg className="pan49-source-overlay" viewBox="0 0 792 1128" preserveAspectRatio="none" role="img" aria-label={"Filled text overlay for Form 49A page "+page}>
  {texts.map((v,i)=><text key={"t"+i} x={v.x} y={v.y} fill="#111" fontFamily="Arial, sans-serif" fontWeight="600" fontSize={v.s} textLength={undefined}>{v.v.slice(0,v.n)}</text>)}
  {checks.filter(v=>v.when).map((v,i)=><text key={"c"+i} x={v.x} y={v.y} fill="#111" fontSize="17" fontFamily="Arial" fontWeight="bold">✓</text>)}
 </svg>;
}
/** Reads an uploaded PDF only in the browser; no template PDF is uploaded or stored. */
export default function Pan49ASourceViewer({file,answers,pan}:Props) {
 const refs=useRef<(HTMLCanvasElement|null)[]>([]);
 const [notice,setNotice]=useState("Preparing the exact source PDF…");
 const [pages,setPages]=useState(2);
 useEffect(()=>{
   let alive=true;
   let doc:PdfDoc|null=null;
   (async()=>{
     try{
       const pdfjs=await import("pdfjs-dist");
       pdfjs.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.min.mjs",import.meta.url).toString();
       const buffer=await file.arrayBuffer();
       const digest=await crypto.subtle.digest("SHA-256",buffer);
       const hash=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("");
       if(hash!==ORIGINAL_49A_SHA256)throw Error("This is not the original two-page Form 49A PDF. Its boxes may be in different positions. Choose the uploaded 49A_Form_Updated.pdf file.");
       const data=new Uint8Array(buffer);
       const task=pdfjs.getDocument({data});
       doc=await task.promise as PdfDoc;
       if(doc.numPages!==2)throw Error("This preview needs the exact two-page Form 49A source PDF.");
       if(!alive)return;
       setPages(doc.numPages);
       for(let i=0;i<doc.numPages;i++){
         const canvas=refs.current[i];if(!canvas)continue;
         const page=await doc.getPage(i+1),viewport=page.getViewport({scale:4/3});
         canvas.width=Math.round(viewport.width);canvas.height=Math.round(viewport.height);
         const context=canvas.getContext("2d");if(!context)throw Error("Canvas unavailable.");
         await page.render({canvas,canvasContext:context,viewport}).promise;
       }
       if(alive)setNotice("");
     }catch(e){if(alive)setNotice(e instanceof Error?e.message:"Unable to display the source PDF.");}
   })();
   return ()=>{alive=false;void doc?.destroy();};
 },[file]);
 return <div className="pan49-source-pages">
   {notice&&<p className="pan49-source-notice" role="status">{notice}</p>}
   {Array.from({length:pages},(_,i)=><div className="pan49-source-page" key={i}>
     <canvas ref={el=>{refs.current[i]=el;}} aria-hidden="true"/>
     <Overlay page={i+1} a={answers} pan={pan}/>
   </div>)}
   <p className="pan49-source-note">Source template stays on this device. Match each letter and mark against the PDF before use; signatures and photos must be supplied separately.</p>
 </div>;
}
