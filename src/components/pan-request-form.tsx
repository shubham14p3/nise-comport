"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, FileText, LockKeyhole } from "lucide-react";
import DetailedIntakePreview from "@/components/detailed-intake-preview";
import { saveApplicationDraft, readApplicationDraft, clearApplicationDraft } from "@/lib/tab-application-draft";
import { OfferRail, OfferStrip, WizardActions, WizardFrame } from "@/components/wizard";
import { CitySelect, StateSelect } from "@/components/state-city-fields";
import { COUNTRIES, statesFor } from "@/lib/india-geo";
import ConsentModal from "@/components/consent-modal";
import DetailedIntakeFields from "@/components/detailed-intake-fields";
import { intakeSections, validateDetailedIntake } from "@/lib/detailed-intake";
import { newIdempotencyKey } from "@/lib/client-id";
import { panIntakeSchema, panServiceLabels, panServices, type PanIntake } from "@/lib/pan-validation";
import { secureApi } from "@/lib/secure-api-client";
import { useLocale } from "@/lib/use-locale";
import { rememberReturn } from "@/lib/after-login";
import Pan49AModal from "@/components/pan-49a-modal";

const STEPS = ["PAN service", "Applicant", "Documents", "Review"];
const STEP_FIELDS: (keyof PanIntake)[][] = [
  ["service", "existingPan", "applicant", "citizenship", "residency", "entityType"],
  ["fullName", "birthDate", "representative", "contactName", "email", "phone", "address", "city", "state", "country", "postalCode", "corrections", "detailedIntake"],
  ["documentPlan", "notes", "consent"],
  [],
];
const CORRECTIONS = ["name", "birth-date", "parent-name", "photo", "signature", "address", "contact"] as const;
const DOCUMENTS = ["identity", "address", "birth", "existing-pan", "change-proof", "entity-proof", "representative"] as const;
const LABELS: Partial<Record<keyof PanIntake, string>> = {
  service: "Service", existingPan: "PAN already allotted", applicant: "Applicant", citizenship: "Citizenship / origin", residency: "Address location", entityType: "Entity type",
  fullName: "Applicant name", birthDate: "Birth / formation date", representative: "Parent / representative", contactName: "Contact person", email: "Email", phone: "Phone",
  address: "Address", city: "City", state: "State", country: "Country", postalCode: "PIN / postal code", corrections: "Changes", documentPlan: "Documents ready", notes: "Notes",
};
const pretty = (value: string) => value.replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase());

/** PAN assistance request in four steps, validated against the same schema the server uses. */
export default function PanRequestForm({ service, demo = false, signedIn = true, legacy49a = false, form93 = false, editReference }: { service: PanIntake["service"]; demo?: boolean; signedIn?: boolean; legacy49a?: boolean; form93?: boolean; editReference?: string }) {
  const referenceMode = legacy49a || form93;
  const draftKey = form93 ? "pan-form-93" : legacy49a ? "pan-form-49a" : "pan-request";
  const returnPath = form93 ? "/pan/93" : legacy49a ? "/pan/49a" : "/pan/request";
  const authenticated = signedIn && !demo;
  const router = useRouter();
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [editLoading, setEditLoading] = useState(Boolean(editReference));
  const [data, setData] = useState<PanIntake>({ service, citizenship: "indian", applicant: service === "business" ? "entity" : "individual", residency: "india", existingPan: ["new", "minor", "business"].includes(service) ? "no" : "yes", fullName: "", birthDate: "", contactName: "", email: "", phone: "", address: "", city: "", state: "", country: "India", postalCode: "", representative: "", entityType: "", corrections: [], documentPlan: [], notes: "", consent: false, detailedIntake: {kind:form93?"pan93":referenceMode?"pan49a":"pan",answers:form93?{
    singleMother:"No",officeAddress:"No",raApplicable:"No",residenceStatus:"Resident",communicationSameAsResidence:"Yes",communicationAddress:"Residence",residenceCountry:"India",phoneCountryCode:"91",
  }:referenceMode?{
    status:"Individual",previousName:"No",singleMother:"No",officeAddress:"No",raApplicable:"No",
    communicationSameAsResidence:"Yes",communicationAddress:"Residence",residenceCountry:"India",phoneCountryCode:"91",
  }:{},documents:[]} });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showConsent, setShowConsent] = useState(false);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [tabDraftReady, setTabDraftReady] = useState(false);
  const idempotencyKey = useRef<string | null>(null);

  useEffect(() => {
    if(editReference){setTabDraftReady(true);return;}
    let active=true;
    void readApplicationDraft<{data:PanIntake;step:number}>(draftKey).then(saved=>{
      if(!active)return;
      if(saved?.data && saved.data.detailedIntake?.kind === (form93 ? "pan93" : legacy49a ? "pan49a" : "pan")){
        setData(current=>({...current,...saved.data}));
        if(Number.isInteger(saved.step) && saved.step>=0 && saved.step<=3)setStep(saved.step);
      }
    }).catch(()=>undefined).finally(()=>{if(active)setTabDraftReady(true)});
    return()=>{active=false};
  },[draftKey,editReference,form93,legacy49a]);

  useEffect(()=>{
    if(!tabDraftReady || editReference)return;
    const timer=window.setTimeout(()=>{void saveApplicationDraft(draftKey,{data,step})},350);
    return()=>window.clearTimeout(timer);
  },[data,step,tabDraftReady,editReference,draftKey]);

  useEffect(() => {
    if (!editReference || !signedIn || demo) return;
    let alive=true;
    secureApi<{request:{status:string;officialReference?:string|null;details:Record<string,unknown>}}>(
      "F4m9C1xT6qH3",{reference:editReference}
    ).then(result=>{
      if(!alive)return;
      const oldPan=result.request.details.pan;
      const rawIntake=result.request.details.intake;
      if (!oldPan || typeof oldPan !== "object" || Array.isArray(oldPan)) {
        setMessage("Saved application details are unavailable. Please contact the service desk.");
        return;
      }
      if(!["submitted","reviewing","waiting_for_customer"].includes(result.request.status) || result.request.officialReference) {
        setMessage("This request is now being processed. It is read-only; contact the service desk for changes.");
        return;
      }
      if(!rawIntake||typeof rawIntake!=="object"||!["pan49a","pan93"].includes((rawIntake as {kind?:string}).kind??"")) {
        setMessage("The saved request does not contain an editable PAN worksheet.");
        return;
      }
      const parsed=panIntakeSchema.safeParse({...oldPan,detailedIntake:rawIntake});
      if(!parsed.success){setMessage("Saved form could not be validated. Please contact the service desk.");return;}
      setData(parsed.data);
      setStep(1);
      setPreviewConfirmed(false);
    }).catch(error=>{if(alive)setMessage(error instanceof Error?error.message:"Unable to load the saved application.");})
      .finally(()=>{if(alive)setEditLoading(false);});
    return ()=>{alive=false;};
  },[editReference,signedIn,demo]);

  useEffect(() => {
    if (demo || !signedIn || editReference) return;
    let active = true;
    secureApi<{ user: { name: string; email: string; phone: string | null; city: string; state: string; postalCode: string } }>("P8a2N5dK1vR7").then(({ user }) => {
      if (!active) return;
      setData((current) => ({ ...current, contactName: current.contactName || user.name, email: current.email || user.email, phone: current.phone || user.phone || "", city: current.city || user.city, state: current.state || user.state, postalCode: current.postalCode || user.postalCode }));
    }).catch(() => undefined);
    return () => { active = false; };
  }, [demo, signedIn, editReference]);

  function update<K extends keyof PanIntake>(key: K, value: PanIntake[K]) {
    if (referenceMode) setPreviewConfirmed(false);
    setData((current) => {
      const next = { ...current, [key]: value };
      if (referenceMode && key === "detailedIntake" && value && typeof value === "object" && "answers" in value) {
        const a = value.answers as Record<string,string>;
        const name = [a.personFirst,a.personMiddle,a.personSurname].filter(Boolean).join(" ").replace(/\s+/g," ").trim();
        if (name) { next.fullName = name; next.contactName = name; }
        if (a.dob) {
          const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(a.dob);
          next.birthDate = match ? match[3]+"-"+match[2]+"-"+match[1] : "";
        }
        if (a.email !== undefined) next.email = a.email;
        if (a.mobile !== undefined) {
          const number = a.mobile.replace(/\D/g,"");
          const countryCode = (a.phoneCountryCode || "").replace(/\D/g,"");
          next.phone = countryCode && number && !number.startsWith(countryCode) ? "+"+countryCode+number : number;
        }
        if (a.communicationSameAsResidence !== "No" || a.communicationAddress === "Residence") {
          next.address = [a.residenceHouse,a.residenceBuilding,a.residenceStreet,a.residenceLocality].filter(Boolean).join(", ");
          next.city = a.residenceCity || "";
          next.state = a.residenceState || "";
          next.country = a.residenceCountry || "India";
          next.postalCode = a.residencePin || "";
        } else if (a.communicationAddress === "Office") {
          next.address = [a.officeHouse,a.officeBuilding,a.officeStreet,a.officeLocality].filter(Boolean).join(", ");
          next.city = a.officeCity || "";
          next.state = a.officeState || "";
          next.country = a.officeCountry || "India";
          next.postalCode = a.officePin || "";
        }
        if (current.service === "minor") next.representative = [a.fatherFirst,a.fatherMiddle,a.fatherSurname].filter(Boolean).join(" ") || [a.motherFirst,a.motherMiddle,a.motherSurname].filter(Boolean).join(" ");
      }
      if (key === "service") {
        if (referenceMode && !["new","minor"].includes(value as string)) return current;
        if (referenceMode && next.detailedIntake) next.detailedIntake = {...next.detailedIntake,kind:form93?"pan93":"pan49a"};
        const fresh = ["new", "minor", "business"].includes(value as string);
        next.existingPan = fresh ? "no" : "yes";
        if (value === "business") next.applicant = "entity";
        if (["minor", "minor-to-major", "marriage"].includes(value as string)) next.applicant = "individual";
      }
      return next;
    });
    setErrors((current) => { const copy = { ...current }; delete copy[key as string]; return copy; });
  }

  function problemsFor(stepIndex: number) {
    const parsed = panIntakeSchema.safeParse(data);
    if (parsed.success) return {};
    const allowed = new Set(STEP_FIELDS.slice(0, stepIndex + 1).flat() as string[]);
    return Object.fromEntries(parsed.error.issues.filter((issue) => allowed.has(String(issue.path[0]))).map((issue) => [String(issue.path[0]), issue.message]));
  }

  function go(next: number) { setMessage(""); setStep(next); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function next() {
    if(!tabDraftReady){setMessage("Restoring your saved application. Please try again.");return;}
    const found = problemsFor(step);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => {
        const invalid = document.querySelector<HTMLElement>(".wizard-form [aria-invalid='true'], .detailed-intake__section--error");
        invalid?.scrollIntoView({behavior:"smooth",block:"center"});
        if (invalid instanceof HTMLInputElement || invalid instanceof HTMLSelectElement) invalid.focus({preventScroll:true});
      });
      return;
    }
    if(step===2 && !authenticated){
      const ok=await saveApplicationDraft(draftKey,{data,step:3});
      if(!ok){setMessage("Your browser storage is unavailable. Enable site storage before signing in.");return;}
      rememberReturn(returnPath);router.push("/login");return;
    }
    go(step + 1);
  }

  async function submit() {
    // Guests must sign in before any final preview; confirmation is checked after authentication.
    if(!authenticated){
      const ok=await saveApplicationDraft(draftKey,{data,step:3});
      if(!ok){setMessage("Unable to preserve your draft. Enable browser site storage.");return;}
      rememberReturn(returnPath);router.push("/login");return;
    }
    if (referenceMode && !previewConfirmed) { setMessage("Please confirm that both preview pages match the applicant documents."); return; }
    const parsed = panIntakeSchema.safeParse(data);
    if (!parsed.success) {
      const found = Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
      setErrors(found);
      const firstStep = STEP_FIELDS.findIndex((fields) => fields.some((field) => found[field as string]));
      if (firstStep >= 0) go(firstStep);
      return;
    }
    setBusy(true); setMessage("");
    idempotencyKey.current ??= newIdempotencyKey();
    try {
      if (editReference) await secureApi("J4p9N2vC7mQ6",{ ...parsed.data, reference:editReference });
      else await secureApi("Z6m2C9pT4hQ7", { ...parsed.data, idempotencyKey: idempotencyKey.current });
      clearApplicationDraft(draftKey);
      router.push("/profile#requests"); router.refresh();
    } catch (error) {
      const body = error && typeof error === "object" && "body" in error ? (error as { body?: { fields?: Record<string, string> } }).body : undefined;
      if (body?.fields) {
        setErrors(body.fields);
        const first = STEP_FIELDS.findIndex(fields => fields.some(field => body.fields?.[field as string]));
        if (first >= 0) go(first);
      }
      setMessage(error instanceof TypeError ? "You appear to be offline. Your answers are still here; try again when you’re connected." : error instanceof Error ? error.message : "Please try again.");
    } finally { setBusy(false); }
  }

  const err = (key: string) => errors[key] ? <span className="field__error" id={`pan-${key}-error`} role="alert">{errors[key]}</span> : null;
  const input = (key: keyof PanIntake, label: string, type = "text", extra: Record<string, string> = {}) => <label className="field" key={key}>
    <span className="field__label">{label}</span>
    <input type={type} value={String(data[key] ?? "")} onChange={(event) => update(key, event.target.value as never)} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `pan-${key}-error` : undefined} {...extra}/>
    {err(key)}
  </label>;
  const seg = (key: keyof PanIntake, label: string, options: [string, string][]) => <fieldset className="field" key={key}>
    <legend className="field__label">{label}</legend>
    <div className="seg seg--wrap">{options.map(([value, text]) => <button key={value} type="button" className={String(data[key]) === value ? "is-active" : undefined} aria-pressed={String(data[key]) === value} onClick={() => update(key, value as never)}>{text}</button>)}</div>
    {err(key)}
  </fieldset>;

  const showSampleForm = () => {
    const sample: Record<string,string> = {
      personTitle:"Shri",personSurname:"APPLICANT",personFirst:"DEMO",personMiddle:"",
      printedName:"DEMO APPLICANT",previousName:"No",gender:"Male",dob:"15/06/1994",
      singleMother:"No",fatherSurname:"APPLICANT",fatherFirst:"EXAMPLE",fatherMiddle:"",
      motherSurname:"APPLICANT",motherFirst:"SAMPLE",motherMiddle:"",printedParent:"Father",
      residenceHouse:"12",residenceBuilding:"DEMO BUILDING",residenceStreet:"SAMPLE ROAD",
      residenceLocality:"TEST LOCALITY",residenceCity:"JAMSHEDPUR",residenceState:"JHARKHAND",
      residencePin:"831004",residenceCountry:"INDIA",officeAddress:"No",
      communicationAddress:"Residence",phoneCountryCode:"91",mobile:"9000000000",
      email:"demo@example.com",status:"Individual",aadhaarAllotted:"No",
      incomeSalary:"Yes",incomeBusiness:"No",incomeHouse:"No",incomeCapital:"No",
      incomeOther:"No",incomeNone:"No",raApplicable:"No",
      identityProof:"Voter ID",addressProof:"Voter ID",birthProof:"Birth certificate",
      declarationName:"DEMO APPLICANT",declarationCapacity:"SELF",declarationPlace:"JAMSHEDPUR",
      declarationDate:"25/10/2026",declaration:"Yes",
    };
    const formAnswers = form93 ? Object.fromEntries(Object.entries({...sample,residenceStatus:"Resident",communicationSameAsResidence:"Yes"}).filter(([key])=>intakeSections("pan93").some(section=>section.fields.some(f=>f.id===key)))) : sample;
    setData(current => ({
      ...current, service:"new", applicant:"individual", citizenship:"indian", existingPan:"no",
      residency:"india", entityType:"", fullName:"DEMO APPLICANT", birthDate:"1994-06-15",
      representative:"",contactName:"DEMO APPLICANT", email:"demo@example.com",phone:"+919000000000",
      address:"12, Sample Road, Test Locality",city:"Jamshedpur",state:"Jharkhand",
      country:"India",postalCode:"831004",consent:false,documentPlan:[],
      detailedIntake:{kind:form93?"pan93":"pan49a",answers:formAnswers,documents:[]},
    }));
    setErrors({});
    setPreviewConfirmed(false);
    setMessage("");
    setShowPreview(true);
  };

  const previewCard = (review = false) => <div className="pan49-open-card">
    <div className="pan49-open-card__info"><span className="pan49-open-card__icon"><FileText size={23} aria-hidden="true"/></span><div>
      <strong>{review ? (form93 ? "Your completed Form 93 is ready for review" : "Your completed Form 49A is ready for review") : "See your form as a real two-page document"}</strong>
      <p>{review ? "Open the document, check both pages and return here to confirm before sending." : "Preview your entered fields at any time. Blank fields remain empty until completed."}</p>
    </div></div>
    <button className="pan49-open-card__button" type="button" onClick={() => {
      if(!authenticated){setMessage("Complete the application and sign in to see the full document preview.");return;}
      setShowPreview(true);
    }}><Eye size={18} aria-hidden="true"/>{review ? "Open final preview" : "Preview filled PAN form"}</button>
  </div>;

  const frame = (content: React.ReactNode) => <WizardFrame
    kicker={form93 ? "Form 93 · 4 steps" : referenceMode ? "PAN Form 49A reference · 4 steps" : "PAN assistance · 4 steps"}
    title={<>Let’s prepare your <span className="grad-text">{editReference ? "saved PAN form." : form93 ? "Form 93 worksheet." : referenceMode ? "Form 49A worksheet." : "PAN request."}</span></>}
    lead={form93 ? "Complete the Form 93 applicant details and verify them against the exact two-page specimen. Barcode, official number, receipt, photo, signature and staff-only processing follow later." : referenceMode ? "Archived Form 49A reference, not an official application." : "One guided form for every PAN service. This sends a request to NISE COMPORT; it does not submit a government application or take payment."}
    steps={STEPS} current={step} onJump={go} locale={locale}
    strip={<OfferStrip category="government-services" locale={locale}/>}
    rail={<OfferRail category="government-services" locale={locale} whatsappText="Hi NISE COMPORT, I have a question about PAN."/>}
  >{content}</WizardFrame>;

  if (editLoading) return frame(<p className="alert alert--info" role="status">Loading your securely saved PAN form…</p>);



  return <>{frame(<form className="wizard-form" noValidate onSubmit={(event) => { event.preventDefault(); if (step === 3) { if (!authenticated) { void submit(); return; } if (referenceMode && !previewConfirmed) { setMessage("Review both pages of the applicant-only preview and tick the verification confirmation."); return; } if (demo) void submit(); else setShowConsent(true); } else void next(); }}>
    {demo && <p className="alert alert--info">Local preview: entered information is not saved or sent.</p>}
    {referenceMode && demo && signedIn && <div className="pan49-open-card">
      <div className="pan49-open-card__info"><span className="pan49-open-card__icon"><FileText size={23} aria-hidden="true"/></span>
        <div><strong>Test the completed PDF layout instantly</strong><p>Load entirely fictional sample data and open the two-page preview. No account or submission required.</p></div>
      </div>
      <button className="pan49-open-card__button" type="button" onClick={showSampleForm}><Eye size={18} aria-hidden="true"/>Show filled sample in modal</button>
    </div>}
    {step === 0 && <section>
      <h2>Which PAN service do you need?</h2><p className="wizard-form__sub">Pick one. We’ll adapt the next questions.</p>
      <div className="choice-grid choice-grid--2" role="radiogroup" aria-label="PAN service">{(referenceMode ? panServices.filter(item => ["new","minor"].includes(item)) : panServices).map((item) => <button key={item} type="button" role="radio" aria-checked={data.service === item} className={data.service === item ? "choice is-selected" : "choice"} onClick={() => update("service", item)}><span className="choice__text"><b>{panServiceLabels[item]}</b></span><span className="choice__check" aria-hidden="true">{data.service === item && <Check size={16}/>}</span></button>)}</div>
      {err("service")}
      <div className="form-grid">
        {referenceMode ? <p className="field"><span className="field__label">Existing PAN</span><strong>No PAN allotted (new individual application)</strong></p> : seg("existingPan", "Has a PAN already been allotted?", [["no", "No"], ["yes", "Yes"], ["unsure", "Not sure"]])}
        {referenceMode ? <p className="field"><span className="field__label">Applicant status</span><strong>Individual</strong></p> : seg("applicant", "Applicant", [["individual", "Individual"], ["entity", "Business / entity"]])}
        {referenceMode ? <p className="field"><span className="field__label">Citizenship / origin</span><strong>Indian individual</strong></p> : seg("citizenship", "Citizenship / origin", [["indian", "Indian"], ["foreign", "Foreign"]])}
        {!referenceMode && seg("residency", "Communication address", [["india", "In India"], ["overseas", "Outside India"]])}
      </div>
      {data.applicant === "entity" && seg("entityType", "Entity type", ["huf", "firm", "llp", "company", "trust", "society", "association", "other"].map((value) => [value, value.toUpperCase()] as [string, string]))}
    </section>}

    {step === 1 && <section>
      <h2>Applicant &amp; contact details</h2><p className="wizard-form__sub">{referenceMode ? "Enter the applicant details exactly as on your documents. Sensitive identity numbers are encrypted; never enter OTPs." : "As they should appear on the application. Don’t enter PAN, Aadhaar numbers or OTPs."}</p>
      {referenceMode && <p className="field__hint">Name, DOB, email and residence/contact details below also populate the main application automatically. You do not need to type them twice.</p>}
      {referenceMode && ["pan49a","pan93"].includes(data.detailedIntake?.kind??"") && previewCard()}
      {!referenceMode && <><div className="form-grid">
        {input("fullName", data.applicant === "entity" ? "Entity full name" : "Applicant full name", "text", { autoComplete: "name" })}
        {input("birthDate", data.applicant === "entity" ? "Date of incorporation / formation" : "Date of birth", "date")}
        {input("representative", "Parent, guardian or authorised representative")}
        {input("contactName", "Contact person’s name")}
        {input("email", "Contact email", "email", { autoComplete: "email" })}
        {input("phone", "Phone with country code", "tel", { autoComplete: "tel", placeholder: "+919876543210" })}
      </div>
      <div className="form-grid">
        <div className="field--full">{input("address", "Communication address", "text", { autoComplete: "street-address" })}</div>
        <label className="field" key="country"><span className="field__label">Country</span>
          <select value={data.country} onChange={(event) => { update("country", event.target.value as never); if (data.state && !statesFor(event.target.value).includes(data.state)) { update("state", "" as never); update("city", "" as never); } }} aria-invalid={Boolean(errors.country)}>
            {COUNTRIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          {err("country")}
        </label>
        <label className="field" key="state"><span className="field__label">State / province</span><StateSelect country={data.country} value={data.state} onChange={(next) => { update("state", next as never); update("city", "" as never); }}/>{err("state")}</label>
        <label className="field" key="city"><span className="field__label">City</span><CitySelect country={data.country} state={data.state} value={data.city} onChange={(next) => update("city", next as never)}/>{err("city")}</label>
        {input("postalCode", "PIN / postal code", "text", { inputMode: "numeric", autoComplete: "postal-code" })}
      </div></>}
      {(data.applicant==="individual" || referenceMode) && data.detailedIntake && <DetailedIntakeFields
        intake={data.detailedIntake} onChange={(next)=>update("detailedIntake",next)}
        errors={errors.detailedIntake?validateDetailedIntake(data.detailedIntake):{}}/>}

      {["correction", "marriage", "minor-to-major"].includes(data.service) && <fieldset className="field"><legend className="field__label">Which details need updating?</legend>
        <div className="check-grid">{CORRECTIONS.map((value) => <label className="check" key={value}><input type="checkbox" checked={data.corrections.includes(value)} onChange={(event) => update("corrections", event.target.checked ? [...data.corrections, value] : data.corrections.filter((item) => item !== value))}/><span>{pretty(value)}</span></label>)}</div>
        {err("corrections")}
      </fieldset>}
    </section>}

    {step === 2 && <section>
      <h2>Prepare your documents</h2><p className="wizard-form__sub">Tick what you have ready. We confirm the exact proofs for your category before asking you to share them securely.</p>
      <div className="check-grid">{DOCUMENTS.map((value) => <label className="check check--card" key={value}><input type="checkbox" checked={data.documentPlan.includes(value)} onChange={(event) => update("documentPlan", event.target.checked ? [...data.documentPlan, value] : data.documentPlan.filter((item) => item !== value))}/><span>{pretty(value)} proof</span></label>)}</div>
      <label className="field"><span className="field__label">What help do you need? <em>optional</em></span><textarea maxLength={1500} rows={4} value={data.notes} onChange={(event) => update("notes", event.target.value)}/></label>
      <label className="check"><input type="checkbox" checked={data.consent} onChange={(event) => update("consent", event.target.checked)}/><span>I confirm these details and consent to NISE COMPORT contacting me about this assistance request.</span></label>
      {err("consent")}
    </section>}

    {step === 3 && !authenticated && <section className="preview-signin-gate">
      <LockKeyhole size={24}/>
      <h2>Sign in to preview your PAN application</h2>
      <p>Your completed entries are stored in encrypted tab storage and will be restored when you return after sign-in. The detailed PDF remains hidden until login.</p>
      <div className="callout__actions"><button type="button" className="btn btn--primary" onClick={()=>{void submit()}}>Sign in to preview</button>
        <Link className="btn btn--ghost" href="/signup" onClick={()=>rememberReturn(returnPath)}>Create an account</Link></div>
    </section>}
    {step === 3 && authenticated && <section>
      <h2>Review before sending</h2><p className="wizard-form__sub">Check everything once. You can edit any step.</p>
      {referenceMode && ["pan49a","pan93"].includes(data.detailedIntake?.kind??"") && previewCard(true)}
      {!referenceMode && data.applicant==="individual" && data.detailedIntake && <DetailedIntakePreview intake={data.detailedIntake}/>}
      {referenceMode && <label className="check"><input type="checkbox" checked={previewConfirmed} onChange={event => setPreviewConfirmed(event.target.checked)}/><span>I have compared both preview pages with the supporting documents and confirmed the entered information is correct.</span></label>}
      <dl className="summary">{(Object.keys(LABELS) as (keyof PanIntake)[]).map((key) => {
        const value = data[key];
        const text = key === "service" ? panServiceLabels[data.service] : Array.isArray(value) ? value.map(pretty).join(", ") || "None selected" : String(value || "Not provided");
        const target = STEP_FIELDS.findIndex((fields) => fields.includes(key));
        return <div key={key}><dt>{LABELS[key]}</dt><dd>{text}</dd><button type="button" onClick={() => go(Math.max(0, target))}>Edit</button></div>;
      })}</dl>
    </section>}

    {Object.keys(errors).length > 0 && step !== 3 && <div className="alert alert--error" role="alert">Please check the highlighted details.</div>}
    {message && <p className="alert alert--info" role="status">{message}</p>}
    <WizardActions locale={locale} onBack={step > 0 ? () => go(step - 1) : undefined} nextLabel={step===2 && !authenticated ? "Sign in to preview" : step===3 && !authenticated ? "Sign in to preview" : step===3 ? editReference ? "Save corrected PAN form" : "Send PAN request" : undefined}
      nextDisabled={!tabDraftReady} busy={busy}/>
  </form>)}
  {referenceMode && (authenticated || (demo && signedIn)) && ["pan49a","pan93"].includes(data.detailedIntake?.kind??"") && <Pan49AModal
    form93={form93}
    open={showPreview}
    pan={data}
    answers={data.detailedIntake?.answers ?? {}}
    onClose={() => setShowPreview(false)}
    onEdit={() => { setShowPreview(false); go(1); }}
  />}
  <ConsentModal open={showConsent} onClose={() => setShowConsent(false)} busy={busy} serviceLabel={panServiceLabels[data.service]} onConfirm={() => { setShowConsent(false); void submit(); }}/>
  </>;
}
