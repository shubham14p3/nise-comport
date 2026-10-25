"use client";

import Image from "next/image";
import type { IntakeValue } from "@/lib/detailed-intake";

/** Print rendition keyed to the three-page Form 6 examples.
 * ECI receipt and digital signature are intentionally NOT imitated. */
const show=(v?:string)=>v?.trim()||"";
const field=(label:string,value?:string)=><div className="f6-label-value"><span>{label}</span><strong>{show(value)}</strong></div>;
const box=(checked:boolean)=><span aria-label={checked?"Selected":"Not selected"} className="f6-checkbox">{checked?"✓":""}</span>;
const yesno=(value:string,items:string[])=><span className="f6-picks">{items.map(item=><span key={item}>{box(value===item)} {item}</span>)}</span>;
const boxes=(value:string,length=10)=><span className="f6-digit-cells">{Array.from({length},(_,i)=><span key={i}>{value?.replace(/[^0-9]/g,"")?.[i]||""}</span>)}</span>;
const rows=(a:IntakeValue,keys:[string,string][])=>keys.map(([key,label])=><div className="f6-address-cell" key={key}>{field(label,a[key])}</div>);
const mark=(value:string,check:string)=>box(value===check);
const addrProofs=["Utility Bill (at least 1 year)","Aadhaar Card","Current Bank / Post Office Passbook","Indian Passport","Land Owning Records / Kisan Bahi","Registered Rent Lease Deed","Registered Sale Deed"];
const dobProofs=["Birth certificate","Aadhaar Card","PAN Card","Driving Licence","Class X or XII Certificate","Indian Passport"];

export default function VoterForm6Preview({answers:a,photoUrl=""}:{answers:IntakeValue;photoUrl?:string}){
  const fullName=[a.firstNameEnglish,a.middleNameEnglish,a.surnameEnglish].filter(Boolean).join(" ");
  const address=[a.addressHouse,a.addressStreet,a.addressTown,a.addressPostOffice,a.addressDistrict,a.addressState,a.addressPin].filter(Boolean).join(", ");
  const localName=[a.nameLocal,a.surnameLocal].filter(Boolean).join(" ");
  return <div className="form8-preview form6-preview" aria-label="Form 6 three page print preparation">
    <article className="form8-sheet form6-sheet">
      <div className="f8-watermark" aria-hidden="true">PREPARATION DRAFT · NOT SUBMITTED</div>
      <header className="f6-head">
        <div className="f6-mark" aria-hidden="true"><span>भारत निर्वाचन आयोग</span><strong>ECI</strong></div>
        <div><b>FORM-6</b><small>(See Rules 13(1) and (26) of the Registration of Electors Rules, 1960)</small>
          <h2>ELECTION COMMISSION OF INDIA</h2><h3>Application Form for New Voters</h3></div>
        <div className="f6-ack">Acknowledgement No.<strong>Issued by ECI only</strong><small>(To be filled by office)</small></div>
      </header>
      <section className="f6-block f6-constituency">
        <p>To,<br/>The Electoral Registration Officer,<br/>No. &amp; Name of Assembly Constituency</p>
        <div className="f6-const-grid">{field("No.",a.constituencyNumber)}{field("Name",a.constituencyName)}</div>
        <p>Or No. &amp; Name of Parliamentary Constituency (only for Union Territories not having Legislative Assembly)</p>
        <p>I submit application for inclusion of my name in the electoral roll for the above constituency.</p>
      </section>
      <section className="f6-block f6-applicant">
        <div className="f6-photo">{photoUrl?<Image unoptimized src={photoUrl} alt="Applicant photograph" width={110} height={135}/>:<span>RECENT PASSPORT-SIZE COLOUR PHOTO (WHITE BACKGROUND)</span>}</div>
        <b>(1)(a.) Name (In Official Language of State)</b>
        {field("First name followed by Middle name",a.nameLocal)}
        {field("Surname (if any)",a.surnameLocal)}
        <b>(1)(b.) Name (In English in BLOCK LETTERS)</b>
        {field("First name followed by Middle name",[a.firstNameEnglish,a.middleNameEnglish].filter(Boolean).join(" "))}
        {field("Surname (if any)",a.surnameEnglish)}
        <p><small>Disclaimer: If name not filled in English, it will be transliterated by software on the official portal.</small></p>
      </section>
      <section className="f6-block">
        <b>(2)(a.) Name and Surname (in Official Language of State) of any one relative:</b>
        <p>{yesno(a.relativeType,["Father","Mother","Husband","Wife","Legal Guardian"])}</p>
        {field("(2)(b.) Name and Surname (in English BLOCK LETTERS)",a.relativeNameEnglish)}
        {field("In Official Language of State",a.relativeNameLocal)}
      </section>
      <section className="f6-block">
        <b>(3) Mobile No. of Self (if available)</b><div className="f6-digit-row">{boxes(a.mobile||"",10)}</div>
        <b>Or of relative mentioned at Item No. 2</b><div className="f6-digit-row">{boxes(a.relativeMobile||"",10)}</div>
      </section>
      <section className="f6-block">
        {field("(4) Email ID of Self (if available)",a.email)}{field("Or of relative mentioned at Item No. 2",a.relativeEmail)}
      </section>
      <section className="f6-block">
        <b>(5) Aadhaar Details</b>
        <div className="f6-aadhaar">{yesno(a.aadhaarStatus,["Have Aadhaar","Do not have Aadhaar"])}
          {boxes(a.aadhaarStatus==="Have Aadhaar"?a.aadhaarNumber||"":"",12)}</div>
      </section>
      <section className="f6-block">
        <b>(6) Gender</b><div>{yesno(a.gender,["Male","Female","Third Gender"])}</div>
      </section>
      <section className="f6-block">
        <b>(7)(a.) Date of Birth (dd/mm/yyyy)</b>
        <div className="f6-digit-row">{boxes(a.dob||"",8)}</div>
        <b>(b.) Self-attested copy of document supporting age proof attached (any one):</b>
        <div className="f6-proof-grid">{dobProofs.map((proof,i)=><p key={proof}>{i+1}. {mark(a.birthProof,proof)} {proof}</p>)}</div>
        <p>(ii) Any Other Document for Proof of Date of Birth: {a.birthProof==="Other"?show(a.birthProofOther):"___________________"}</p>
      </section>
      <footer className="f8-page-number">Form 6 · Preparation draft · Page 1 of 3 · Nise Comport is not ECI</footer>
    </article>
    <article className="form8-sheet form6-sheet">
      <div className="f8-watermark" aria-hidden="true">PREPARATION DRAFT · NOT SUBMITTED</div>
      <section className="f6-block">
        <h3>(8)(a.) Present Ordinary Residence (Full Address)</h3>
        <div className="f6-address-grid">{rows(a,[
          ["addressHouse","House / Building / Apartment No."],["addressStreet","Street / Area / Locality"],
          ["addressTehsil","Tehsil / Taluka / Mandal"],["addressTown","Town / Village"],
          ["addressPostOffice","Post Office"],["addressState","State / UT"],
          ["addressDistrict","District"],["addressPin","PIN Code"]
        ])}</div>
      </section>
      <section className="f6-block">
        <h3>(8)(b.) Self-attested proof of address (any one)</h3>
        <p>In applicant&apos;s or enrolled parent/spouse/adult child&apos;s name at the same address:</p>
        <div className="f6-proof-grid">{addrProofs.map((proof,i)=><p key={proof}>{i+1}. {mark(a.addressProof,proof)} {proof}</p>)}</div>
        <p>Other proof of residence: {a.addressProof==="Other"?show(a.addressProofOther):"____________________________________"}</p>
      </section>
      <section className="f6-block">
        <h3>(9) Category of disability, if any (optional)</h3>
        <p>{yesno(a.hasDisability==="Yes"?a.disabilityType:"",["Locomotor","Visual","Deaf & Dumb","Other"])}</p>
        {field("If other, give description",a.disabilityOther)}
        <div className="f6-half">{field("Percentage of disability",a.disabilityPercent)}<p>Certificate attached: {yesno(a.hasDisabilityCertificate,["Yes","No"])}</p></div>
      </section>
      <section className="f6-block">
        <h3>(10) Family member already included in the electoral roll at current address</h3>
        <div className="f6-half">{field("Name of family member",a.familyMemberName)}{field("Relationship with applicant",a.familyMemberRelationship)}</div>
        {field("His / Her EPIC No.",a.familyMemberEpic)}
      </section>
      <section className="f6-block f6-declaration">
        <h3>DECLARATION</h3>
        <b>I HEREBY DECLARE that to the best of my knowledge and belief:</b>
        <p>(i) I am a citizen of India and my place of birth is:</p>
        <div className="f6-half">{field("Town / Village",a.birthVillage)}{field("District",a.birthDistrict)}</div>
        {field("State / UT",a.birthState)}
        <p>(ii) I am ordinarily resident at the address mentioned at Sr. No. 8(a) since: <b>{show(a.residenceSince)}</b></p>
        <p>(iii) I am applying for inclusion in the electoral roll for the first time and I am not included in any other constituency.</p>
        <p>(iv) I have provided the relevant age proof or applicable supporting evidence.</p>
        <p>(v) I understand that a false declaration is punishable under Section 31 of the Representation of the People Act, 1950.</p>
        {field("DATE",a.declarationDate)}{field("PLACE",a.declarationPlace)}
      </section>
      <section className="f6-block">
        <b>Accessibility Instructions:</b> Under the Rights of Persons with Disabilities Act, 2016 and Rules, 2017, an elector or their legal guardian may sign or use a left-hand thumb impression, as applicable.
      </section>
      <section className="f6-block f6-note">
        <b>Note:</b><p>Self-attested documents support timely processing. Final requirements and eligibility are determined by ECI.</p>
        <p>If the usual residence proof is unavailable, field verification may be required.</p>
      </section>
      <footer className="f8-page-number">Form 6 · Preparation draft · Page 2 of 3</footer>
    </article>
    <article className="form8-sheet form6-sheet f6-sir-sheet">
      <div className="f8-watermark" aria-hidden="true">PREPARATION DRAFT · NOT SUBMITTED</div>
      <header><h2>DECLARATION FORM</h2><p>(To be submitted along with Form 6 / Form 8 when applicable to new enrolment or shifting from outside the state)</p></header>
      <div className="f6-half">{field("Name of Elector",fullName)}{field("Address",address)}</div>
      {field("Mobile Number",a.mobile||a.relativeMobile)}
      <div className="f6-sir-grid">
        <section><h3>Details of Elector in Electoral Roll of the last SIR</h3>
          {field("Name of Elector",a.sirElectorName)}{field("EPIC No. (if available)",a.sirEpic)}
          {field("Relative's Name",a.sirRelativeName)}{field("Relationship",a.sirRelationship)}
          {field("State Name",a.sirState)}{field("AC Number / Name",a.sirConstituency)}
          {field("Part No.",a.sirPart)}{field("Serial No.",a.sirSerial)}
        </section>
        <section><h3>Details of the Relative whose name is in the last SIR</h3>
          {field("Name",a.sirRelatedName)}{field("EPIC No. (if available)",a.sirRelatedEpic)}
          {field("Relative's Name",a.sirRelatedRelative)}{field("Relationship",a.sirRelatedRelation)}
          {field("State Name",a.sirRelatedState)}{field("AC Number / Name",a.sirRelatedConstituency)}
          {field("Part No.",a.sirRelatedPart)}{field("Serial No.",a.sirRelatedSerial)}
        </section>
      </div>
      <div className="f6-sir-kin">
        {field("Father's / Guardian's Name",a.fatherName)}{field("Father's / Guardian's EPIC No. (optional)",a.fatherEpic)}
        {field("Mother's Name",a.motherName)}{field("Mother's EPIC No. (optional)",a.motherEpic)}
        {field("Spouse's Name (if applicable)",a.spouseName)}{field("Spouse's EPIC No. (optional)",a.spouseEpic)}
      </div>
      <section className="f6-sir-declaration">
        <p>(i) I have not acquired citizenship of any other country.</p>
        <p>(ii) I am applying for inclusion in the Electoral Roll through Form 6, and my name is not included in any other Assembly / Parliamentary Constituency. {box(true)}</p>
        <p className="f6-sir-or">Or</p>
        <p>I am applying through Form 8 on shifting from outside the state. {box(false)}</p>
        <p>(iii) I understand that knowingly making a false statement is punishable under Section 31 of the Representation of the People Act, 1950.</p>
      </section>
      <div className="f6-half">{field("Date",a.declarationDate)}{field("Place of Submission",a.declarationPlace)}</div>
      <p className="f6-signature">Signature / Left Thumb Impression: __________________________</p>
      <footer className="f8-page-number">Supplementary declaration · Page 3 of 3 · Provided as a preparation copy only</footer>
    </article>
  </div>;
}
