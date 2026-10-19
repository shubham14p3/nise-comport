"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";
import { rupees } from "@/lib/payments-core";

type Row = { id: string; reference: string; amountPaise: number; feePaise: number; status: string; method: string | null; utr: string | null; note: string | null; requestName: string; customer: string; phone: string | null; createdAt: string };
type Data = { payments: Row[]; options: { upi: boolean; razorpay: boolean; cashfree: boolean; feePercent: number } };
const LIST = "A8s5L2nR7vE4";
const ACT = "H6k2B9tW4xC7";

/** Admin → Payments: ask a customer to pay, confirm UPI payments against the bank app, see online payments. */
export default function PaymentsPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [form, setForm] = useState({ reference: "", amount: "", note: "" });

  const load = useCallback(async (status: string) => {
    try { setData(await secureApi<Data>(LIST, { status })); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Could not load payments."); }
  }, []);
  useEffect(() => { void load(filter); }, [filter, load]);

  async function act(label: string, body: Record<string, unknown>) {
    setBusy(label); setError("");
    try { await secureApi(ACT, body); await load(filter); return true; } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); return false; } finally { setBusy(""); }
  }
  async function create(event: FormEvent) {
    event.preventDefault();
    if (await act("create", { action: "create", ...form })) setForm({ reference: "", amount: "", note: "" });
  }

  return <section className="admin-card">
    <h2>Payments</h2>
    {data && <p className="muted">UPI QR {data.options.upi ? "on" : "off (set UPI_ID)"} · Razorpay {data.options.razorpay ? "on" : "off"} · Cashfree {data.options.cashfree ? "on" : "off"} · online fee {data.options.feePercent}%</p>}
    <form onSubmit={create} className="admin-form-row">
      <input required placeholder="Request reference (e.g. NC-…)" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })}/>
      <input required inputMode="decimal" placeholder="Amount ₹" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}/>
      <input placeholder="Note shown to customer (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}/>
      <button className="btn btn--primary btn--sm" disabled={busy === "create"}>Ask to pay</button>
    </form>
    <div className="admin-chips">{["", "verifying", "due", "paid", "cancelled"].map((s) => <button key={s || "all"} type="button" className={filter === s ? "chip is-active" : "chip"} onClick={() => setFilter(s)}>{s || "All"}</button>)}</div>
    {error && <p role="alert" className="form-error">{error}</p>}
    {!data ? <p>Loading…</p> : !data.payments.length ? <p>No payments yet.</p> : <div className="table-scroll"><table className="price-table"><thead><tr><th>Request</th><th>Customer</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {data.payments.map((row) => <tr key={row.id}>
        <td>{row.reference}<br/><small>{row.requestName}</small><br/><small>Pay link: /pay/{row.reference}</small></td>
        <td>{row.customer}<br/><small>{row.phone}</small></td>
        <td>{rupees(row.amountPaise)}{row.feePaise > 0 && <small><br/>+ fee {rupees(row.feePaise)}</small>}</td>
        <td>{row.status}{row.method && <small><br/>{row.method}</small>}{row.utr && <small><br/>UTR {row.utr}</small>}</td>
        <td>{(row.status === "due" || row.status === "verifying") && <>
          <button className="btn btn--primary btn--sm" disabled={Boolean(busy)} onClick={() => void act(row.id, { action: "markPaid", id: row.id, method: "upi_qr" })}>Confirm UPI</button>{" "}
          <button className="btn btn--ghost btn--sm" disabled={Boolean(busy)} onClick={() => void act(row.id, { action: "markPaid", id: row.id, method: "cash" })}>Cash</button>{" "}
          <button className="btn btn--ghost btn--sm" disabled={Boolean(busy)} onClick={() => void act(row.id, { action: "cancel", id: row.id })}>Cancel</button></>}</td>
      </tr>)}
    </tbody></table></div>}
  </section>;
}
