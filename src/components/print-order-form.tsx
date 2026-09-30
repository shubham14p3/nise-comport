"use client";

import SiteHeader from "@/components/site-header";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock3, FileText, Info, LockKeyhole, MapPin, Minus, Plus, Printer, ShieldCheck, Store, TicketPercent, Upload, X } from "lucide-react";
import AddressPicker, { addressProblem, EMPTY_ADDRESS, type AddressValue } from "@/components/address-picker";
import { useLiveCodes } from "@/components/offers-provider";
import { OfferRail, OfferStrip, WizardActions, WizardFrame } from "@/components/wizard";
import { promoDict } from "@/lib/promo-i18n";
import { newIdempotencyKey } from "@/lib/client-id";
import { blackWhiteCost, COLOR_PAGE_RATE, countSelectedPages } from "@/lib/print-pricing";
import { secureApi, secureFile, secureUpload } from "@/lib/secure-api-client";
import { useLocale } from "@/lib/use-locale";
import { rememberReturn } from "@/lib/after-login";

type FileDetails = { id: string; name: string; pages: number; size: number; mimeType: string };
type Voucher = { code: string; emoji: string; used: boolean; live: boolean; personal: boolean };
type DeliveryAddress = { id: string; label: string; line1: string; line2: string | null; city: string; postalCode: string; isDefault: boolean };
const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
const STEPS = ["Upload", "Pages & finish", "Pickup or delivery", "Review & send"];

/** Four-step print request: upload → pages & finish → pickup/delivery → review. */
export default function PrintOrderForm() {
  const router = useRouter();
  const locale = useLocale();
  const p = promoDict(locale);
  const liveCodes = useLiveCodes();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [step, setStep] = useState(0);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [file, setFile] = useState<FileDetails | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [pageText, setPageText] = useState("");
  const [copies, setCopies] = useState(1);
  const [sides, setSides] = useState<"single" | "double">("single");
  const [paperSize, setPaperSize] = useState("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [addressId, setAddressId] = useState("");
  const [newAddress, setNewAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [scheduledAt, setScheduledAt] = useState("");
  const [colorPagesPerCopy, setColorPagesPerCopy] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponBase, setCouponBase] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // One key per order: a double-click or a retry after a network error can't create a second order.
  const idempotencyKey = useRef<string | null>(null);

  const selectedPerCopy = useMemo(() => {
    if (!file) return 0;
    try { return countSelectedPages(pageText, file.pages); } catch { return 0; }
  }, [pageText, file]);
  const safeColorPages = Math.min(colorPagesPerCopy, selectedPerCopy);
  const colorCount = safeColorPages * copies;
  const bwCount = Math.max(0, selectedPerCopy - safeColorPages) * copies;
  const printedCount = selectedPerCopy * copies;
  const subtotal = blackWhiteCost(bwCount) + colorCount * COLOR_PAGE_RATE;
  const activeDiscount = couponBase === subtotal ? discount : 0;
  const total = subtotal - activeDiscount;
  const suggestions = [
    ...vouchers.filter((item) => item.personal && item.live && !item.used).map((item) => ({ code: item.code, emoji: item.emoji, personal: true })),
    ...liveCodes.filter((item) => item.code && !vouchers.some((voucher) => voucher.code === item.code && voucher.used)).map((item) => ({ code: item.code!, emoji: item.emoji, personal: false })),
  ].slice(0, 5);

  useEffect(() => {
    let active = true;
    secureApi<{ user: { role: string } | null }>("C4w7G2hN6kP9").then(async (session) => {
      if (!active) return;
      setSignedIn(Boolean(session.user));
      if (!session.user || session.user.role === "demo") return;
      // Personal coupons (the ₹50 welcome coupon) for the code suggestions.
      const snapshot = await secureApi<{ coupons?: Voucher[] }>("P8a2N5dK1vR7").catch(() => null);
      if (active && snapshot?.coupons) setVouchers(snapshot.coupons);
    }).catch(() => { if (active) setSignedIn(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function go(next: number) { setError(""); setNotice(""); setStep(next); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setError(""); setNotice(""); setFile(null); setBusy(true); idempotencyKey.current = null;
    try {
      const session = await secureApi<{ user: { role: string } | null }>("C4w7G2hN6kP9");
      if (!session.user) { rememberReturn("/print"); router.push("/login"); return; }
      if (session.user.role === "demo") { setNotice("You’re signed in with the local demo account. Configure PostgreSQL and private file storage to test document uploads and print requests."); return; }
      const result = await secureUpload<{ file: { id: string; originalName: string; pageCount: number; sizeBytes: number; mimeType: string } }>("U7b3R8mQ4zL1", selected);
      setFile({ id: result.file.id, name: result.file.originalName, pages: result.file.pageCount, size: result.file.sizeBytes, mimeType: result.file.mimeType });
      const preview = await secureFile("E1n6V2kP9cF5", { id: result.file.id });
      setPreviewUrl(URL.createObjectURL(preview.blob));
      setPageText(""); setColorPagesPerCopy(0); setNotice("Document checked and ready. Preview it, then continue.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not prepare this document."); }
    finally { setBusy(false); event.target.value = ""; }
  }

  async function applyCoupon(code = coupon) {
    setError(""); setNotice(""); setCoupon(code);
    try {
      const result = await secureApi<{ discount: number; code: string }>("K2p9D5xN1hW7", { code, amount: subtotal });
      setDiscount(result.discount); setCouponBase(subtotal); setNotice(`Coupon ${result.code} applied.`);
    } catch (reason) { setDiscount(0); setCouponBase(null); setError(reason instanceof Error ? reason.message : "Could not validate the coupon."); }
  }

  async function loadAddresses() {
    try {
      const result = await secureApi<{ addresses: DeliveryAddress[] }>("P3v8F1qL6sM4");
      setAddresses(result.addresses);
      setAddressId((current) => current || (result.addresses.find((address) => address.isDefault)?.id ?? result.addresses[0]?.id ?? ""));
    } catch { setAddresses([]); }
  }

  function chooseFulfillment(next: "pickup" | "delivery") {
    setFulfillment(next); setError("");
    if (next === "delivery" && !addresses.length) void loadAddresses();
  }

  async function saveNewAddress() {
    const problem = addressProblem(newAddress);
    if (problem) { setError(problem); return; }
    setBusy(true); setError("");
    try {
      const result = await secureApi<{ address: DeliveryAddress }>("D6k0N9yR2tH5", { label: "Delivery", line1: newAddress.line1, line2: [newAddress.line2, newAddress.landmark ? `Near ${newAddress.landmark}` : ""].filter(Boolean).join(", "), city: newAddress.city, state: newAddress.state, postalCode: newAddress.postalCode, landmark: newAddress.landmark || undefined, latitude: newAddress.latitude ?? undefined, longitude: newAddress.longitude ?? undefined, placeId: newAddress.placeId ?? undefined });
      await loadAddresses();
      setAddressId(result.address.id); setNewAddress(EMPTY_ADDRESS); setNotice("Address saved.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save the address."); }
    finally { setBusy(false); }
  }

  function validate(target: number) {
    if (target >= 1 && !file) return "Upload a document to continue.";
    if (target >= 2) {
      if (!selectedPerCopy && file) return `Check the page selection. Use numbers and ranges such as 1-3, 5 (up to ${file.pages}).`;
      if (colorPagesPerCopy > selectedPerCopy) return "Colour pages can’t exceed your selected pages per copy.";
    }
    if (target >= 3 && fulfillment === "delivery" && !addressId) return "Choose or save a delivery address.";
    return "";
  }

  function next() {
    const problem = validate(step + 1);
    if (problem) { setError(problem); return; }
    go(step + 1);
  }

  async function submitOrder() {
    const problem = validate(3);
    if (problem || !file) { setError(problem || "Upload a document to continue."); return; }
    setBusy(true); setError(""); setNotice("");
    idempotencyKey.current ??= newIdempotencyKey();
    try {
      await secureApi("A4x8L1rN5vK3", {
        fileId: file.id, fileName: file.name, pageSelection: pageText.trim() || "all", copies, colorPagesPerCopy,
        sides, paperSize, orientation, fulfillment, addressId: fulfillment === "delivery" ? addressId : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null, coupon: couponBase === subtotal ? coupon : null, idempotencyKey: idempotencyKey.current,
      });
      router.push("/profile#prints"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not submit your print request."); }
    finally { setBusy(false); }
  }

  const estimate = <div className="estimate-card">
    <div className="estimate-card__head"><span>Estimate</span><Printer size={18}/></div>
    <strong>{money(total)}</strong>
    <small>{selectedPerCopy} pages × {copies} {copies === 1 ? "copy" : "copies"} = {printedCount} printed</small>
    <div className="estimate-card__rows"><span>B&amp;W ({bwCount})<b>{money(blackWhiteCost(bwCount))}</b></span><span>Colour ({colorCount})<b>{money(colorCount * COLOR_PAGE_RATE)}</b></span>{activeDiscount > 0 && <span>Coupon<b>−{money(activeDiscount)}</b></span>}</div>
    <p>Final quote confirmed by our team. No online payment.</p>
  </div>;

  return <main className="page page--app"><SiteHeader/>
    <WizardFrame
      kicker="Print from your phone · 4 steps"
      title={<>Make it <span className="grad-text">print-ready.</span></>}
      lead="Upload, pick pages and finish, choose pickup or delivery. We confirm the final quote before printing."
      steps={STEPS} current={step} onJump={go} locale={locale}
      strip={<OfferStrip category="it-services" locale={locale}/>}
      rail={<OfferRail category="it-services" locale={locale} whatsappText="Hi NISE COMPORT, I have a question about printing." before={file ? estimate : undefined}/>}
    >
      <form className="wizard-form" noValidate onSubmit={(event) => { event.preventDefault(); if (step === 3) void submitOrder(); else next(); }}>
        {step === 0 && <section>
          <h2>Add your document</h2><p className="wizard-form__sub">PDF, Word, JPG, PNG or WEBP · up to 20 MB. Word files are converted to PDF for preview.</p>
          {signedIn === false && <div className="callout"><LockKeyhole size={20}/><b>Sign in to upload privately.</b><span>Your files are stored privately and removed after the retention period.</span><Link className="btn btn--primary btn--sm" href="/login" onClick={() => rememberReturn("/print")}>Sign in</Link><Link className="btn btn--ghost btn--sm" href="/signup" onClick={() => rememberReturn("/print")}>Create account</Link></div>}
          {file ? <div className="file-pill file-pill--lg"><FileText size={22}/><span>{file.name}<small>{file.pages} {file.pages === 1 ? "page" : "pages"} · {(file.size / 1024 / 1024).toFixed(1)} MB</small></span><button type="button" className="icon-btn" aria-label="Remove file" onClick={() => { setFile(null); setPreviewUrl(""); setPageText(""); setNotice(""); }}><X size={18}/></button></div>
            : <label className={busy ? "dropzone dropzone--lg is-busy" : "dropzone dropzone--lg"}><input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf" onChange={onFileChange} disabled={busy || signedIn === false}/><span className="dropzone__icon"><Upload size={26}/></span><b>{busy ? "Checking and preparing your file…" : "Tap to choose a file"}</b><small>or drag it here</small></label>}
          {file && <div className="doc-preview"><div className="doc-preview__tip"><Info size={15}/> Preview the file before continuing.</div><iframe src={previewUrl || "about:blank"} title="Private document preview"/></div>}
        </section>}

        {step === 1 && <section>
          <h2>Pages &amp; finish</h2><p className="wizard-form__sub">Choose exactly what to print. The estimate updates as you go.</p>
          <label className="field"><span className="field__label">Pages to print <em>leave blank for all {file?.pages ?? ""}</em></span><input value={pageText} onChange={(event) => { const selection = event.target.value; setPageText(selection); setCouponBase(null); try { setColorPagesPerCopy(Math.min(colorPagesPerCopy, countSelectedPages(selection, file?.pages ?? 0))); } catch { setColorPagesPerCopy(0); } }} placeholder="e.g. 1-3, 5"/></label>
          <div className="form-grid">
            <div className="field"><span className="field__label">Copies</span><div className="stepper"><button type="button" aria-label="Remove a copy" onClick={() => { setCopies(Math.max(1, copies - 1)); setCouponBase(null); }}><Minus size={18}/></button><b aria-live="polite">{copies}</b><button type="button" aria-label="Add a copy" onClick={() => { setCopies(Math.min(50, copies + 1)); setCouponBase(null); }}><Plus size={18}/></button></div></div>
            <label className="field"><span className="field__label">Colour pages per copy <em>of {selectedPerCopy}</em></span><input type="number" min={0} max={selectedPerCopy} value={colorPagesPerCopy} onChange={(event) => { setColorPagesPerCopy(Math.max(0, Math.min(selectedPerCopy, Number(event.target.value) || 0))); setCouponBase(null); }}/></label>
          </div>
          <fieldset className="field"><legend className="field__label">Sides</legend><div className="seg">{(["single", "double"] as const).map((value) => <button key={value} type="button" className={sides === value ? "is-active" : undefined} aria-pressed={sides === value} onClick={() => setSides(value)}>{value === "single" ? "Single-sided" : "Double-sided"}</button>)}</div></fieldset>
          <div className="form-grid">
            <fieldset className="field"><legend className="field__label">Paper size</legend><div className="seg">{["A4", "A3", "Letter"].map((value) => <button key={value} type="button" className={paperSize === value ? "is-active" : undefined} aria-pressed={paperSize === value} onClick={() => setPaperSize(value)}>{value}</button>)}</div></fieldset>
            <fieldset className="field"><legend className="field__label">Orientation</legend><div className="seg">{(["portrait", "landscape"] as const).map((value) => <button key={value} type="button" className={orientation === value ? "is-active" : undefined} aria-pressed={orientation === value} onClick={() => setOrientation(value)}>{value === "portrait" ? "Portrait" : "Landscape"}</button>)}</div></fieldset>
          </div>
          <div className="rate-note"><span><i className="swatch swatch--bw"/>{bwCount} B&amp;W · {money(blackWhiteCost(bwCount))}</span><span><i className="swatch swatch--color"/>{colorCount} colour · {money(colorCount * COLOR_PAGE_RATE)}</span><small>B&amp;W: first 10 pages ₹5, pages 11–50 ₹3, then ₹2. Colour ₹10 per page.</small></div>
        </section>}

        {step === 2 && <section>
          <h2>Pickup or delivery?</h2><p className="wizard-form__sub">Pick what suits you and a preferred time. We confirm availability.</p>
          <div className="mode-grid mode-grid--2">
            <button type="button" className={fulfillment === "pickup" ? "mode is-selected" : "mode"} onClick={() => chooseFulfillment("pickup")}><span className="mode__icon"><Store size={22}/></span><b>Pick up</b><small>Collect from our Kharangajhar counter</small></button>
            <button type="button" className={fulfillment === "delivery" ? "mode is-selected" : "mode"} onClick={() => chooseFulfillment("delivery")}><span className="mode__icon"><MapPin size={22}/></span><b>Deliver</b><small>Delivery charge confirmed by our team</small></button>
          </div>
          {fulfillment === "delivery" && <div className="field">
            <span className="field__label">Delivery address</span>
            {addresses.length > 0 && <div className="saved-addresses">{addresses.map((address) => <button key={address.id} type="button" className={addressId === address.id ? "saved-address is-selected" : "saved-address"} onClick={() => setAddressId(address.id)}><MapPin size={18}/><span><b>{address.label}</b><small>{address.line1}, {address.city} {address.postalCode}</small></span></button>)}<button type="button" className={!addressId ? "saved-address is-selected" : "saved-address"} onClick={() => setAddressId("")}><Plus size={18}/><span><b>New address</b><small>Search or use your location</small></span></button></div>}
            {!addressId && <div className="inline-panel"><AddressPicker value={newAddress} onChange={setNewAddress}/><button type="button" className="btn btn--primary btn--sm" onClick={() => void saveNewAddress()} disabled={busy}>Save this address</button></div>}
          </div>}
          <label className="field"><span className="field__label">Preferred pickup or delivery time <em>optional</em></span><span className="input-wrap"><Clock3 size={18}/><input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)}/></span></label>
        </section>}

        {step === 3 && file && <section>
          <h2>Review &amp; send</h2><p className="wizard-form__sub">This sends a request for a quote. No online payment is taken.</p>
          <dl className="summary">
            <div><dt>Document</dt><dd>{file.name} · {file.pages} pages</dd><button type="button" onClick={() => go(0)}>Edit</button></div>
            <div><dt>Pages</dt><dd>{pageText.trim() || "All"} · {copies} {copies === 1 ? "copy" : "copies"} · {colorPagesPerCopy} colour/copy</dd><button type="button" onClick={() => go(1)}>Edit</button></div>
            <div><dt>Finish</dt><dd>{sides === "double" ? "Double-sided" : "Single-sided"} · {paperSize} · {orientation}</dd><button type="button" onClick={() => go(1)}>Edit</button></div>
            <div><dt>Collection</dt><dd>{fulfillment === "pickup" ? "Pick up at the counter" : `Delivery · ${addresses.find((address) => address.id === addressId)?.line1 ?? ""}`}{scheduledAt ? ` · ${new Date(scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}` : ""}</dd><button type="button" onClick={() => go(2)}>Edit</button></div>
          </dl>
          <div className="coupon"><TicketPercent size={20}/><input value={coupon} onChange={(event) => { setCoupon(event.target.value.toUpperCase()); setCouponBase(null); }} placeholder="Coupon code" aria-label="Coupon code"/><button type="button" className="btn btn--ghost btn--sm" onClick={() => void applyCoupon()} disabled={!coupon.trim() || !subtotal}>Apply</button></div>
          {couponBase === subtotal && discount > 0 && <p className="alert alert--success"><Check size={16}/> Discount {money(discount)} applied</p>}
          {couponBase !== subtotal && suggestions.length > 0 && <div className="promo-field__chips"><span>{p.promoSuggest}</span>{suggestions.map((item) => <button key={item.code} type="button" className={`code-chip${item.personal ? " code-chip--personal" : ""}`} onClick={() => void applyCoupon(item.code)} disabled={!subtotal}>
            {item.emoji && <span aria-hidden="true">{item.emoji}</span>}<b>{item.code}</b>{item.personal && <small>{p.yourCoupon}</small>}
          </button>)}</div>}
          <div className="total-row"><span>Estimated service cost</span><strong>{money(total)}</strong></div>
          <p className="fine"><ShieldCheck size={15}/> Your document stays private. Service fees are separate from government or third-party charges.</p>
        </section>}

        {error && <div className="alert alert--error" role="alert">{error}</div>}
        {notice && <div className="alert alert--success" role="status">{notice}</div>}
        <WizardActions locale={locale} onBack={step > 0 ? () => go(step - 1) : undefined} nextLabel={step === 3 ? "Send print request" : undefined} busy={busy} nextDisabled={step === 0 && !file}/>
      </form>
    </WizardFrame>
  </main>;
}
