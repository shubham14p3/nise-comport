"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";
import { AdminPager } from "@/components/admin-pager";
import { customerWhatsAppLink, rupees } from "@/lib/payments-core";

type Row = { id: string; reference: string; amountPaise: number; feePaise: number; status: string; method: string | null; utr: string | null; note: string | null; requestName: string; customer: string; phone: string | null; createdAt: string; failureReason: string | null; issueNote: string | null; issueRaisedAt: string | null; refundChoice: string | null; refundStatus: string | null; refundDetails: string | null; refundPaise: number | null };
type Quotable = { reference: string; serviceName: string; customerName: string; status: string };
type Summary = { byMethod: { method: string; count: number; paise: number }[]; totalPaise: number; verifying: number; overdueVerify: number; failed: number; due: number; attention: number };
type Data = { payments: Row[]; total: number; summary: Summary; options: { upi: number; razorpay: boolean; cashfree: boolean; feePercent: number } };
const LIST = "A8s5L2nR7vE4";
const ACT = "H6k2B9tW4xC7";

/** Admin → Payments: ask a customer to pay, confirm UPI payments against the bank app, see online payments. */
export default function PaymentsPanel({ canCharge }: { canCharge: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [form, setForm] = useState({ reference: "", amount: "", note: "" });
  const [quotable, setQuotable] = useState<Quotable[] | null>(null);
  const [pickFilter, setPickFilter] = useState("");

  const load = useCallback(async (status: string, nextPage = 0, size = 20) => {
    try { setData(await secureApi<Data>(LIST, { status, page: nextPage, pageSize: size })); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Could not load payments."); }
  }, []);
  useEffect(() => { void Promise.resolve().then(() => load(filter, page, pageSize)); }, [filter, page, pageSize, load]);

  const loadQuotable = useCallback(async () => {
    try { const result = await secureApi<{ requests: Quotable[] }>(LIST, { status: "quotable" }); setQuotable(result.requests); }
    catch { setQuotable([]); }
  }, []);
  useEffect(() => { if (canCharge) void Promise.resolve().then(() => loadQuotable()); }, [canCharge, loadQuotable]);
  const search = pickFilter.trim().toLowerCase();
  const visibleQuotable = (quotable ?? []).filter((item) => !search || `${item.reference} ${item.customerName} ${item.serviceName}`.toLowerCase().includes(search));

  async function act(label: string, body: Record<string, unknown>) {
    setBusy(label); setError("");
    try { await secureApi(ACT, body); await load(filter, page, pageSize); return true; } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); return false; } finally { setBusy(""); }
  }
  async function create(event: FormEvent) {
    event.preventDefault();
    if (await act("create", { action: "create", ...form })) { setForm({ reference: "", amount: "", note: "" }); await loadQuotable(); }
  }

  return <section className="admin-card">
    <h2>Payments</h2>
    {data && <p className="muted">UPI QR {data.options.upi ? `on (${data.options.upi} ID${data.options.upi === 1 ? "" : "s"})` : "off (set UPI_ID)"} · Razorpay {data.options.razorpay ? "on" : "off"} · Cashfree {data.options.cashfree ? "on" : "off"} · online fee {data.options.feePercent}%</p>}
    {data && <div className="pay-summary">
      <div><b>{rupees(data.summary.totalPaise)}</b><small>collected, all methods</small></div>
      {data.summary.byMethod.map((m) => <div key={m.method}><b>{rupees(m.paise)}</b><small>{({ upi_qr: "UPI QR", razorpay: "Razorpay", cashfree: "Cashfree", cash: "Cash" } as Record<string, string>)[m.method]} · {m.count}</small></div>)}
      <div><b>{data.summary.verifying}</b><small>UPI to verify</small></div>
      <div className={data.summary.overdueVerify ? "pay-summary__alert" : undefined}><b>{data.summary.overdueVerify}</b><small>UTR waiting over 48 hours</small></div>
      <div><b>{data.summary.failed}</b><small>failed</small></div>
      <div><b>{data.summary.attention}</b><small>tickets / refunds</small></div>
    </div>}
    {canCharge && <section className="pay-create-card" aria-labelledby="pay-create-title">
      <div className="pay-create-card__head">
        <h3 id="pay-create-title">Create payment request</h3>
        <p>Choose a request that has been reviewed and approved. Only those are listed, so every reference is genuine.</p>
      </div>
      <form onSubmit={create} className="pay-create__form">
        <label className="pay-create__wide"><span>Request</span>
          <input type="search" placeholder="Search by reference, name or service" value={pickFilter} onChange={(e) => setPickFilter(e.target.value)} aria-label="Search requests"/>
          <select required value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} aria-label="Request reference">
            <option value="">{quotable === null ? "Loading requests…" : quotable.length ? "Choose a request" : "No approved requests are waiting for payment"}</option>
            {visibleQuotable.map((item) => <option key={item.reference} value={item.reference}>{item.reference} · {item.customerName} · {item.serviceName}</option>)}
          </select>
          {quotable && quotable.length > 0 && <small className="pay-create__count">{visibleQuotable.length} of {quotable.length} ready</small>}
        </label>
        <label><span>Amount (₹)</span><input required inputMode="decimal" placeholder="e.g. 250" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}/></label>
        <label><span>Note for customer <small>(optional)</small></span><input placeholder="Shown on the payment page" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}/></label>
        <button className="btn btn--primary pay-create__submit" disabled={busy === "create" || !form.reference}>{busy === "create" ? "Sending…" : "Ask to pay"}</button>
      </form>
    </section>}
    <div className="admin-chips pay-chips" role="group" aria-label="Filter payments">{["", "verifying", "issues", "failed", "due", "paid", "cancelled"].map((s) => <button key={s || "all"} type="button" className={filter === s ? "chip is-active" : "chip"} onClick={() => { setFilter(s); setPage(0); }}>{s || "All"}</button>)}</div>
    {error && <p role="alert" className="form-error">{error}</p>}
    {data && <AdminPager page={page} total={data.total} pageSize={pageSize} onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(0); }} label="payments"/>}
    {!data ? <p>Loading…</p> : !data.payments.length ? <p>No payments yet.</p> : <div className="table-scroll"><table className="price-table pay-table"><thead><tr><th>Request</th><th>Customer</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {data.payments.map((row) => <tr key={row.id}>
        <td data-label="Request">{row.reference}<br/><small>{row.requestName}</small><br/><small>Pay link: /pay/{row.reference}</small></td>
        <td data-label="Customer">{row.customer}<br/><small>{row.phone}</small></td>
        <td data-label="Amount">{rupees(row.amountPaise)}{row.feePaise > 0 && <small><br/>+ fee {rupees(row.feePaise)}</small>}</td>
        <td data-label="Status">{row.status}{row.method && <small><br/>{row.method}</small>}{row.utr && <small><br/>UTR {row.utr}</small>}{row.failureReason && <small><br/>Failed: {row.failureReason}</small>}{row.issueRaisedAt && <small><br/>Ticket: {row.issueNote || "no note"}</small>}{row.refundStatus && <small><br/>Refund {row.refundStatus}: {row.refundChoice}{row.refundDetails ? ` · ${row.refundDetails}` : ""}{row.refundPaise ? ` · ${rupees(row.refundPaise)}` : ""}</small>}</td>
        <td data-label="Action" className="pay-actions">{canCharge && row.refundStatus === "requested" && <><button className="btn btn--primary btn--sm" disabled={Boolean(busy)} onClick={() => { const sc = row.refundChoice === "wallet" ? "" : window.prompt("Service charge to deduct for work already done (₹, blank for none)", "") ?? ""; void act(row.id, { action: "refund", id: row.id, serviceCharge: sc }); }}>Pay refund</button>{" "}</>}{(row.status === "due" || row.status === "verifying" || row.status === "failed") && <>
          {(() => { const href = customerWhatsAppLink(row.phone, `Hello ${row.customer}, please pay ${rupees(row.amountPaise)} for ${row.requestName} (${row.reference}) here: ${window.location.origin}/pay/${row.reference}`); return href ? <><a className="btn btn--ghost btn--sm" href={href} target="_blank" rel="noopener noreferrer">Send on WhatsApp</a>{" "}</> : null; })()}
          <button className="btn btn--primary btn--sm" disabled={Boolean(busy)} onClick={() => void act(row.id, { action: "markPaid", id: row.id, method: "upi_qr" })}>Confirm UPI</button>{" "}
          <button className="btn btn--ghost btn--sm" disabled={Boolean(busy)} onClick={() => void act(row.id, { action: "markPaid", id: row.id, method: "cash" })}>Cash</button>{" "}
          {canCharge && <button className="btn btn--ghost btn--sm" disabled={Boolean(busy)} onClick={() => void act(row.id, { action: "cancel", id: row.id })}>Cancel</button>}</>}</td>
      </tr>)}
    </tbody></table></div>}
    {data && data.total > pageSize && <AdminPager page={page} total={data.total} pageSize={pageSize} onPage={setPage} label="payments"/>}
  </section>;
}
