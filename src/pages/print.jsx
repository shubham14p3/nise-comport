import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEO from "../components/seo";
import Header from "../layouts/header";
import Footer from "../layouts/footer";
import Layout from "../layouts";
import { authApi, printApi } from "../features/print/api";
import { parsePageSelection } from "../features/print/pageSelection";
import "../assets/css/print-service.css";
import "../assets/css/nise-platform.css";

const money = (paise = 0) => `₹${(Number(paise) / 100).toFixed(Number(paise) % 100 ? 2 : 0)}`;

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const PrintPage = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [config, setConfig] = useState(null);
  const [slots, setSlots] = useState([]);
  const [files, setFiles] = useState([]);
  const [fulfilment, setFulfilment] = useState("pickup");
  const [pickupSlotId, setPickupSlotId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState({ line1: "", line2: "", landmark: "", city: "Jamshedpur", state: "Jharkhand", postalCode: "" });
  const [couponCode, setCouponCode] = useState("");
  const [walletRupees, setWalletRupees] = useState(0);
  const [customerNote, setCustomerNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [quote, setQuote] = useState(null);
  const [state, setState] = useState({ loading: true, uploading: false, quoting: false, submitting: false, error: "", message: "" });

  useEffect(() => {
    (async () => {
      try {
        const [configData, slotsData] = await Promise.all([printApi.config(), printApi.pickupSlots()]);
        setConfig(configData);
        setSlots(slotsData.slots || []);
        setPickupSlotId(slotsData.slots?.[0]?.id || "");
        try { setMe(await authApi.me()); } catch {}
        setState((s) => ({ ...s, loading: false }));
      } catch (error) { setState((s) => ({ ...s, loading: false, error: error.message })); }
    })();
  }, []);

  const updateFile = (id, patch) => setFiles((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  const removeFile = (id) => setFiles((items) => items.filter((item) => item.id !== id));

  const addFiles = async (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selected.length) return;
    if (!me) return navigate("/login?returnTo=/print");
    setState((s) => ({ ...s, uploading: true, error: "", message: "" }));
    try {
      const uploaded = await printApi.upload(selected);
      const next = uploaded.files.map((file) => ({
        id: file.uploadToken.slice(-24),
        uploadToken: file.uploadToken,
        name: file.name,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        totalPages: file.totalPages,
        previewUrl: file.previewUrl,
        selection: file.totalPages > 1 ? `1-${file.totalPages}` : "1",
        colourSelection: "",
        copies: 1,
        sides: "single",
        paperSize: "A4",
        orientation: "portrait",
      }));
      setFiles((current) => [...current, ...next]);
      setState((s) => ({ ...s, uploading: false, message: `${next.length} file(s) uploaded securely.` }));
    } catch (error) {
      if (error.status === 401) return navigate("/login?returnTo=/print");
      setState((s) => ({ ...s, uploading: false, error: error.message }));
    }
  };

  const payloadFiles = useMemo(() => files.map(({ id, name, mimeType, sizeBytes, previewUrl, ...file }) => file), [files]);

  useEffect(() => {
    if (!me || !files.length) { setQuote(null); return; }
    const timer = setTimeout(async () => {
      setState((s) => ({ ...s, quoting: true }));
      try {
        const data = await printApi.quote({
          files: payloadFiles,
          fulfilment,
          couponCode: couponCode.trim() || undefined,
          walletRedeemPaise: Math.max(0, Math.round(Number(walletRupees || 0) * 100)),
        });
        setQuote(data.quote);
        setState((s) => ({ ...s, quoting: false, error: "" }));
      } catch (error) {
        setQuote(null);
        setState((s) => ({ ...s, quoting: false, error: error.message }));
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [me, payloadFiles, fulfilment, couponCode, walletRupees]);

  const localCounts = useMemo(() => files.reduce((acc, item) => {
    const selected = parsePageSelection(item.selection, Number(item.totalPages) || 1);
    const colour = new Set(item.colourSelection ? parsePageSelection(item.colourSelection, Number(item.totalPages) || 1) : []);
    const copies = Math.max(1, Number(item.copies) || 1);
    selected.forEach((page) => colour.has(page) ? acc.color += copies : acc.bw += copies);
    return acc;
  }, { bw: 0, color: 0 }), [files]);

  const startRazorpay = async (created) => {
    const payment = created.payment;
    if (!payment || payment.provider !== "razorpay") return false;
    const ready = await loadRazorpay();
    if (!ready) throw new Error("Could not load online payment checkout. Choose pay at shop instead.");
    return new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        key: payment.keyId,
        amount: payment.amountPaise,
        currency: payment.currency || "INR",
        name: "NISE COMPORT",
        description: `Print order ${created.order.order_number}`,
        order_id: payment.orderId,
        prefill: { name: me?.user?.name, email: me?.user?.email, contact: me?.user?.mobile },
        handler: async (result) => {
          try {
            await printApi.confirmPayment(created.order.order_number, {
              method: "razorpay",
              razorpayPaymentId: result.razorpay_payment_id,
              razorpaySignature: result.razorpay_signature,
            });
            resolve(true);
          } catch (error) { reject(error); }
        },
        modal: { ondismiss: () => resolve(false) },
        theme: { color: "#172033" },
      });
      checkout.open();
    });
  };

  const submit = async () => {
    if (!me) return navigate("/login?returnTo=/print");
    if (!files.length) return;
    if (fulfilment === "pickup" && !pickupSlotId) return setState((s) => ({ ...s, error: "Choose a pickup time." }));
    if (fulfilment === "delivery" && (!deliveryAddress.line1 || !deliveryAddress.postalCode)) return setState((s) => ({ ...s, error: "Enter your delivery address and postal code." }));

    setState((s) => ({ ...s, submitting: true, error: "" }));
    try {
      const created = await printApi.createOrder({
        files: payloadFiles,
        fulfilment,
        pickupSlotId: fulfilment === "pickup" ? pickupSlotId : undefined,
        deliveryAddress: fulfilment === "delivery" ? deliveryAddress : undefined,
        couponCode: couponCode.trim() || undefined,
        walletRedeemPaise: Math.max(0, Math.round(Number(walletRupees || 0) * 100)),
        customerNote,
        acquisitionSource: new URLSearchParams(window.location.search).get("src") || "direct",
        paymentMethod,
      });

      if (paymentMethod === "online" && created.payment?.provider === "razorpay") {
        const paid = await startRazorpay(created);
        if (!paid) {
          setState((s) => ({ ...s, submitting: false, message: "Order saved. Payment is still pending; you can finish it later." }));
          return navigate("/print/orders");
        }
      } else if (paymentMethod === "pay_at_shop" && created.order.payment_status !== "paid") {
        await printApi.confirmPayment(created.order.order_number, { method: "pay_at_shop" });
      }
      navigate("/print/orders");
    } catch (error) {
      setState((s) => ({ ...s, submitting: false, error: error.message }));
    }
  };

  return <Layout><SEO title="Online Printout in Telco, Jamshedpur | NISE COMPORT"/><div className="wrapper nise-print"><Header/><main>
    <section className="print-hero"><div className="container print-hero-grid">
      <div><span className="print-kicker">NISE Print Online · Telco, Jamshedpur</span><h1>Upload once. Choose exactly what to print. Collect when it is ready.</h1><p>PDF, Word and images. Mixed colour/B&W pages, copies, duplex, pickup slots, delivery, payment and NISE Credit in one order.</p><div className="print-trust"><span>Private files</span><span>Clear pricing</span><span>Skip the queue</span><span>Files auto-expire</span></div></div>
      <div className="print-price-card"><span>Black & white from</span><strong>₹2/page</strong><small>Pricing is calculated by the server from your actual selected pages.</small></div>
    </div></section>

    <section className="container print-builder">
      <div className="print-form-card">
        {!me && <div className="login-gate"><div><strong>Sign in before uploading</strong><p>You can view pricing without an account. Sign in only when you are ready to upload private documents.</p></div><Link to="/login?returnTo=/print">Sign in / create account</Link></div>}
        {state.error && <div className="form-error">{state.error}</div>}
        {state.message && <div className="success-note">{state.message}</div>}

        <div className="step-title"><span>1</span><div><h2>Add your files</h2><p>PDF, DOC, DOCX, JPG and PNG. Word documents are converted to a stable PDF before page selection.</p></div></div>
        <label className={"upload-zone" + (!me ? " disabled" : "")}>
          <input disabled={!me || state.uploading} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={addFiles}/>
          <strong>{state.uploading ? "Uploading & checking pages…" : "Choose files"}</strong><span>Maximum {config?.uploads?.maxFiles || 20} files · {config?.uploads?.maxFileSizeMb || 25} MB each</span>
        </label>

        {files.map((item, index) => <article className="print-file-card" key={item.id}>
          <div className="print-file-head"><div><span className="file-number">{index + 1}</span><strong>{item.name}</strong><small>{item.totalPages} page{item.totalPages === 1 ? "" : "s"} · {(item.sizeBytes/1024/1024).toFixed(2)} MB</small></div><div className="file-head-actions"><a href={item.previewUrl} target="_blank" rel="noreferrer">Preview</a><button type="button" onClick={()=>removeFile(item.id)}>Remove</button></div></div>
          <div className="file-config-grid">
            <label>Pages to print<input value={item.selection} placeholder="1-5,8,10-14" onChange={(e)=>updateFile(item.id,{selection:e.target.value})}/><small>Detected: {item.totalPages} pages</small></label>
            <label>Colour pages<input value={item.colourSelection} placeholder="e.g. 1,4-6" onChange={(e)=>updateFile(item.id,{colourSelection:e.target.value})}/><small>Leave blank for all B&W.</small></label>
            <label>Copies<input type="number" min="1" max="50" value={item.copies} onChange={(e)=>updateFile(item.id,{copies:e.target.value})}/></label>
            <label>Print sides<select value={item.sides} onChange={(e)=>updateFile(item.id,{sides:e.target.value})}><option value="single">Single sided</option><option value="double">Double sided</option></select></label>
            <label>Paper<select value={item.paperSize} onChange={(e)=>updateFile(item.id,{paperSize:e.target.value})}><option>A4</option><option>A3</option></select></label>
            <label>Orientation<select value={item.orientation} onChange={(e)=>updateFile(item.id,{orientation:e.target.value})}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label>
          </div>
        </article>)}

        <div className="step-title section-gap"><span>2</span><div><h2>How should we hand it over?</h2><p>Pickup capacity is limited by time slot so the counter does not get overloaded.</p></div></div>
        <div className="fulfilment-grid"><button type="button" className={fulfilment==="pickup"?"selected":""} onClick={()=>setFulfilment("pickup")}><strong>Shop pickup</strong><span>Choose an available time</span></button><button type="button" className={fulfilment==="delivery"?"selected":""} onClick={()=>setFulfilment("delivery")}><strong>Home delivery</strong><span>Local delivery charge shown before payment</span></button></div>

        {fulfilment === "pickup" ? <label className="pickup-slot">Pickup time<select value={pickupSlotId} onChange={(e)=>setPickupSlotId(e.target.value)}>{slots.map((slot)=><option value={slot.id} key={slot.id}>{new Date(slot.starts_at).toLocaleString([], {weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})} · {slot.capacity-slot.booked_count} left</option>)}</select></label> :
        <div className="delivery-form"><label>Address<input value={deliveryAddress.line1} onChange={(e)=>setDeliveryAddress({...deliveryAddress,line1:e.target.value})} placeholder="House / flat / street"/></label><label>Area / landmark<input value={deliveryAddress.landmark} onChange={(e)=>setDeliveryAddress({...deliveryAddress,landmark:e.target.value})} placeholder="Area or landmark"/></label><label>Postal code<input inputMode="numeric" value={deliveryAddress.postalCode} onChange={(e)=>setDeliveryAddress({...deliveryAddress,postalCode:e.target.value})} placeholder="PIN code"/></label></div>}

        <div className="step-title section-gap"><span>3</span><div><h2>Offers, credit & payment</h2><p>Coupon and wallet rules are verified again by the server before the order is accepted.</p></div></div>
        <div className="checkout-options"><label>Coupon<input value={couponCode} onChange={(e)=>setCouponCode(e.target.value.toUpperCase())} placeholder="Optional"/></label><label>Use NISE Credit (₹)<input type="number" min="0" step="1" value={walletRupees} onChange={(e)=>setWalletRupees(e.target.value)}/><small>Available: {money(quote?.walletBalancePaise || me?.walletBalancePaise || 0)}</small></label></div>
        <label className="customer-note">Anything we should know?<textarea value={customerNote} onChange={(e)=>setCustomerNote(e.target.value)} maxLength="1000" placeholder="Example: please staple each document separately."/></label>
        <div className="payment-choice"><button type="button" className={paymentMethod==="online"?"selected":""} onClick={()=>setPaymentMethod("online")}><strong>Pay online</strong><span>UPI/card through secure checkout when enabled</span></button><button type="button" className={paymentMethod==="pay_at_shop"?"selected":""} onClick={()=>setPaymentMethod("pay_at_shop")}><strong>Pay at shop</strong><span>Order now, settle at collection</span></button></div>
      </div>

      <aside className="order-summary">
        <span className="summary-label">Server estimate</span><h2>Your print order</h2>
        <div><span>B&W ({quote?.counts?.bw ?? localCounts.bw})</span><strong>{quote ? money((quote.counts.bw||0)*(quote.rates.bwRatePaise||0)) : "—"}</strong></div>
        <div><span>Colour ({quote?.counts?.color ?? localCounts.color})</span><strong>{quote ? money((quote.counts.color||0)*(quote.rates.colorRatePaise||0)) : "—"}</strong></div>
        {quote?.discountPaise > 0 && <div><span>Coupon</span><strong>−{money(quote.discountPaise)}</strong></div>}
        {quote?.deliveryFeePaise > 0 && <div><span>Delivery</span><strong>{money(quote.deliveryFeePaise)}</strong></div>}
        {quote?.walletAppliedPaise > 0 && <div><span>NISE Credit</span><strong>−{money(quote.walletAppliedPaise)}</strong></div>}
        <div className="summary-total"><span>Total</span><strong>{state.quoting ? "…" : quote ? money(quote.totalPaise) : "—"}</strong></div>
        <div className="wallet-preview"><span>After completion you earn</span><strong>{quote ? money(quote.cashbackPaise) : "—"} NISE Credit</strong><small>Cashback posts only after pickup/delivery is completed.</small></div>
        <button className="continue-print" disabled={!files.length || !quote || state.submitting || state.quoting} onClick={submit}>{state.submitting ? "Creating order…" : paymentMethod==="online" ? "Create order & pay" : "Place print order"}</button>
        <small className="summary-note">Documents are private and scheduled for automatic deletion after the configured retention period.</small>
      </aside>
    </section>
  </main><Footer/></div></Layout>;
};

export default PrintPage;
