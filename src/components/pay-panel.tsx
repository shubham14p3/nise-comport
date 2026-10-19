"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { secureApi } from "@/lib/secure-api-client";
import { rupees } from "@/lib/payments-core";

type Props = {
  reference: string; status: string; amountPaise: number; feePaise: number; note: string | null; paidVia: string | null;
  upi: string | null; qr: string | null; vpa: string | null; razorpay: boolean; cashfree: boolean; feePercent: number;
};
type Order =
  | { provider: "razorpay"; keyId: string; orderId: string; amount: number; name: string; reference: string }
  | { provider: "cashfree"; sessionId: string; mode: "sandbox" | "production"; reference: string };
declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void }; Cashfree?: (options: { mode: string }) => { checkout: (options: Record<string, unknown>) => void } } }

const PAY = "Y3d7N5qV1mP8";

export default function PayPanel(p: Props) {
  const router = useRouter();
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const online = p.razorpay || p.cashfree;
  const total = p.amountPaise + p.feePaise;

  async function run<T>(label: string, work: () => Promise<T>) {
    setBusy(label); setError("");
    try { return await work(); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); return null; } finally { setBusy(""); }
  }

  async function submitUtr() {
    const done = await run("utr", () => secureApi(PAY, { action: "utr", reference: p.reference, utr }));
    if (done) router.refresh();
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

  if (p.status === "paid") return <div className="pay-card pay-card--done"><h2>Payment received ✓</h2><p>Thank you. We have recorded {rupees(p.amountPaise + (p.paidVia === "razorpay" || p.paidVia === "cashfree" ? p.feePaise : 0))} against {p.reference}.</p></div>;
  if (p.status === "cancelled") return <div className="pay-card"><h2>This payment request was cancelled</h2><p>Please contact us if you think this is a mistake.</p></div>;

  return <div className="pay-card">
    {p.razorpay && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload"/>}
    {p.cashfree && <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload"/>}
    <p className="pay-amount">{rupees(p.amountPaise)}</p>
    {p.note && <p>{p.note}</p>}
    <p className="pay-ref">Request {p.reference}</p>

    {p.status === "verifying" && <p className="pay-notice">We have your UPI reference. We will confirm it against our bank app, usually within a few hours during working time.</p>}

    {p.upi && p.qr && p.status === "due" && <section>
      <h2>Pay free with UPI</h2>
      <p>No extra charge. Scan with any UPI app, or tap the button on your phone. Confirmation is manual, so it can take a little while.</p>
      <div className="pay-qr" dangerouslySetInnerHTML={{ __html: p.qr }}/>
      <p className="pay-ref">UPI ID: {p.vpa}</p>
      <a className="btn btn--primary btn--block" href={p.upi}>Open my UPI app</a>
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
    {!p.upi && !online && <p>Online payment is not switched on yet. Please pay at the desk.</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
  </div>;
}
