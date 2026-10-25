"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, CreditCard, History, Plus, Search, WalletCards, PencilLine } from "lucide-react";
import { secureApi } from "@/lib/secure-api-client";
import { AdminPager } from "@/components/admin-pager";

type Holder = { id: string; name: string; email: string; phone: string | null; balance: string; credits: number };
type Entry = { id: string; kind: string; amount: string; description: string; reference: string | null; createdAt: string };
type Ledger = { customers: Holder[]; total: number };
type HistoryData = { customer: { name: string; email: string; phone: string | null }; transactions: Entry[]; total: number; balance: string };
const QUERY = "L9w5A3sJ7qP2";
const CREDIT = "T7s3F8mP2cX6";
const CORRECT = "D2f6C8mR4nX1";

export default function WalletCreditForm({ canCorrect = false }: { canCorrect?: boolean }) {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("Promotional customer credit");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [data, setData] = useState<Ledger | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [historyPage, setHistoryPage] = useState(0);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [correction, setCorrection] = useState<Entry | null>(null);
  const [adjustment, setAdjustment] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(async (query = q, nextPage = page, size = pageSize) => {
    try {
      const result = await secureApi<Ledger>(QUERY, { q: query, page: nextPage, size });
      setData(result); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load wallet history."); }
  }, [q, page, pageSize]);
  const loadHistory = useCallback(async (id: string, nextPage = 0, size = pageSize) => {
    try { setHistory(await secureApi<HistoryData>(QUERY, { userId: id, page: nextPage, size })); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not open wallet."); }
  }, [pageSize]);
  useEffect(() => { void Promise.resolve().then(() => load("", 0, 20)); }, []); // only mounts after opening Wallet tab

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setError("");
    try {
      await secureApi(CREDIT, { email, amount: Number(amount), description });
      setMessage("Wallet credit recorded. The customer can see it in their profile.");
      setAmount(""); await load();
      if (customerId) await loadHistory(customerId, historyPage);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not record wallet credit."); }
    finally { setBusy(false); }
  }
  async function correct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!correction || !customerId || !canCorrect) return;
    const value = Number(adjustment);
    if (!Number.isFinite(value) || value <= 0 || value > Number(correction.amount)) { setError("Enter a valid amount to reverse."); return; }
    if (!window.confirm(`Reverse ₹${value.toFixed(2)} of this credit? The original transaction will remain visible.`)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await secureApi(CORRECT, { entryId: correction.id, amount: value, reason });
      setCorrection(null); setAdjustment(""); setReason("");
      setMessage("Correction recorded as a separate debit. Original entry preserved.");
      await Promise.all([load(), loadHistory(customerId, historyPage)]);
    } catch (e) { setError(e instanceof Error ? e.message : "Wallet correction failed."); }
    finally { setBusy(false); }
  }

  return <section className="admin-queue wallet-admin admin-wallet">
    <div className="admin-panel-title"><div><h2><WalletCards size={19}/> Customer wallets</h2><p>Review credits, balances and full correction history. Corrections never overwrite previous transactions.</p></div></div>
    {error && <div className="form-alert error-alert" role="alert">{error}</div>}
    {message && <div className="form-alert success-alert" role="status">{message}</div>}
    <details className="admin-accordion">
      <summary><Plus size={16}/> Add wallet credit</summary>
      <form onSubmit={(event) => void submit(event)} className="admin-form-grid">
        <label>Customer email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com"/></label>
        <label>Credit amount (₹)<input type="number" min="0.01" max="100000" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100.00"/></label>
        <label>Reason<input minLength={3} maxLength={160} required value={description} onChange={(e) => setDescription(e.target.value)}/></label>
        <button className="btn btn--primary" disabled={busy}><CreditCard size={15}/>{busy ? "Recording…" : "Add wallet credit"}</button>
      </form>
    </details>
    <div className="promo-admin__bar">
      <label className="input-wrap"><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Customer name, mobile or email" aria-label="Search wallet customers"/></label>
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setQ(search); setPage(0); void load(search, 0); }}>Search</button>
    </div>
    {data && <AdminPager page={page} total={data.total} pageSize={pageSize} onPage={(next) => { setPage(next); void load(q, next); }} onPageSize={(size) => { setPageSize(size); setPage(0); setHistoryPage(0); void load(q, 0, size); if (customerId) void loadHistory(customerId, 0, size); }} label="wallet holders"/>}
    {!data && !error ? <p>Loading wallet customers…</p> : data?.total === 0 ? <p className="admin-empty">No wallets with credits yet.</p> : <div className="admin-wallet__holders">
      {data?.customers.map((person) => <button key={person.id} type="button" className={customerId === person.id ? "admin-wallet__holder is-active" : "admin-wallet__holder"} onClick={() => { setCustomerId(person.id); setHistoryPage(0); setHistory(null); setCorrection(null); void loadHistory(person.id); }}>
        <span><b>{person.name}</b><small>{person.email.endsWith(".invalid") ? (person.phone ?? "Mobile account") : person.email}{person.phone && !person.email.endsWith(".invalid") ? ` · ${person.phone}` : ""}</small></span>
        <span><b>₹{Number(person.balance).toFixed(2)}</b><small>{person.credits} entries</small></span>
      </button>)}
    </div>}
    {data && data.total > pageSize && <AdminPager page={page} total={data.total} pageSize={pageSize} onPage={(next) => { setPage(next); void load(q, next); }} label="wallet holders"/>}
    {customerId && <div className="admin-wallet__history">
      <div className="admin-panel-title"><div><h3><History size={17}/> {history?.customer.name ?? "Loading customer…"} — transaction history</h3><p>Current wallet balance: ₹{Number(history?.balance ?? 0).toFixed(2)}</p></div><button type="button" className="btn btn--ghost btn--sm" onClick={() => { setCustomerId(""); setHistory(null); setCorrection(null); }}><ArrowLeft size={14}/> Close</button></div>
      {history?.transactions.map((entry) => <article className="admin-wallet__entry" key={entry.id}>
        <span><b>{entry.description}</b><small>{new Date(entry.createdAt).toLocaleString("en-IN")}{entry.reference ? ` · ${entry.reference}` : ""}</small></span>
        <span className={entry.kind === "debit" ? "is-debit" : "is-credit"}>{entry.kind === "debit" ? "−" : "+"}₹{Number(entry.amount).toFixed(2)}</span>
        {canCorrect && entry.kind === "credit" && <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setCorrection(entry); setAdjustment(""); setReason(""); }}><PencilLine size={14}/> Correct</button>}
      </article>)}
      {history && history.total > pageSize && <AdminPager page={historyPage} total={history.total} pageSize={pageSize} onPage={(next) => { setHistoryPage(next); void loadHistory(customerId, next); }} label="wallet transactions"/>}
      {canCorrect && correction && <form className="admin-wallet__correct admin-form-grid" onSubmit={(event) => void correct(event)}>
        <h4>Correct a mistaken credit (append-only)</h4>
        <p>Original ₹{Number(correction.amount).toFixed(2)} — a debit adjustment will be recorded instead of editing or deleting history.</p>
        <label>Amount to reverse (₹)<input type="number" required step="0.01" min="0.01" max={correction.amount} value={adjustment} onChange={(event) => setAdjustment(event.target.value)}/></label>
        <label>Reason for correction<input required minLength={10} maxLength={180} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why the credit was incorrect"/></label>
        <button type="submit" className="btn btn--primary btn--sm" disabled={busy}>Record adjustment</button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCorrection(null)}>Cancel</button>
      </form>}
    </div>}
  </section>;
}
