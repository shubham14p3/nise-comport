"use client";

import { useState, type KeyboardEvent } from "react";
import { secureApi, SecureApiError } from "@/lib/secure-api-client";
import { COUNTER_DISCOUNT_PERCENT } from "@/lib/counter-rules";

/** Gateway code for POST /api/admin/counter (see src/app/api/x7q9m2/route.ts). */
const COUNTER_OP = "C6d1L8wN4vXs";

type Service = { slug: string; title: string };
type Visit = { id: string; serviceName: string; billPaise: number; discountPaise: number; walletPaise: number; collectPaise: number; createdAt: string };
type Lookup = { phone: string; customer: { id: string; name: string } | null; balancePaise: number; visits: Visit[] };
type Recorded = { billPaise: number; discountPaise: number; collectPaise: number; balanceAfterPaise: number };

const rupees = (paise: number) => `₹${(paise / 100).toFixed(2)}`;
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * Owner's counter desk. Type a mobile number and press Enter to see the balance. Pick a service,
 * type the amount, and press Enter in the amount to record the visit. The server does the maths.
 */
export default function CounterDesk({ services }: { services: Service[] }) {
  const [phone, setPhone] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [newName, setNewName] = useState("");
  const [serviceText, setServiceText] = useState("");
  const [service, setService] = useState<Service | null>(null);
  const [highlight, setHighlight] = useState(0);
  const [amount, setAmount] = useState("");
  const [topupAmount, setTopupAmount] = useState("");
  const [topupNote, setTopupNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const digits = phone.replace(/\D/g, "");
  const matches = serviceText.trim()
    ? services.filter((item) => item.title.toLowerCase().includes(serviceText.trim().toLowerCase())).slice(0, 8)
    : services.slice(0, 8);
  const billPaise = Math.round((Number(amount) || 0) * 100);
  const balancePaise = lookup?.balancePaise ?? 0;
  const previewDiscount = Math.min(Math.floor((billPaise * COUNTER_DISCOUNT_PERCENT) / 100), balancePaise);

  async function run<T>(action: () => Promise<T>) {
    setBusy(true); setError(""); setNotice("");
    try { return await action(); }
    catch (reason) {
      setError(reason instanceof SecureApiError || reason instanceof Error ? reason.message : "Something went wrong. Please try again.");
      return null;
    } finally { setBusy(false); }
  }

  async function findCustomer() {
    if (digits.length < 10) { setError("Enter a 10-digit mobile number."); return; }
    const result = await run(() => secureApi<Lookup>(COUNTER_OP, { action: "lookup", phone: digits }));
    if (result) { setLookup(result); setNotice(result.customer ? "" : "New number. Enter the customer’s name to create their profile."); }
  }

  function pickService(item: Service) {
    setService(item); setServiceText(item.title); setHighlight(0);
  }

  function onServiceKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") { event.preventDefault(); setHighlight((index) => Math.min(index + 1, matches.length - 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setHighlight((index) => Math.max(index - 1, 0)); }
    if (event.key === "Enter") {
      event.preventDefault();
      const picked = matches[highlight] ?? matches[0];
      if (picked) pickService(picked);
    }
  }

  async function recordVisit() {
    if (!service) { setError("Choose a service first."); return; }
    if (!(billPaise > 0)) { setError("Enter the amount."); return; }
    if (!lookup) { setError("Look up the mobile number first."); return; }
    const result = await run(() => secureApi<Recorded>(COUNTER_OP, {
      action: "visit", phone: digits, name: lookup.customer ? undefined : newName, serviceSlug: service.slug, amount: billPaise / 100,
    }));
    if (!result) return;
    setNotice(`Recorded. Customer pays ${rupees(result.collectPaise)}${result.discountPaise ? `, wallet covers ${rupees(result.discountPaise)}` : ""}. Balance now ${rupees(result.balanceAfterPaise)}.`);
    setService(null); setServiceText(""); setAmount(""); setNewName("");
    await findCustomer();
  }

  async function topUp() {
    const paise = Math.round((Number(topupAmount) || 0) * 100);
    if (!(paise > 0)) { setError("Enter the top-up amount."); return; }
    if (!lookup) { setError("Look up the mobile number first."); return; }
    const result = await run(() => secureApi<{ balanceAfterPaise: number }>(COUNTER_OP, {
      action: "topup", phone: digits, name: lookup.customer ? undefined : newName, amount: paise / 100, note: topupNote,
    }));
    if (!result) return;
    setNotice(`Topped up. Balance now ${rupees(result.balanceAfterPaise)}.`);
    setTopupAmount(""); setTopupNote("");
    await findCustomer();
  }

  function onAmountKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") { event.preventDefault(); void recordVisit(); }
  }

  return <section className="container" style={{ paddingTop: 16, maxWidth: 720 }} aria-label="Counter desk">
    <h1>Counter desk</h1>
    <p className="muted">Owner only. Look up a mobile number, then record the visit. Every entry is kept with its date and time.</p>

    <label className="field"><span className="field__label">Customer mobile</span>
      <input type="tel" inputMode="numeric" autoComplete="off" value={phone} placeholder="98765 43210"
        onChange={(event) => setPhone(event.target.value.replace(/[^\d\s+-]/g, "").slice(0, 16))}
        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void findCustomer(); } }}
        onBlur={() => { if (digits.length === 10 && lookup?.phone !== digits) void findCustomer(); }}/>
      <span className="field__hint">Press Enter to look up.</span>
    </label>

    {lookup && <div className="callout" style={{ marginTop: 12 }}>
      {lookup.customer
        ? <><b>{lookup.customer.name}</b><span> · balance <b>{rupees(lookup.balancePaise)}</b></span></>
        : <label className="field"><span className="field__label">New customer’s name</span>
          <input value={newName} onChange={(event) => setNewName(event.target.value)} autoComplete="off"/></label>}
    </div>}

    {lookup && <>
      <label className="field" style={{ marginTop: 14 }}><span className="field__label">Service</span>
        <input value={serviceText} placeholder="Type to search, then Enter" autoComplete="off" role="combobox" aria-expanded={!service}
          onChange={(event) => { setServiceText(event.target.value); setService(null); setHighlight(0); }}
          onKeyDown={onServiceKey}/>
        {!service && <ul role="listbox" className="field__hint" style={{ listStyle: "none", padding: 0, margin: "6px 0 0", maxHeight: 220, overflowY: "auto" }}>
          {matches.map((item, index) => <li key={item.slug} role="option" aria-selected={index === highlight}
            onMouseDown={(event) => { event.preventDefault(); pickService(item); }}
            style={{ padding: "6px 8px", cursor: "pointer", background: index === highlight ? "var(--surface-2, #eef)" : "transparent" }}>{item.title}</li>)}
          {matches.length === 0 && <li>No service matches.</li>}
        </ul>}
      </label>

      <label className="field"><span className="field__label">Amount (₹)</span>
        <input inputMode="decimal" autoComplete="off" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))} onKeyDown={onAmountKey}/>
        <span className="field__hint">Press Enter to record the visit.</span>
      </label>

      {billPaise > 0 && <dl className="summary" style={{ marginTop: 8 }}>
        <div><dt>Bill</dt><dd>{rupees(billPaise)}</dd></div>
        <div><dt>{COUNTER_DISCOUNT_PERCENT}% off, from wallet</dt><dd>{rupees(previewDiscount)}</dd></div>
        <div><dt>Customer pays</dt><dd><b>{rupees(billPaise - previewDiscount)}</b></dd></div>
      </dl>}

      <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void recordVisit()}>{busy ? "Recording…" : "Record visit"}</button>

      <details style={{ marginTop: 24 }}>
        <summary>Top up wallet</summary>
        <div className="form-grid" style={{ marginTop: 10 }}>
          <label className="field"><span className="field__label">Amount (₹)</span><input inputMode="decimal" value={topupAmount} onChange={(event) => setTopupAmount(event.target.value.replace(/[^\d.]/g, ""))}/></label>
          <label className="field"><span className="field__label">Note (optional)</span><input value={topupNote} onChange={(event) => setTopupNote(event.target.value)} maxLength={120}/></label>
        </div>
        <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => void topUp()} style={{ marginTop: 8 }}>Add to wallet</button>
      </details>

      {lookup.visits.length > 0 && <>
        <h2 style={{ marginTop: 28 }}>Recent visits</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {lookup.visits.map((visit) => <li key={visit.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line, #ddd)" }}>
            <b>{visit.serviceName}</b> · {when(visit.createdAt)}<br/>
            <small>Bill {rupees(visit.billPaise)} · wallet {rupees(visit.walletPaise)} · paid {rupees(visit.collectPaise)}</small>
          </li>)}
        </ul>
      </>}
    </>}

    {error && <p className="alert alert--error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
    {notice && <p className="alert alert--info" role="status" style={{ marginTop: 12 }}>{notice}</p>}
  </section>;
}
