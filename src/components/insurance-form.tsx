"use client";

import Link from "next/link";
import { FormEvent, type InputHTMLAttributes, useEffect, useState } from "react";
import { Bike, Car, CircleCheck, FileText, Paperclip, Send, ShieldCheck, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { ADD_ONS, COVER_CHOICES, FACILITATOR_NOTE, FUELS, INCIDENTS, INSURERS, PURPOSES, type InsurancePurpose } from "@/lib/motor-insurance";
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

  useEffect(() => {
    let active = true;
    secureApi<{ user: { role: string } | null }>("C4w7G2hN6kP9").then((result) => { if (active) setSignedIn(Boolean(result.user && result.user.role !== "demo")); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const set = (key: string) => (event: { target: { value: string } }) => setF({ ...f, [key]: event.target.value });
  const field = (key: string, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => <label className="field">
    <span className="field__label">{label}{props.required ? "" : <em> optional</em>}</span>
    <input value={f[key] ?? ""} onChange={set(key)} aria-invalid={Boolean(errors[key])} {...props}/>
    {(errors[key] || hint) && <span className={errors[key] ? "field__error" : "field__hint"}>{errors[key] ?? hint}</span>}
  </label>;

  async function attach(file: File | undefined) {
    if (!file) return;
    setUploading(true); setError("");
    try { const result = await secureUpload<{ file: { id: string } }>("U7b3R8mQ4zL1", file); setUploads([...uploads, { id: result.file.id, name: file.name }].slice(0, 4)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not attach the file."); }
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
      setError(reason instanceof Error ? reason.message : "Could not send the form.");
    } finally { setBusy(false); }
  }

  if (done) return <div className="ins-form ins-done" role="status">
    <CircleCheck size={42}/>
    <h2>Thank you, {f.name?.split(/\s+/)[0] || "we got it"}!</h2>
    <p>{done.kind === "request" ? <>Your request <b>{done.reference}</b> is with our team. We’ll call or WhatsApp you with quotes from the insurers, usually the same working day.</> : <>Our team will call you on <b>{f.phone}</b> with quotes, usually the same working day.</>}</p>
    <div className="ins-done__actions">
      {done.kind === "request" && <Link className="btn btn--primary" href="/profile#requests">Track my request</Link>}
      <a className="btn btn--wa" href={WA(`Hi NISE COMPORT, I just sent the ${vehicle} insurance form (${PURPOSES[purpose]}).`)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={17}/>WhatsApp us</a>
    </div>
  </div>;

  const renewing = purpose === "renew" || purpose === "expired";
  return <form className="ins-form" onSubmit={submit} noValidate>
    <div className="ins-form__choice">
      <span className="field__label">What do you need?</span>
      <div className="ins-chips">{(Object.keys(PURPOSES) as InsurancePurpose[]).map((id) => <button key={id} type="button" className={purpose === id ? "is-active" : undefined} aria-pressed={purpose === id} onClick={() => setPurpose(id)}>{PURPOSES[id]}</button>)}</div>
      <div className="ins-chips ins-chips--big">
        <button type="button" className={vehicle === "bike" ? "is-active" : undefined} aria-pressed={vehicle === "bike"} onClick={() => setVehicle("bike")}><Bike size={22}/>Bike / scooter</button>
        <button type="button" className={vehicle === "car" ? "is-active" : undefined} aria-pressed={vehicle === "car"} onClick={() => setVehicle("car")}><Car size={22}/>Car</button>
      </div>
      {purpose === "expired" && <p className="alert alert--warn">An expired policy gives no cover. Don’t drive until it’s renewed. The insurer may ask for an inspection (photos or a visit); the No Claim Bonus is kept only if you renew within 90 days.</p>}
    </div>

    <fieldset className="ins-section"><legend>Vehicle</legend>
      <div className="form-grid form-grid--3">
        {field("regNo", "Vehicle number", { required: purpose !== "new", placeholder: "JH05AB1234", maxLength: 14, autoCapitalize: "characters" }, purpose === "new" ? "Leave empty if not registered yet" : undefined)}
        {field("make", "Make", { placeholder: vehicle === "car" ? "Maruti, Tata, Hyundai…" : "Hero, Honda, TVS…", maxLength: 40, required: purpose === "new" })}
        {field("model", "Model / variant", { placeholder: vehicle === "car" ? "Swift VXi" : "Splendor Plus", maxLength: 60, required: purpose === "new" })}
      </div>
      <div className="form-grid form-grid--3">
        <label className="field"><span className="field__label">Fuel <em> optional</em></span><select value={f.fuel ?? ""} onChange={set("fuel")}><option value="">Choose</option>{FUELS.map((item) => <option key={item}>{item}</option>)}</select></label>
        {field("year", "Year of manufacture", { inputMode: "numeric", maxLength: 4, placeholder: "2021" })}
        {field("city", "City of registration", { maxLength: 40 })}
      </div>
    </fieldset>

    {purpose !== "new" && <fieldset className="ins-section"><legend>Current / last policy</legend>
      <div className="form-grid form-grid--3">
        <label className="field"><span className="field__label">Insurer <em> optional</em></span><input list="insurers" value={f.prevInsurer ?? ""} onChange={set("prevInsurer")} placeholder="Start typing" maxLength={60}/><datalist id="insurers">{INSURERS.map((name) => <option key={name} value={name}/>)}</datalist></label>
        <label className="field"><span className="field__label">Policy type <em> optional</em></span><select value={f.prevType ?? ""} onChange={set("prevType")}><option value="">Not sure</option><option>Comprehensive</option><option>Third-party only</option><option>Own damage only</option></select></label>
        {field("expiry", purpose === "expired" ? "Expired on" : "Policy ends on", { type: "date" }, renewing ? "We remind you before it’s due next year." : undefined)}
      </div>
      <div className="form-grid form-grid--3">
        <label className="field"><span className="field__label">Any claim in the last policy year?</span><select value={f.claimedLastYear} onChange={set("claimedLastYear")}><option value="no">No</option><option value="yes">Yes</option><option value="unsure">Not sure</option></select></label>
        <label className="field"><span className="field__label">Current NCB <em> optional</em></span><select value={f.ncb ?? ""} onChange={set("ncb")}><option value="">Not sure</option>{["0", "20", "25", "35", "45", "50"].map((value) => <option key={value} value={value}>{value}%</option>)}</select></label>
        {field("policyNo", "Policy number", { maxLength: 40 })}
      </div>
    </fieldset>}

    {purpose === "claim" ? <fieldset className="ins-section"><legend>What happened</legend>
      <div className="form-grid form-grid--3">
        <label className="field"><span className="field__label">Type</span><select value={f.incident ?? ""} onChange={set("incident")} aria-invalid={Boolean(errors.incident)}><option value="">Choose</option>{INCIDENTS.map((item) => <option key={item}>{item}</option>)}</select>{errors.incident && <span className="field__error">{errors.incident}</span>}</label>
        {field("incidentDate", "Date", { type: "date" })}
        <label className="field"><span className="field__label">Police FIR</span><select value={f.fir} onChange={set("fir")}><option value="na">Not needed / not sure</option><option value="yes">Filed</option><option value="no">Not yet</option></select></label>
      </div>
      <label className="field"><span className="field__label">Short description <em> optional</em></span><textarea rows={3} maxLength={600} value={f.incidentNote ?? ""} onChange={set("incidentNote")} placeholder="Where, how, what is damaged. Don’t move a badly damaged vehicle before photos."/></label>
    </fieldset> : <fieldset className="ins-section"><legend>Cover you want</legend>
      <div className="form-grid form-grid--3">
        <label className="field"><span className="field__label">Policy</span><select value={f.cover} onChange={set("cover")}>{Object.entries(COVER_CHOICES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label className="field"><span className="field__label">Term</span><select value={f.term} onChange={set("term")}><option>1 year</option><option>Long-term (2–5 years)</option><option>Not sure</option></select></label>
        <label className="field"><span className="field__label">On loan / hypothecation?</span><select value={f.loan} onChange={set("loan")}><option value="no">No</option><option value="yes">Yes</option></select></label>
      </div>
      <span className="field__label">Add-ons you’d like quotes for <em> optional</em></span>
      <div className="ins-addons">{ADD_ONS.map((item) => <label key={item.id} className={addOns.includes(item.id) ? "ins-addon is-on" : "ins-addon"} title={item.text}>
        <input type="checkbox" checked={addOns.includes(item.id)} onChange={() => setAddOns(addOns.includes(item.id) ? addOns.filter((id) => id !== item.id) : [...addOns, item.id])}/>
        <span><b>{item.name}</b><small>{item.text}</small></span>
      </label>)}</div>
    </fieldset>}

    <fieldset className="ins-section"><legend>Your details</legend>
      <div className="form-grid form-grid--3">
        {field("name", "Owner’s name", { required: true, maxLength: 80, autoComplete: "name" })}
        {field("phone", "Mobile number", { required: true, inputMode: "tel", maxLength: 16, autoComplete: "tel", placeholder: "98765 43210" })}
        {field("whatsapp", "WhatsApp number", { inputMode: "tel", maxLength: 16, placeholder: "If different" })}
      </div>
      <div className="form-grid form-grid--3">
        {field("email", "Email", { type: "email", maxLength: 120, autoComplete: "email" }, "For the policy copy")}
        {field("callTime", "Best time to call", { maxLength: 40, placeholder: "e.g. after 6 pm" })}
        <label className="field"><span className="field__label">Anything else <em> optional</em></span><input value={f.note ?? ""} onChange={set("note")} maxLength={600}/></label>
      </div>
      {signedIn ? <div className="ins-files">
        <span className="field__label">RC, old policy{purpose === "claim" ? ", photos, FIR" : ""} <em> optional · PDF or photo</em></span>
        <label className="btn btn--ghost btn--sm"><Paperclip size={15}/>{uploading ? "Attaching…" : "Attach a file"}<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" hidden disabled={uploading || uploads.length >= 4} onChange={(event) => { void attach(event.target.files?.[0]); event.target.value = ""; }}/></label>
        {uploads.map((item) => <span key={item.id} className="ins-file"><FileText size={14}/>{item.name}<button type="button" onClick={() => setUploads(uploads.filter((upload) => upload.id !== item.id))} aria-label={`Remove ${item.name}`}><X size={13}/></button></span>)}
      </div> : <p className="field__hint"><Link href="/login" onClick={() => rememberReturn("/insurance")}>Sign in</Link> to attach your RC and old policy and track this request. Or just send the form: we’ll call you and collect them on WhatsApp.</p>}
    </fieldset>

    <p className="ins-note"><ShieldCheck size={16}/>{FACILITATOR_NOTE}</p>
    <label className="check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required/> <span>I understand NISE COMPORT arranges the policy and helps with claims; the insurer issues the policy and settles claims. You may call or WhatsApp me about this.</span></label>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    <button className="btn btn--primary btn--lg" disabled={busy || !consent}><Send size={18}/>{busy ? "Sending…" : purpose === "claim" ? "Get claim help" : "Get my quotes"}</button>
  </form>;
}
