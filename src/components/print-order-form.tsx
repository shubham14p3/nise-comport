"use client";
import SiteHeader from "@/components/site-header";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { newIdempotencyKey } from "@/lib/client-id";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock3, FileText, Info, MapPin, Minus, Plus, Printer, ShieldCheck, Upload, X } from "lucide-react";
import { blackWhiteCost, COLOR_PAGE_RATE, countSelectedPages } from "@/lib/print-pricing";
import { secureApi, secureFile, secureUpload } from "@/lib/secure-api-client";

type FileDetails = { id: string; name: string; pages: number; size: number; mimeType: string };
type DeliveryAddress = { id: string; label: string; line1: string; line2: string | null; city: string; postalCode: string; isDefault: boolean };
const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);

export default function PrintOrderForm() {
  const router = useRouter();
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
  const [scheduledAt, setScheduledAt] = useState("");
  const [colorPagesPerCopy, setColorPagesPerCopy] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponBase, setCouponBase] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // One key per form: a double-click or a retry after a network error can't create a second order.
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

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setError(""); setNotice(""); setFile(null); setBusy(true); idempotencyKey.current = null;
    try {
      const session = await secureApi<{ user: { role: string } | null }>("C4w7G2hN6kP9");
      if (!session.user) { router.push("/login"); return; }
      if (session.user.role === "demo") { setNotice("You’re signed in with the local demo account. Configure PostgreSQL and private file storage to test document uploads and print requests."); return; }
      const result = await secureUpload<{ file: { id: string; originalName: string; pageCount: number; sizeBytes: number; mimeType: string } }>("U7b3R8mQ4zL1", selected);
      setFile({ id: result.file.id, name: result.file.originalName, pages: result.file.pageCount, size: result.file.sizeBytes, mimeType: result.file.mimeType });
      const preview = await secureFile("E1n6V2kP9cF5", { id: result.file.id });
      setPreviewUrl(URL.createObjectURL(preview.blob));
      setPageText(""); setColorPagesPerCopy(0); setNotice("Document checked and ready. Select pages and print options below.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not prepare this document."); }
    finally { setBusy(false); event.target.value = ""; }
  }

  async function applyCoupon() {
    setError(""); setNotice("");
    try {
      const result = await secureApi<{ discount: number; code: string }>("K2p9D5xN1hW7", { code: coupon, amount: subtotal });
      setDiscount(result.discount); setCouponBase(subtotal); setNotice(`Coupon ${result.code} applied.`);
    } catch (reason) { setDiscount(0); setCouponBase(null); setError(reason instanceof Error ? reason.message : "Could not validate the coupon."); }
  }

  async function chooseFulfillment(next: "pickup" | "delivery") {
    setFulfillment(next); setError("");
    if (next !== "delivery" || addresses.length) return;
    try {
      const result = await secureApi<{ addresses: DeliveryAddress[] }>("P3v8F1qL6sM4");
      setAddresses(result.addresses);
      setAddressId(result.addresses.find((address: DeliveryAddress) => address.isDefault)?.id ?? result.addresses[0]?.id ?? "");
    } catch { setAddresses([]); }
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    if (!file) { setError("Upload a document to continue."); return; }
    if (!selectedPerCopy) { setError(`Check the page selection. Use numbers and ranges such as 1-3, 5 (up to ${file.pages}).`); return; }
    if (colorPagesPerCopy > selectedPerCopy) { setError("Colour pages can’t exceed your selected pages per copy."); return; }
    if (fulfillment === "delivery" && !addressId) { setError("Choose a saved delivery address."); return; }
    setBusy(true);
    idempotencyKey.current ??= newIdempotencyKey();
    try {
      await secureApi("A4x8L1rN5vK3", {
        fileId: file.id, fileName: file.name, pageSelection: pageText.trim() || "all", copies, colorPagesPerCopy,
        sides, paperSize, orientation, fulfillment, addressId: fulfillment === "delivery" ? addressId : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null, coupon: couponBase === subtotal ? coupon : null, idempotencyKey: idempotencyKey.current,
      });
      router.push("/profile"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not submit your print request."); }
    finally { setBusy(false); }
  }

  return <main className="print-page"><SiteHeader/><div className="container print-container">
    <Link href="/" className="print-back"><ArrowLeft size={15}/> Back to home</Link>
    <div className="print-page-heading"><div><span className="eyebrow eyebrow-muted">PRINT &amp; SCAN · SIMPLE, YOUR WAY</span><h1>Make it <em>print-ready.</em></h1><p>Choose exactly what you need. Send a request for an estimate; our team confirms the final quote before printing.</p></div><div className="secure-files"><ShieldCheck size={17}/><span>Private file handling<small>Files are removed after the retention period.</small></span></div></div>
    <form className="print-order-layout" onSubmit={submitOrder}>
      <div className="print-form-column">
        <section className="print-step-card"><div className="print-step-title"><span>01</span><div><h2>Add your document</h2><p>PDF, Word, JPG, PNG or WEBP · Up to 20 MB</p></div></div>
          {file ? <div className="uploaded-file"><span className="upload-file-icon"><FileText size={19}/></span><div><b>{file.name}</b><small>{file.pages} {file.pages === 1 ? "page" : "pages"} · {(file.size / 1024 / 1024).toFixed(1)} MB</small></div><button type="button" aria-label="Remove file" onClick={() => { setFile(null); setPreviewUrl(""); setPageText(""); setNotice(""); }}><X size={16}/></button></div> : <label className="upload-zone"><input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf" onChange={onFileChange} disabled={busy}/><span className="upload-icon"><Upload size={19}/></span><b>{busy ? "Checking and preparing your file…" : "Tap to upload a file"}</b><small>Sign in is required. Word files are converted to PDF for preview and printing.</small></label>}
          {file && <><div className="preview-tip"><Info size={14}/> Preview the file before sending a request.</div><div className="document-preview"><iframe src={previewUrl || "about:blank"} title="Private document preview"/></div></>}
        </section>
        <section className="print-step-card"><div className="print-step-title"><span>02</span><div><h2>Choose your pages &amp; finish</h2><p>Select a range, copies and paper options.</p></div></div>
          <label className="form-label">Pages to print <span>Leave blank for all {file?.pages ?? "pages"}</span><input disabled={!file} value={pageText} onChange={event => { const selection = event.target.value; setPageText(selection); setCouponBase(null); try { setColorPagesPerCopy(Math.min(colorPagesPerCopy, countSelectedPages(selection, file?.pages ?? 0))); } catch { setColorPagesPerCopy(0); } }} placeholder="e.g. 1-3, 5"/></label>
          <div className="print-option-grid"><label className="form-label">Copies<div className="stepper"><button type="button" aria-label="Remove a copy" onClick={() => { setCopies(Math.max(1, copies - 1)); setCouponBase(null); }}><Minus size={14}/></button><b>{copies}</b><button type="button" aria-label="Add a copy" onClick={() => { setCopies(Math.min(50, copies + 1)); setCouponBase(null); }}><Plus size={14}/></button></div></label>
            <label className="form-label">Sides<select value={sides} onChange={event => setSides(event.target.value as "single" | "double")}><option value="single">Single-sided</option><option value="double">Double-sided</option></select></label>
            <label className="form-label">Paper size<select value={paperSize} onChange={event => setPaperSize(event.target.value)}><option>A4</option><option>A3</option><option>Letter</option></select></label>
            <label className="form-label">Orientation<select value={orientation} onChange={event => setOrientation(event.target.value as "portrait" | "landscape")}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label></div>
          <label className="form-label color-pages-label">Colour pages per copy <span>Selected pages per copy: {selectedPerCopy}</span><input type="number" min={0} max={selectedPerCopy} value={colorPagesPerCopy} onChange={event => { setColorPagesPerCopy(Math.max(0, Math.min(selectedPerCopy, Number(event.target.value) || 0))); setCouponBase(null); }}/></label>
          <div className="mix-note"><span><i className="swatch swatch-bw"/> {bwCount} B&amp;W · {money(blackWhiteCost(bwCount))}</span><span><i className="swatch swatch-color"/> {colorCount} colour · {money(colorCount * COLOR_PAGE_RATE)}</span><small>Progressive B&amp;W rates: first 10 pages ₹5, pages 11–50 ₹3, then ₹2. Colour ₹10 per page.</small></div>
        </section>
        <section className="print-step-card"><div className="print-step-title"><span>03</span><div><h2>Pickup or delivery?</h2><p>Pick a convenient option and preferred time.</p></div></div>
          <div className="fulfillment-options"><button type="button" className={fulfillment === "pickup" ? "fulfillment-card active" : "fulfillment-card"} onClick={() => void chooseFulfillment("pickup")}><Printer size={18}/><b>Pick up</b><small>Collect from our Kharangajhar centre</small></button><button type="button" className={fulfillment === "delivery" ? "fulfillment-card active" : "fulfillment-card"} onClick={() => void chooseFulfillment("delivery")}><MapPin size={18}/><b>Deliver</b><small>Delivery charge confirmed by our team</small></button></div>
          {fulfillment === "delivery" && <>{addresses.length ? <label className="form-label delivery-address-label">Delivery address<select value={addressId} onChange={event => setAddressId(event.target.value)}>{addresses.map(address => <option key={address.id} value={address.id}>{address.label} · {address.line1}, {address.city} {address.postalCode}</option>)}</select></label> : <div className="address-required">Save a delivery address in <Link href="/profile">your profile</Link> first.</div>}</>}
          <label className="form-label schedule-label">Preferred pickup or delivery time <span>We’ll confirm availability</span><div className="date-input"><Clock3 size={15}/><input type="datetime-local" value={scheduledAt} onChange={event => setScheduledAt(event.target.value)}/></div></label>
        </section>
      </div>
      <aside className="print-summary"><div className="summary-head"><span>ESTIMATE PREVIEW</span><Printer size={19}/></div><h2>Your estimate.</h2><p>This is an estimate only. Our team checks the file and confirms the final quote before printing.</p><div className="summary-file"><FileText size={16}/><span>{file?.name ?? "Your document"}<small>{selectedPerCopy} selected × {copies} {copies === 1 ? "copy" : "copies"} = {printedCount} printed pages</small></span></div>
        <div className="summary-line"><span>Black &amp; white ({bwCount})</span><b>{money(blackWhiteCost(bwCount))}</b></div><div className="summary-line"><span>Colour ({colorCount})</span><b>{money(colorCount * COLOR_PAGE_RATE)}</b></div><div className="summary-line"><span>{sides === "double" ? "Double-sided" : "Single-sided"} · {paperSize} · {orientation}</span><b>Selected</b></div>
        <label className="coupon-label">Coupon code<div><input value={coupon} onChange={event => { setCoupon(event.target.value.toUpperCase()); setCouponBase(null); }} placeholder="Enter code"/><button type="button" onClick={() => void applyCoupon()} disabled={!coupon.trim() || !subtotal}>Apply</button></div></label>{couponBase === subtotal && discount > 0 && <div className="coupon-success"><Check size={12}/> Discount {money(discount)} applied</div>}
        <div className="summary-total"><span>Estimated service cost</span><b>{money(total)}</b></div><small className="summary-disclaimer">No online payment is taken. Service fees are separate from government or third-party charges.</small>
        {error && <div className="form-alert error-alert" role="alert">{error}</div>}{notice && <div className="form-alert success-alert" role="status">{notice}</div>}
        <button className="button button-green submit-print" disabled={busy || !file}>{busy ? "Submitting…" : "Send print request"}<ArrowRight size={16}/></button><div className="summary-reassurance"><ShieldCheck size={14}/> Your document stays private.</div>
      </aside>
    </form><div className="print-disclaimer"><Info size={14}/><p>Submitting sends a request to our service desk. This is not checkout and no online payment is taken. We will confirm availability, the final quote and any delivery charge before printing.</p></div>
  </div></main>;
}
