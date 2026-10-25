"use client";

import { useEffect, useState } from "react";
import Pan49ASourceViewer from "@/components/pan-49a-source-viewer";
import type { PanIntake } from "@/lib/pan-validation";
import "./pan-49a-preview.css";

type Answers = Record<string, string>;
type Props = { answers: Answers; pan: PanIntake; onEdit?: () => void };
const pick = (a: Answers, key: string, fallback = "") => (a[key] || fallback).trim();
const printDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split("-").reverse().join("/") : s;

function Cells({ value, count = 38 }: { value?: string; count?: number }) {
  const chars = (value ?? "").toUpperCase().slice(0, count).split("");
  return <span className="pan49-cells" aria-label={value || "Not entered"}>{Array.from({ length: count }, (_, i) =>
    <span className="pan49-cell" key={i}>{chars[i] ?? ""}</span>)}</span>;
}
function Line({ label, value, count = 35 }: { label: string; value?: string; count?: number }) {
  return <div className="pan49-line"><span className="pan49-line-label">{label}</span><Cells value={value} count={count}/></div>;
}
function Caption({ number, title }: { number: string; title: string }) {
  return <div className="pan49-heading"><b>{number}</b><strong>{title}</strong></div>;
}
function Tick({ label, checked }: { label: string; checked: boolean }) {
  return <span className="pan49-tick"><span className="pan49-square">{checked ? "✓" : ""}</span>{label}</span>;
}
function Ticks({ choices, value }: { choices: string[]; value: string }) {
  return <span className="pan49-ticks">{choices.map(label => <Tick key={label} label={label} checked={value.toLowerCase()===label.toLowerCase()}/>)}</span>;
}
function Name({ a, prefix, title = true }: { a: Answers; prefix: string; title?: boolean }) {
  return <div className="pan49-name">
    {title && <div className="pan49-titles">Please select title: <Ticks choices={["Shri","Smt.","Kumari","M/s"]} value={pick(a,prefix+"Title")}/></div>}
    <Line label="Last Name / Surname" value={pick(a,prefix+"Surname")}/>
    <Line label="First Name" value={pick(a,prefix+"First")}/>
    <Line label="Middle Name" value={pick(a,prefix+"Middle")}/>
  </div>;
}
function Address({ a, prefix, office = false }: { a: Answers; prefix: string; office?: boolean }) {
  return <div className="pan49-address">
    {office && <Line label="Name of office" value={pick(a,"officeName")}/>}
    {[
      ["House","Flat / Room / Door / Block No."],["Building","Name of Premises / Building / Village"],
      ["Street","Road / Street / Lane / Post Office"],["Locality","Area / Locality / Taluka / Sub-Division"],
      ["City","Town / City / District"],
    ].map(([suffix,label])=><Line key={suffix} label={label} value={pick(a,prefix+suffix)}/>)}
    <Line label="State / Union Territory" value={pick(a,prefix+"State")} count={32}/>
    <div className="pan49-address-tail">
      <span>PIN / ZIP <Cells count={6} value={pick(a,prefix+"Pin")}/></span>
      <span>Country <Cells count={12} value={pick(a,prefix+"Country")}/></span>
    </div>
  </div>;
}
function TextBox({ value, minHeight = 16 }: { value?: string; minHeight?: number }) {
  return <span className="pan49-textbox" style={{ minHeight }} title={value || ""}>{value?.toUpperCase()}</span>;
}

export default function Pan49APreview({ answers: a, pan, onEdit }: Props) {
  const [sourcePdf, setSourcePdf] = useState<File|null>(null);
  const [sourceError, setSourceError] = useState("");
  useEffect(() => {
    let active = true;
    // When the original uploaded template is placed in public/forms it loads for every customer.
    fetch("/forms/pan-49a.pdf", { cache: "force-cache" }).then(async response => {
      if (!response.ok) return;
      const blob = await response.blob();
      if (active && blob.size && blob.size <= 12 * 1024 * 1024) setSourcePdf(current => current ?? new File([blob], "49A_Form_Updated.pdf", {type:"application/pdf"}));
    }).catch(() => undefined);
    return () => {active = false;};
  }, []);
  const fullName = pick(a,"printedName",pan.fullName);
  const dt = pick(a,"dob",printDate(pan.birthDate));
  const income: [string,string][] = [
    ["incomeSalary","Salary"],["incomeBusiness","Income from Business / Profession"],
    ["incomeHouse","Income from house property"],["incomeCapital","Capital Gains"],
    ["incomeOther","Income from Other sources"],["incomeNone","No income"],
  ];
  return <section className="pan49-workspace" aria-label="Form 49A two-page verification preview">
    <div className="pan49-preview-actions">
      <div><b>Form 49A — two-page verification</b><p>Legacy reference (not valid for new official PAN filings after 31 March 2026). Compare each box with your source documents before confirming.</p><label className="pan49-template-upload">Use the exact supplied Form 49A PDF as the preview background <input type="file" accept="application/pdf,.pdf" onChange={e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>12*1024*1024){setSourceError("PDF exceeds 12 MB.");return;}setSourceError("");setSourcePdf(file);}}/></label>{sourceError&&<span role="alert">{sourceError}</span>}{sourcePdf&&<button type="button" className="link-btn" onClick={()=>setSourcePdf(null)}>Use built-in preview instead</button>}</div>
      <div>{onEdit && <button type="button" className="btn btn--ghost btn--sm" onClick={onEdit}>Edit entries</button>}<button type="button" className="btn btn--primary btn--sm" onClick={() => window.print()}>Print / Save PDF</button></div>
    </div>
    {sourcePdf ? <Pan49ASourceViewer file={sourcePdf} answers={a} pan={pan}/> : <div className="pan49-paper-wrap">
      <article className="pan49-sheet">
        <div className="pan49-top">
          <div className="pan49-photo">Only 'Individuals'<br/> to affix recent photograph<br/>(3.5 × 2.5 cm)<small>Signature/Left thumb impression across photo</small></div>
          <div className="pan49-top-main"><b>Form No. 49A</b><strong>Application for Allotment of Permanent Account Number</strong><span>[In the case of Indian Citizens / Indian Companies / Entities incorporated in India]</span><small>See Rule 114 — legacy specimen</small>
            <p>Assessing officer (AO code)</p>
            <div className="pan49-ao">{[["Area code","aoArea",4],["AO type","aoType",2],["Range code","aoRange",3],["AO No.","aoNumber",3]].map(([label,key,n])=><div key={String(key)}><b>{label}</b><Cells count={Number(n)} value={pick(a,String(key))}/></div>)}</div>
          </div>
          <div className="pan49-photo">Only 'Individuals'<br/> to affix recent photograph<br/>(3.5 × 2.5 cm)<small>Signature/Left Thumb impression</small></div>
        </div>
        <p className="pan49-dear">Sir, I/We hereby request that a permanent account number be allotted to me/us.<br/>I/We give below necessary particulars:</p>
        <Caption number="1" title="Full Name (Full expanded name; initials are not permitted)"/>
        <Name a={a} prefix="person"/>
        <Caption number="2" title="Abbreviation of the above name, as you would like it to be printed on the PAN card"/>
        <Cells count={43} value={fullName}/>
        <Caption number="3" title="Have you ever been known by any other name?"/>
        <Ticks choices={["Yes","No"]} value={pick(a,"previousName")}/>
        {pick(a,"previousName")==="Yes" && <Name a={a} prefix="former"/>}
        <Caption number="4" title="Gender (for individual applicants only)"/>
        <Ticks choices={["Male","Female","Transgender"]} value={pick(a,"gender")}/>
        <Caption number="5" title="Date of Birth / Incorporation / Agreement / Partnership or Trust Deed"/>
        <div className="pan49-date">Day &nbsp; Month &nbsp; Year <Cells count={8} value={dt.replace(/\D/g,"")}/></div>
        <Caption number="6" title="Details of Parents (only for individual applicants)"/>
        <div className="pan49-parent"><span>Is mother a single parent? <Ticks choices={["Yes","No"]} value={pick(a,"singleMother")}/></span></div>
        <b className="pan49-subhead">Father's name</b><Name a={a} prefix="father" title={false}/>
        <b className="pan49-subhead">Mother's name</b><Name a={a} prefix="mother" title={false}/>
        <p className="pan49-small">Name to be printed on the card: <Ticks choices={["Father","Mother"]} value={pick(a,"printedParent",a.singleMother==="Yes"?"Mother":"Father")}/></p>
        <Caption number="7" title="Address"/>
        <b className="pan49-subhead">Residence Address</b>
        <Address a={a} prefix="residence"/>
        <b className="pan49-subhead">Office Address</b>
        <Address a={a} prefix="office" office/>
        <footer className="pan49-page-number">Page 1 of 2 · NISE COMPORT application review copy</footer>
      </article>
      <article className="pan49-sheet">
        <Caption number="8" title="Address for Communication"/>
        <Ticks choices={["Residence","Office"]} value={pick(a,"communicationAddress","Residence")}/>
        <Caption number="9" title="Telephone Number & Email ID details"/>
        <div className="pan49-contact"><span>Country code <Cells value={pick(a,"phoneCountryCode")} count={3}/></span><span>Area / STD <Cells value={pick(a,"phoneAreaCode")} count={6}/></span><span>Mobile / Telephone <Cells value={pick(a,"mobile",pan.phone).replace(/\D/g,"")} count={13}/></span></div>
        <Line label="Email ID" value={pick(a,"email",pan.email)} count={39}/>
        <Caption number="10" title="Status of applicant"/>
        <div className="pan49-status"><Ticks choices={["Individual","Hindu undivided family","Company","Partnership Firm","Association of Persons","Trusts","Body of Individuals","Local Authority","Artificial Juridical Persons","Limited Liability Partnership","Government"]} value={pick(a,"status","Individual")}/></div>
        <Caption number="11" title="Registration Number (for company, firms, LLPs etc.)"/>
        <Cells count={30} value={pick(a,"registrationNumber")}/>
        <Caption number="12" title="Aadhaar number / enrollment details shown in the legacy source form"/>
        <Line label="Aadhaar number" value={pick(a,"aadhaarNumber")} count={12}/>
        <Line label="Legacy Enrollment ID" value={pick(a,"aadhaarEnrolmentId")} count={28}/>
        <Line label="Name as per Aadhaar" value={pick(a,"aadhaarName")} count={33}/>
        <Caption number="13" title="Source of Income"/>
        <div className="pan49-income">{income.map(([key,label])=><Tick key={key} label={label} checked={a[key]==="Yes"}/>)}</div>
        <Line label="Business / Profession code" value={pick(a,"professionCode")} count={2}/>
        <Caption number="14" title="Representative Assessee (RA)"/>
        <p className="pan49-small">Is a representative assessee involved? <Ticks choices={["Yes","No"]} value={pick(a,"raApplicable")}/></p>
        <b className="pan49-subhead">Full Name (expanded; initials not permitted)</b>
        <Name a={a} prefix="ra"/>
        <b className="pan49-subhead">Address</b><Address a={a} prefix="ra"/>
        <Caption number="15" title="Documents submitted as Proof of Identity (POI), Proof of Address (POA), and Proof of DOB"/>
        <div className="pan49-docs">I/We have enclosed <TextBox value={pick(a,"identityProof")}/> as proof of identity,<br/><TextBox value={pick(a,"addressProof")}/> as proof of address and <TextBox value={pick(a,"birthProof")}/> as proof of date of birth.</div>
        <Caption number="16" title="Declaration"/>
        <p className="pan49-declare">I/We <TextBox value={pick(a,"declarationName",fullName)}/>, the applicant, in the capacity of <TextBox value={pick(a,"declarationCapacity")}/> declare the above details are true to the best of my/our information and belief.</p>
        <div className="pan49-declare-bottom"><div>Place: <TextBox value={pick(a,"declarationPlace")}/><div>Date: <Cells count={8} value={pick(a,"declarationDate",dt).replace(/\D/g,"")}/></div></div><div className="pan49-sign">Signature / Left Thumb Impression of Applicant<br/><small>To be signed or provided separately after verification</small></div></div>
        <footer className="pan49-page-number">Page 2 of 2 · Reference worksheet only; not submitted to Income Tax Department</footer>
      </article>
    </div>}
  </section>;
}
