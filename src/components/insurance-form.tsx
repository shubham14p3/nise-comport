"use client";

import Link from "next/link";
import { FormEvent, type InputHTMLAttributes, useEffect, useState } from "react";
import { Bike, Car, CircleCheck, FileText, Paperclip, Send, ShieldCheck, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { ADD_ONS, COVER_CHOICES, FUELS, INCIDENTS, INSURERS, PURPOSES, type InsurancePurpose } from "@/lib/motor-insurance";
import { fillText, INSURANCE_TEXT as T } from "@/lib/i18n-forms";
import { useLocale } from "@/lib/use-locale";
import { WHATSAPP_NUMBER } from "@/lib/public-contact";
import { rememberReturn } from "@/lib/after-login";
import { secureApi, secureUpload } from "@/lib/secure-api-client";

type Upload = { id: string; name: string };
const WA = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

/**
 * Car & bike insurance form: new policy, renewal, expired policy or claim help. Signed-in customers
 * can attach the RC and old policy and track the request; visitors get a call back.
 */
export default function InsuranceForm({ initialPurpose, initialVehicle }: { initialPurpose?: InsurancePurpose; initialVehicle?: "bike" | "car" }) {
  const [purpose, setPurpose] = useState<InsurancePurpose>(initialPurpose ?? "renew");
  const [vehicle, setVehicle] = useState<"bike" | "car">(initialVehicle ?? "bike");
  const [f, setF] = useState<Record<string, string>>({ city: "Jamshedpur", claimedLastYear: "no", cover: "comprehensive", term: "1 year", loan: "no", fir: "na" });
  const [addOns, setAddOns] = useState<string[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ kind: string; reference?: string } | null>(null);
  const locale = useLocale();
  const L = (text: Record<"en" | "hi" | "bn", string>) => text[locale];

  useEffect(() => {
    let active = true;
    secureApi<{ user: { role: string } | null }>("C4w7G2hN6kP9").then((result) => { if (active) setSignedIn(Boolean(result.user && result.user.role !== "demo")); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  // Server messages are English; show the field's message in the chosen language instead.
  const problem = (key: string) => T.problems[key] ? L(T.problems[key]) : errors[key];
  const set = (key: string) => (event: { target: { value: string } }) => setF({ ...f, [key]: event.target.value });
  const field = (key: string, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => <label className="field">
    <span className="field__label">{label}{props.required ? "" : <em> {L(T.optional)}</em>}</span>
    <input value={f[key] ?? ""} onChange={set(key)} aria-invalid={Boolean(errors[key])} {...props}/>
    {(errors[key] || hint) && <span className={errors[key] ? "field__error" : "field__hint"}>{errors[key] ? problem(key) : hint}</span>}
  </label>;

  async function attach(file: File | undefined) {
    if (!file) return;
    setUploading(true); setError("");
    try { const result = await secureUpload<{ file: { id: string } }>("U7b3R8mQ4zL1", file); setUploads([...uploads, { id: result.file.id, name: file.name }].slice(0, 4)); }
    catch (reason) { setError(locale === "en" && reason instanceof Error ? reason.message : L(T.attachFailed)); }
    finally { setUploading(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setErrors({});
    try {
      const result = await secureApi<{ kind: string; request?: { reference: string } }>("M9q2X5wJ8tB3", { consent, fileIds: uploads.map((item) => item.id), form: { ...f, purpose, vehicle, addOns } });
      setDone({ kind: result.kind, reference: result.request?.reference });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (reason) {
      const body = (reason as { body?: { fields?: Record<string, string> } }).body;
      const fields = body?.fields;
      if (fields) setErrors(fields);
      setError(fields ? L(T.sendFailed) : locale === "en" && reason instanceof Error ? reason.message : L(T.sendFailed));
    } finally { setBusy(false); }
  }

  if (done) return <div className="ins-form ins-done" role="status">
    <CircleCheck size={42}/>
    <h2>{L(T.thanks)}{f.name?.split(/\s+/)[0] ? `, ${f.name.split(/\s+/)[0]}` : ""}!</h2>
    <p>{done.kind === "request" ? fillText(L(T.doneRequest), { ref: done.reference ?? "" }) : fillText(L(T.doneLead), { phone: f.phone ?? "" })}</p>
    <div className="ins-done__actions">
      {done.kind === "request" && <Link className="btn btn--primary" href="/profile#requests">{L(T.track)}</Link>}
      <a className="btn btn--wa" href={WA(`Hi NISE COMPORT, I just sent the ${vehicle} insurance form (${PURPOSES[purpose]}).`)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={17}/>{L(T.waUs)}</a>
    </div>
  </div>;

  const renewing = purpose === "renew" || purpose === "expired";
  const opt = <em> {L(T.optional)}</em>;
  return <form className="ins-form" onSubmit={submit} noValidate>
    <div className="ins-form__choice">
      <span className="field__label">{L(T.need)}</span>
      <div className="ins-chips">{(Object.keys(PURPOSES) as InsurancePurpose[]).map((id) => <button key={id} type="button" className={purpose === id ? "is-active" : undefined} aria-pressed={purpose === id} onClick={() => setPurpose(id)}>{L(T.purposes[id])}</button>)}</div>
      <div className="ins-chips ins-chips--big">
        <button type="button" className={vehicle === "bike" ? "is-active" : undefined} aria-pressed={vehicle === "bike"} onClick={() => setVehicle("bike")}><Bike size={22}/>{L(T.bike)}</button>
        <button type="button" className={vehicle === "car" ? "is-active" : undefined} aria-pressed={vehicle === "car"} onClick={() => setVehicle("car")}><Car size={22}/>{L(T.car)}</button>
      </div>
      {purpose === "expired" && <p className="alert alert--warn">{L(T.expiredWarn)}</p>}
    </div>

    <fieldset className="ins-section"><legend>{L(T.vehicleLegend)}</legend>
      <div className="form-grid form-grid--3">
        {field("regNo", L(T.regNo), { required: purpose !== "new", placeholder: "JH05AB1234", maxLength: 14, autoCapitalize: "characters" }, purpose === "new" ? L(T.regNoNew) : undefined)}
        {field("make", L(T.make), { placeholder: vehicle === "car" ? "Maruti, Tata, Hyundai…" : "Hero, Honda, TVS…", maxLength: 40, required: purpose === "new" })}
        {field("model", L(T.model), { placeholder: vehicle === "car" ? "Swift VXi" : "Splendor Plus", maxLength: 60, required: purpose === "new" })}
      </div>
      <div className="form-grid form-grid--3">
        <label className="field"><span className="field__label">{L(T.fuel)}{opt}</span><select value={f.fuel ?? ""} onChange={set("fuel")}><option value="">{L(T.choose)}</option>{FUELS.map((item) => <option key={item} value={item}>{T.fuels[item] ? L(T.fuels[item]) : item}</option>)}</select></label>
        {field("year", L(T.year), { inputMode: "numeric", maxLength: 4, placeholder: "2021" })}
        {field("city", L(T.city), { maxLength: 40 })}
      </div>
    </fieldset>

    {purpose !== "new" && <fieldset className="ins-section"><legend>{L(T.policyLegend)}</legend>
      <div className="form-grid form-grid--3">
        <label className="field"><span className="field__label">{L(T.insurer)}{opt}</span><input list="insurers" value={f.prevInsurer ?? ""} onChange={set("prevInsurer")} placeholder={L(T.startTyping)} maxLength={60}/><datalist id="insurers">{INSURERS.map((name) => <option key={name} value={name}/>)}</datalist></label>
        <label className="field"><span className="field__label">{L(T.policyType)}{opt}</span><select value={f.prevType ?? ""} onChange={set("prevType")}><option value="">{L(T.notSure)}</option>{Object.keys(T.prevTypes).map((value) => <option key={value} value={value}>{L(T.prevTypes[value])}</option>)}</select></label>
        {field("expiry", purpose === "expired" ? L(T.expiredOn) : L(T.endsOn), { type: "date" }, renewing ? L(T.remind) : undefined)}
      </div>
      <div className="form-grid form-grid--3">
        <label className="field"><span className="field__label">{L(T.claimed)}</span><select value={f.claimedLastYear} onChange={set("claimedLastYear")}><option value="no">{L(T.no)}</option><option value="yes">{L(T.yes)}</option><option value="unsure">{L(T.notSure)}</option></select></label>
        <label className="field"><span className="field__label">{L(T.ncb)}{opt}</span><select value={f.ncb ?? ""} onChange={set("ncb")}><option value="">{L(T.notSure)}</option>{["0", "20", "25", "35", "45", "50"].map((value) => <option key={value} value={value}>{value}%</option>)}</select></label>
        {field("policyNo", L(T.policyNo), { maxLength: 40 })}
      </div>
    </fieldset>}

    {purpose === "claim" ? <fieldset className="ins-section"><legend>{L(T.happened)}</legend>
      <div className="form-grid form-grid--3">
        <label className="field"><span className="field__label">{L(T.type)}</span><select value={f.incident ?? ""} onChange={set("incident")} aria-invalid={Boolean(errors.incident)}><option value="">{L(T.choose)}</option>{INCIDENTS.map((item) => <option key={item} value={item}>{T.incidents[item] ? L(T.incidents[item]) : item}</option>)}</select>{errors.incident && <span className="field__error">{problem("incident")}</span>}</label>
        {field("incidentDate", L(T.date), { type: "date" })}
        <label className="field"><span className="field__label">{L(T.fir)}</span><select value={f.fir} onChange={set("fir")}>{["na", "yes", "no"].map((value) => <option key={value} value={value}>{L(T.firOptions[value])}</option>)}</select></label>
      </div>
      <label className="field"><span className="field__label">{L(T.description)}{opt}</span><textarea rows={3} maxLength={600} value={f.incidentNote ?? ""} onChange={set("incidentNote")} placeholder={L(T.descriptionHint)}/></label>
    </fieldset> : <fieldset className="ins-section"><legend>{L(T.coverLegend)}</legend>
      <div className="form-grid form-grid--3">
        <label className="field"><span className="field__label">{L(T.policy)}</span><select value={f.cover} onChange={set("cover")}>{Object.keys(COVER_CHOICES).map((id) => <option key={id} value={id}>{T.covers[id] ? L(T.covers[id]) : COVER_CHOICES[id]}</option>)}</select></label>
        <label className="field"><span className="field__label">{L(T.term)}</span><select value={f.term} onChange={set("term")}>{Object.keys(T.terms).map((value) => <option key={value} value={value}>{L(T.terms[value])}</option>)}</select></label>
        <label className="field"><span className="field__label">{L(T.loan)}</span><select value={f.loan} onChange={set("loan")}><option value="no">{L(T.no)}</option><option value="yes">{L(T.yes)}</option></select></label>
      </div>
      <span className="field__label">{L(T.addOns)}{opt}</span>
      <div className="ins-addons">{ADD_ONS.map((item) => <label key={item.id} className={addOns.includes(item.id) ? "ins-addon is-on" : "ins-addon"}>
        <input type="checkbox" checked={addOns.includes(item.id)} onChange={() => setAddOns(addOns.includes(item.id) ? addOns.filter((id) => id !== item.id) : [...addOns, item.id])}/>
        <span><b>{T.addOnNames[item.id] ? L(T.addOnNames[item.id]) : item.name}</b><small>{T.addOnTexts[item.id] ? L(T.addOnTexts[item.id]) : item.text}</small></span>
      </label>)}</div>
    </fieldset>}

    <fieldset className="ins-section"><legend>{L(T.detailsLegend)}</legend>
      <div className="form-grid form-grid--3">
        {field("name", L(T.name), { required: true, maxLength: 80, autoComplete: "name" })}
        {field("phone", L(T.phone), { required: true, inputMode: "tel", maxLength: 16, autoComplete: "tel", placeholder: "98765 43210" })}
        {field("whatsapp", L(T.whatsapp), { inputMode: "tel", maxLength: 16, placeholder: L(T.ifDifferent) })}
      </div>
      <div className="form-grid form-grid--3">
        {field("email", L(T.email), { type: "email", maxLength: 120, autoComplete: "email" }, L(T.forPolicy))}
        {field("callTime", L(T.callTime), { maxLength: 40, placeholder: L(T.callTimePh) })}
        <label className="field"><span className="field__label">{L(T.note)}{opt}</span><input value={f.note ?? ""} onChange={set("note")} maxLength={600}/></label>
      </div>
      {signedIn ? <div className="ins-files">
        <span className="field__label">{L(T.files)}{purpose === "claim" ? L(T.filesClaim) : ""} <em> {L(T.filesHint)}</em></span>
        <label className="btn btn--ghost btn--sm"><Paperclip size={15}/>{uploading ? L(T.attaching) : L(T.attach)}<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" hidden disabled={uploading || uploads.length >= 4} onChange={(event) => { void attach(event.target.files?.[0]); event.target.value = ""; }}/></label>
        {uploads.map((item) => <span key={item.id} className="ins-file"><FileText size={14}/>{item.name}<button type="button" onClick={() => setUploads(uploads.filter((upload) => upload.id !== item.id))} aria-label={`Remove ${item.name}`}><X size={13}/></button></span>)}
      </div> : <p className="field__hint"><Link href="/login" onClick={() => rememberReturn("/insurance")}>{L(T.signIn)}</Link> {L(T.signInNote)}</p>}
    </fieldset>

    <p className="ins-note"><ShieldCheck size={16}/>{L(T.facilitator)}</p>
    <label className="check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required/> <span>{L(T.consent)}</span></label>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    <button className="btn btn--primary btn--lg" disabled={busy || !consent}><Send size={18}/>{busy ? L(T.sending) : purpose === "claim" ? L(T.getClaimHelp) : L(T.getQuotes)}</button>
  </form>;
}
