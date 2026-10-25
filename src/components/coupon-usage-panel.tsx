"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, Search, ShieldCheck } from "lucide-react";
import { secureApi } from "@/lib/secure-api-client";
import { AdminPager, useAdminPagination } from "@/components/admin-pager";

type Use = { id: string; couponId: string; code: string; userId: string; name: string; phone: string | null; email: string; what: string; reference: string | null; amount: number; usedAt: string; timesByCustomer: number };
type Block = { id: string; userId: string; couponId: string | null; code: string | null; reason: string | null; createdAt: string; name: string; phone: string | null };
type Data = { uses: Use[]; total: number; blocks: Block[]; codes: { id: string; code: string }[] };

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
const shownEmail = (email: string) => email.endsWith(".invalid") ? "" : email;

/** Admin → Coupon use: who used which code, how many times, and who is barred. Works on phones (cards) and desktops (table). */
export default function CouponUsagePanel() {
  const [data, setData] = useState<Data | null>(null);
  const [q, setQ] = useState("");
  const [coupon, setCoupon] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try { setData(await secureApi<Data>("Y6k1D8pT3vN5", { q: q.trim(), coupon, page, pageSize })); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load coupon use."); }
  }, [q, coupon, page, pageSize]);
  useEffect(() => { const timer = setTimeout(() => void load(), 250); return () => clearTimeout(timer); }, [load]);

  async function act(body: Record<string, unknown>, key: string, done: string) {
    setBusy(key); setError(""); setNotice("");
    try { await secureApi("B2w9F4mS7hJ6", body); setNotice(done); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save."); }
    finally { setBusy(""); }
  }
  function block(use: Use, everything: boolean) {
    const reason = window.prompt(`Why block ${use.name} from ${everything ? "all coupons" : use.code}? (optional)`, "");
    if (reason === null) return;
    void act({ action: "block", userId: use.userId, couponId: everything ? null : use.couponId, reason: reason || null }, use.id, "Blocked.");
  }
  const blockedPaging = useAdminPagination(data?.blocks ?? []);
  const blocked = (use: Use) => data?.blocks.some((item) => item.userId === use.userId && (item.couponId === null || item.couponId === use.couponId));

  return <section className="admin-card cu">
    <h2>Coupon use</h2>
    <p className="muted">Every time a customer used a code: who, on what, how much it saved, and how many times that customer has used it. You can stop a customer from using one code or all codes.</p>
    <div className="cu__filters">
      <label className="field cu__search"><span className="field__label">Find a customer or code</span>
        <span className="input-wrap"><Search size={16}/><input value={q} onChange={(event) => { setQ(event.target.value); setPage(0); }} placeholder="Name, mobile, email or code"/></span></label>
      <label className="field"><span className="field__label">One code</span>
        <select value={coupon} onChange={(event) => { setCoupon(event.target.value); setPage(0); }}><option value="">All codes</option>{data?.codes.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select></label>
    </div>
    {notice && <p role="status">{notice}</p>}{error && <p role="alert" className="form-error">{error}</p>}
    {!data ? <p>Loading…</p> : <>
      {data.blocks.length > 0 && <details className="cu__blocks admin-accordion"><summary><Ban size={16}/> Blocked customers ({data.blocks.length})</summary>
        <AdminPager {...blockedPaging} label="blocked customers"/><ul>{blockedPaging.items.map((item) => <li key={item.id}><span><b>{item.name}</b>{item.phone ? ` · ${item.phone}` : ""} · {item.code ?? "all coupons"}{item.reason ? ` · ${item.reason}` : ""}<small> · {when(item.createdAt)}</small></span>
          <button className="btn btn--ghost btn--sm" disabled={busy === item.id} onClick={() => void act({ action: "unblock", id: item.id }, item.id, "Allowed again.")}><ShieldCheck size={14}/> Allow again</button></li>)}</ul>{data.blocks.length > blockedPaging.pageSize && <AdminPager {...blockedPaging} label="blocked customers"/>}</details>}
      {data.uses.length === 0 ? <p className="muted">No coupon uses found.</p> : <><AdminPager page={page} total={data.total} pageSize={pageSize} onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(0); }} label="coupon redemptions"/><ul className="cu__list">
        {data.uses.map((use) => <li key={use.id} className="cu__row">
          <div className="cu__who"><b>{use.name}</b><span>{use.phone ?? ""}{shownEmail(use.email) ? ` · ${shownEmail(use.email)}` : ""}</span></div>
          <div className="cu__code"><b>{use.code}</b><span>used {use.timesByCustomer}× by this customer</span></div>
          <div className="cu__what"><span>{use.what}{use.reference ? ` · ${use.reference}` : ""}</span><span>saved ₹{use.amount} · {when(use.usedAt)}</span></div>
          <div className="cu__act">{blocked(use) ? <span className="chip chip--warn">Blocked</span> : <>
            <button className="btn btn--ghost btn--sm" disabled={busy === use.id} onClick={() => block(use, false)}>Block this code</button>
            <button className="btn btn--ghost btn--sm" disabled={busy === use.id} onClick={() => block(use, true)}>Block all codes</button></>}</div>
        </li>)}
      </ul>{data.total > pageSize && <AdminPager page={page} total={data.total} pageSize={pageSize} onPage={setPage} label="coupon redemptions"/>}</>}
    </>}
  </section>;
}
