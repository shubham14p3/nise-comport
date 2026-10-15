"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LockKeyhole } from "lucide-react";
import { OfferRail, OfferStrip, WizardActions, WizardFrame } from "@/components/wizard";
import { newIdempotencyKey } from "@/lib/client-id";
import { panIntakeSchema, panServiceLabels, panServices, type PanIntake } from "@/lib/pan-validation";
import { secureApi } from "@/lib/secure-api-client";
import { useLocale } from "@/lib/use-locale";
import { rememberReturn } from "@/lib/after-login";

const STEPS = ["PAN service", "Applicant", "Documents", "Review"];
const STEP_FIELDS: (keyof PanIntake)[][] = [
  ["service", "existingPan", "applicant", "citizenship", "residency", "entityType"],
  ["fullName", "birthDate", "representative", "contactName", "email", "phone", "address", "city", "state", "country", "postalCode", "corrections"],
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
export default function PanRequestForm({ service, demo = false, signedIn = true }: { service: PanIntake["service"]; demo?: boolean; signedIn?: boolean }) {
  const router = useRouter();
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<PanIntake>({ service, citizenship: "indian", applicant: service === "business" ? "entity" : "individual", residency: "india", existingPan: ["new", "minor", "business"].includes(service) ? "no" : "yes", fullName: "", birthDate: "", contactName: "", email: "", phone: "", address: "", city: "", state: "", country: "India", postalCode: "", representative: "", entityType: "", corrections: [], documentPlan: [], notes: "", consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const idempotencyKey = useRef<string | null>(null);

  useEffect(() => {
    if (demo || !signedIn) return;
    let active = true;
    secureApi<{ user: { name: string; email: string; phone: string | null; city: string; state: string; postalCode: string } }>("P8a2N5dK1vR7").then(({ user }) => {
      if (!active) return;
      setData((current) => ({ ...current, contactName: current.contactName || user.name, email: current.email || user.email, phone: current.phone || user.phone || "", city: current.city || user.city, state: current.state || user.state, postalCode: current.postalCode || user.postalCode }));
    }).catch(() => undefined);
    return () => { active = false; };
  }, [demo, signedIn]);

  function update<K extends keyof PanIntake>(key: K, value: PanIntake[K]) {
    setData((current) => {
      const next = { ...current, [key]: value };
      if (key === "service") {
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

  function next() {
    const found = problemsFor(step);
    setErrors(found);
    if (Object.keys(found).length) return;
    go(step + 1);
  }

  async function submit() {
    const parsed = panIntakeSchema.safeParse(data);
    if (!parsed.success) {
      const found = Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
      setErrors(found);
      const firstStep = STEP_FIELDS.findIndex((fields) => fields.some((field) => found[field as string]));
      if (firstStep >= 0) go(firstStep);
      return;
    }
    if (demo) { setMessage("Preview validated. Create a real account to save and send this request."); return; }
    setBusy(true); setMessage("");
    idempotencyKey.current ??= newIdempotencyKey();
    try {
      await secureApi("Z6m2C9pT4hQ7", { ...parsed.data, idempotencyKey: idempotencyKey.current });
      router.push("/profile#requests"); router.refresh();
    } catch (error) {
      const body = error && typeof error === "object" && "body" in error ? (error as { body?: { fields?: Record<string, string> } }).body : undefined;
      if (body?.fields) setErrors(body.fields);
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

  const frame = (content: React.ReactNode) => <WizardFrame
    kicker="PAN assistance · 4 steps"
    title={<>Let’s prepare your <span className="grad-text">PAN request.</span></>}
    lead="One guided form for every PAN service. This sends a request to NISE COMPORT; it does not submit a government application or take payment."
    steps={STEPS} current={step} onJump={go} locale={locale}
    strip={<OfferStrip category="government-services" locale={locale}/>}
    rail={<OfferRail category="government-services" locale={locale} whatsappText="Hi NISE COMPORT, I have a question about PAN."/>}
  >{content}</WizardFrame>;

  if (!signedIn) return frame(<div className="callout callout--center"><LockKeyhole size={28}/><b>Sign in to keep your PAN request private</b><span>Your contact details prefill from your profile. You can review everything before sending.</span><div className="callout__actions"><Link className="btn btn--primary" href="/login" onClick={() => rememberReturn("/pan/request")}>Sign in to continue</Link><Link className="btn btn--ghost" href="/signup" onClick={() => rememberReturn("/pan/request")}>Create a free account</Link></div></div>);

  return frame(<form className="wizard-form" noValidate onSubmit={(event) => { event.preventDefault(); if (step === 3) void submit(); else next(); }}>
    {demo && <p className="alert alert--info">Local preview: entered information is not saved or sent.</p>}
    {step === 0 && <section>
      <h2>Which PAN service do you need?</h2><p className="wizard-form__sub">Pick one. We’ll adapt the next questions.</p>
      <div className="choice-grid choice-grid--2" role="radiogroup" aria-label="PAN service">{panServices.map((item) => <button key={item} type="button" role="radio" aria-checked={data.service === item} className={data.service === item ? "choice is-selected" : "choice"} onClick={() => update("service", item)}><span className="choice__text"><b>{panServiceLabels[item]}</b></span><span className="choice__check" aria-hidden="true">{data.service === item && <Check size={16}/>}</span></button>)}</div>
      {err("service")}
      <div className="form-grid">
        {seg("existingPan", "Has a PAN already been allotted?", [["no", "No"], ["yes", "Yes"], ["unsure", "Not sure"]])}
        {seg("applicant", "Applicant", [["individual", "Individual"], ["entity", "Business / entity"]])}
        {seg("citizenship", "Citizenship / origin", [["indian", "Indian"], ["foreign", "Foreign"]])}
        {seg("residency", "Communication address", [["india", "In India"], ["overseas", "Outside India"]])}
      </div>
      {data.applicant === "entity" && seg("entityType", "Entity type", ["huf", "firm", "llp", "company", "trust", "society", "association", "other"].map((value) => [value, value.toUpperCase()] as [string, string]))}
    </section>}

    {step === 1 && <section>
      <h2>Applicant &amp; contact details</h2><p className="wizard-form__sub">As they should appear on the application. Don’t enter PAN, Aadhaar numbers or OTPs.</p>
      <div className="form-grid">
        {input("fullName", data.applicant === "entity" ? "Entity full name" : "Applicant full name", "text", { autoComplete: "name" })}
        {input("birthDate", data.applicant === "entity" ? "Date of incorporation / formation" : "Date of birth", "date")}
        {input("representative", "Parent, guardian or authorised representative")}
        {input("contactName", "Contact person’s name")}
        {input("email", "Contact email", "email", { autoComplete: "email" })}
        {input("phone", "Phone with country code", "tel", { autoComplete: "tel", placeholder: "+919876543210" })}
      </div>
      <div className="form-grid">
        <div className="field--full">{input("address", "Communication address", "text", { autoComplete: "street-address" })}</div>
        {input("city", "City", "text", { autoComplete: "address-level2" })}
        {input("state", "State / province", "text", { autoComplete: "address-level1" })}
        {input("country", "Country", "text", { autoComplete: "country-name" })}
        {input("postalCode", "PIN / postal code", "text", { inputMode: "numeric", autoComplete: "postal-code" })}
      </div>
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

    {step === 3 && <section>
      <h2>Review before sending</h2><p className="wizard-form__sub">Check everything once. You can edit any step.</p>
      <dl className="summary">{(Object.keys(LABELS) as (keyof PanIntake)[]).map((key) => {
        const value = data[key];
        const text = key === "service" ? panServiceLabels[data.service] : Array.isArray(value) ? value.map(pretty).join(", ") || "None selected" : String(value || "Not provided");
        const target = STEP_FIELDS.findIndex((fields) => fields.includes(key));
        return <div key={key}><dt>{LABELS[key]}</dt><dd>{text}</dd><button type="button" onClick={() => go(Math.max(0, target))}>Edit</button></div>;
      })}</dl>
    </section>}

    {Object.keys(errors).length > 0 && step !== 3 && <div className="alert alert--error" role="alert">Please check the highlighted details.</div>}
    {message && <p className="alert alert--info" role="status">{message}</p>}
    <WizardActions locale={locale} onBack={step > 0 ? () => go(step - 1) : undefined} nextLabel={step === 3 ? demo ? "Validate preview" : "Send PAN request" : undefined} busy={busy}/>
  </form>);
}
