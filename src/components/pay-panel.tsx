"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";
import { rupees } from "@/lib/payments-core";
import Link from "next/link";

type Props = {
  reference: string; status: string; amountPaise: number; feePaise: number; note: string | null; paidVia: string | null;
  serviceFeePaise: number; externalFeePaise: number; couponCode: string | null; discountPaise: number;
  upiSlots: { slot: number; label: string }[]; qrSeconds: number; razorpay: boolean; cashfree: boolean; feePercent: number;
  helpHref: string; failureReason: string | null; ticketRaised: boolean; ticketOpen: boolean; refundStatus: string | null; refundChoice: string | null; refundPaise: number | null;
  estimates: { choice: "wallet" | "original" | "cash"; net: number }[];
};
type Order =
  | { provider: "razorpay"; keyId: string; orderId: string; amount: number; name: string; reference: string }
  | { provider: "cashfree"; sessionId: string; mode: "sandbox" | "production"; reference: string };
declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void }; Cashfree?: (options: { mode: string }) => { checkout: (options: Record<string, unknown>) => void } } }

const PAY = "Y3d7N5qV1mP8";
type Reveal = { svg: string; link: string; vpa: string; label: string; expiresAt: number };
// Request-time UPI expiry, created only in an async user action.
function expiryFromSeconds(seconds: number) { return Date.now() + seconds * 1000; }
const clock = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

export default function PayPanel(p: Props) {
  const router = useRouter();
  const [utr, setUtr] = useState("");
  const [coupon, setCoupon] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [choice, setChoice] = useState<"wallet" | "original" | "cash">("wallet");
  const [details, setDetails] = useState("");
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [left, setLeft] = useState(0);
  const [slot, setSlot] = useState(p.upiSlots[0]?.slot ?? 0);
  const online = p.razorpay || p.cashfree;

  // The QR and UPI ID disappear from the screen when the time is up (counted from the clock, so it also runs while the UPI app is open).
  useEffect(() => {
    if (!reveal) return;
    const tick = () => { const remaining = reveal.expiresAt - Date.now(); if (remaining <= 0) { setReveal(null); setLeft(0); } else setLeft(remaining); };
    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [reveal]);

  async function showQr(chosen: number) {
    setSlot(chosen);
    const result = await run("qr", () => secureApi<Reveal & { seconds: number }>(PAY, { action: "qr", reference: p.reference, slot: chosen }));
    if (result) setReveal({ svg: result.svg, link: result.link, vpa: result.vpa, label: result.label, expiresAt: expiryFromSeconds(result.seconds) });
  }
  const total = p.amountPaise + p.feePaise;

  async function run<T>(label: string, work: () => Promise<T>) {
    setBusy(label); setError("");
    try { return await work(); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); return null; } finally { setBusy(""); }
  }

  async function applyCoupon() {
    if(!coupon.trim())return;
    const result=await run("coupon",()=>secureApi("R6p2C9wT4kH1",{reference:p.reference,code:coupon.trim().toUpperCase()}));
    if(result){setReveal(null);setCoupon("");router.refresh();}
  }

  async function submitUtr() {
    const done = await run("utr", () => secureApi(PAY, { action: "utr", reference: p.reference, utr }));
    if (done) router.refresh();
  }

  async function raiseTicket() {
    if (await run("ticket", () => secureApi(PAY, { action: "ticket", reference: p.reference, note }))) router.refresh();
  }
  async function askRefund() {
    if (await run("refund", () => secureApi(PAY, { action: "refund", reference: p.reference, choice, details }))) router.refresh();
  }

  async function payOnline(provider: "razorpay" | "cashfree") {
    const order = await run(provider, () => secureApi<Order>(PAY, { action: "order", reference: p.reference, provider }));
    if (!order) return;
    if (order.provider === "razorpay") {
      if (!window.Razorpay) { setError("Online payment is still loading. Please try again."); return; }
      new window.Razorpay({
        key: order.keyId, order_id: order.orderId, amount: order.amount, currency: "INR", name: order.name, description: order.reference,
        theme: { color: "#6d3df5" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const done = await run("verify", () => secureApi(PAY, { action: "razorpayDone", orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature }));
          if (done) router.refresh();
        },
      }).open();
    } else {
      if (!window.Cashfree) { setError("Online payment is still loading. Please try again."); return; }
      window.Cashfree({ mode: order.mode }).checkout({ paymentSessionId: order.sessionId, redirectTarget: "_self" });
    }
  }


  const labels = { wallet: "Add to my profile wallet (+5% bonus)", original: "Send back to my bank / UPI", cash: "I will collect cash at the office" } as const;
  const refundBox = p.refundStatus === "done"
    ? <p className="pay-notice">Refund of {rupees(p.refundPaise ?? 0)} done ({p.refundChoice === "wallet" ? "added to your profile wallet" : p.refundChoice === "cash" ? "cash" : "sent to your account"}).</p>
    : p.refundStatus === "requested"
      ? <p className="pay-notice">Your refund request is with our team. We will update this page and email you.</p>
      : <section>
        <h2>Need your money back?</h2>
        <p>Pick how you want it:</p>
        {p.estimates.map((e) => <label key={e.choice} className="pay-choice"><input type="radio" name="refund" checked={choice === e.choice} onChange={() => setChoice(e.choice)}/> {labels[e.choice]}: <b>{rupees(e.net)}</b></label>)}
        <small>Wallet credit gets a 5% bonus with nothing deducted. Money back to your bank or cash is reduced by the payment gateway commission, 18% GST on it, and any service charge for work already done (shown above for online payments; the final amount is confirmed by our team).</small>
        {choice === "original" && <input value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Bank account + IFSC, or UPI ID" maxLength={300}/>}
        <button className="btn btn--ghost btn--block" type="button" disabled={busy === "refund"} onClick={() => void askRefund()}>{busy === "refund" ? "Sending…" : "Request refund"}</button>
      </section>;
  if (p.status === "paid") return <div className="pay-card pay-card--done"><h2>Payment received ✓</h2><p>Thank you. We have recorded {rupees(p.amountPaise + (p.paidVia === "razorpay" || p.paidVia === "cashfree" ? p.feePaise : 0))} against {p.reference}. A receipt was emailed to you.</p><p className="pay-notice">We will now process your application. We normally aim to share the first official application reference within 1–2 working days, subject to the government portal or provider. We will add the reference to your account once available. <Link href="/profile#profile">Verify your email and WhatsApp contact details</Link> to receive updates.</p>{refundBox}{error && <p role="alert" className="form-error">{error}</p>}</div>;
  if (p.status === "cancelled") return <div className="pay-card"><h2>This payment request was cancelled</h2><p>Please contact us if you think this is a mistake.</p></div>;

  return <div className="pay-card">
    {p.razorpay && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload"/>}
    {p.cashfree && <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload"/>}
    <p className="pay-amount">{rupees(p.amountPaise)}</p>
    <section className="pay-breakdown" aria-label="Quotation breakdown">
      <h2>Your reviewed quotation</h2>
      <dl>
        <div><dt>NISE COMPORT service fee</dt><dd>{rupees(p.serviceFeePaise)}</dd></div>
        <div><dt>Official / external fee</dt><dd>{rupees(p.externalFeePaise)}</dd></div>
        {p.discountPaise>0&&<div><dt>Promo discount {p.couponCode ? `(${p.couponCode})`:""}</dt><dd>−{rupees(p.discountPaise)}</dd></div>}
        <div><dt><strong>Amount due (before optional gateway fee)</strong></dt><dd><strong>{rupees(p.amountPaise)}</strong></dd></div>
      </dl>
      {p.status==="due"&&!p.couponCode&&<div className="pay-code">
        <label className="field-label" htmlFor="pay-promo">Have an offer or promo code?</label>
        <div className="admin-form-row"><input id="pay-promo" maxLength={40} autoCapitalize="characters" spellCheck={false} value={coupon}
          placeholder="Enter promo code" onChange={e=>setCoupon(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,"").slice(0,40))}/>
          <button type="button" className="btn btn--primary btn--sm" disabled={!coupon.trim()||Boolean(busy)} onClick={()=>void applyCoupon()}>
            {busy==="coupon"?"Applying…":"Apply offer"}</button></div>
        <small>Discounts apply only to our service fee—not official charges or payment gateway fees. <Link href="/offers">Browse active offers</Link>.</small>
      </div>}
      {p.couponCode&&<p className="alert alert--success">Your offer {p.couponCode} is applied.</p>}
    </section>
    {p.note && <p>{p.note}</p>}
    <p className="pay-ref">Request {p.reference}</p>

    {p.status === "failed" && <p className="pay-notice pay-notice--bad"><b>Your last payment did not go through.</b> {p.failureReason} If money was deducted from your account it is normally returned by your bank in 5 to 7 working days. You can try again below.</p>}
    {p.status !== "due" && !p.ticketRaised && (p.status === "verifying" || p.status === "failed") && <section>
      <h2>Paid but not confirmed?</h2>
      {p.ticketOpen ? <><p>It has been over 24 hours. Tell us what happened and we will check with the payment provider.</p>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Date, amount, bank reference (optional details)" maxLength={500}/>
        <button className="btn btn--ghost btn--block" type="button" disabled={busy === "ticket"} onClick={() => void raiseTicket()}>{busy === "ticket" ? "Sending…" : "Raise a ticket"}</button></>
        : <p>Please give it 24 hours first. Most payments are confirmed much sooner. After that you can raise a ticket here.</p>}
    </section>}
    {p.ticketRaised && p.refundStatus !== "done" && <p className="pay-notice">Your ticket is with our team. We are checking with the payment provider.</p>}
    {p.ticketRaised && refundBox}
    {p.status === "verifying" && <p className="pay-notice">We have your UPI reference. We will confirm it against our bank app, usually within a few hours during working time.</p>}

    {p.upiSlots.length > 0 && (p.status === "due" || p.status === "failed") && <section>
      <h2>Pay free with UPI</h2>
      <p>No extra charge. For your safety the QR code and UPI ID are shown only after you ask, and hide again after {Math.round(p.qrSeconds / 60)} minutes. Confirmation is manual, so it can take a little while.</p>
      {p.upiSlots.length > 1 && <div className="seg" role="group" aria-label="Choose a UPI account">{p.upiSlots.map((item) => <button key={item.slot} type="button" className={slot === item.slot ? "is-active" : undefined} disabled={busy === "qr"} onClick={() => { if (reveal) void showQr(item.slot); else setSlot(item.slot); }}>{item.label}</button>)}</div>}
      {reveal ? <>
        <div className="pay-qr" dangerouslySetInnerHTML={{ __html: reveal.svg }}/>
        <p className="pay-ref">UPI ID: {reveal.vpa}</p>
        <p className="pay-ref" role="timer" aria-live="off">Hides in {clock(left)}</p>
        <a className="btn btn--primary btn--block" href={reveal.link}>Open my UPI app</a>
        <button className="btn btn--ghost btn--block" type="button" onClick={() => setReveal(null)}>Hide now</button>
      </> : <button className="btn btn--primary btn--block" type="button" disabled={busy === "qr"} onClick={() => void showQr(slot)}>{busy === "qr" ? "Opening…" : "Show payment QR"}</button>}
      <label className="field-label" htmlFor="utr">After paying, enter the 12-digit UPI reference (UTR)</label>
      <input id="utr" inputMode="text" autoComplete="off" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. 401234567890"/>
      <button className="btn btn--ghost btn--block" type="button" disabled={!utr.trim() || busy === "utr"} onClick={() => void submitUtr()}>{busy === "utr" ? "Sending…" : "I have paid"}</button>
    </section>}

    {online && <section>
      <h2>Pay instantly online</h2>
      <p>Cards, net banking and UPI, confirmed immediately. A {p.feePercent}% payment-processing fee ({rupees(p.feePaise)}) is added: total <b>{rupees(total)}</b>.</p>
      {p.razorpay && <button className="btn btn--primary btn--block" type="button" disabled={Boolean(busy)} onClick={() => void payOnline("razorpay")}>{busy === "razorpay" ? "Opening…" : `Pay ${rupees(total)} online`}</button>}
      {!p.razorpay && p.cashfree && <button className="btn btn--primary btn--block" type="button" disabled={Boolean(busy)} onClick={() => void payOnline("cashfree")}>{busy === "cashfree" ? "Opening…" : `Pay ${rupees(total)} online`}</button>}
      {p.razorpay && p.cashfree && <button className="btn btn--ghost btn--block" type="button" disabled={Boolean(busy)} onClick={() => void payOnline("cashfree")}>{busy === "cashfree" ? "Opening…" : "Try another online method"}</button>}
    </section>}
    {!online && p.status !== "verifying" && <section>
      <h2>Pay instantly online</h2>
      <button className="btn btn--ghost btn--block" type="button" disabled>Coming soon</button>
      <small>Card and net-banking payment is being set up.</small>
    </section>}
    {p.upiSlots.length === 0 && <section>
      <h2>Pay with us directly</h2>
      <p>Online payment is coming soon. For now, message us on WhatsApp and we will send the payment details, or pay at our centre. Your request moves ahead as soon as we confirm the payment.</p>
      <a className="btn btn--primary btn--block" href={p.helpHref} target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a>
    </section>}
    {p.upiSlots.length > 0 && p.status !== "verifying" && <small>Trouble paying? <a href={p.helpHref} target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a>.</small>}
    {error && <p role="alert" className="form-error">{error}</p>}
  </div>;
}
