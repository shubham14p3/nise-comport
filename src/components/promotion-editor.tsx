"use client";

import { FormEvent, useState } from "react";
import { Save, X } from "lucide-react";
import PosterPicker from "@/components/poster-picker";
import ScopePicker, { type Scope } from "@/components/scope-picker";
import { todayIst, addDays } from "@/lib/festivals";
import { secureApi } from "@/lib/secure-api-client";
import type { PromoView } from "@/lib/promo-view";

type Lang = "en" | "hi" | "bn";
export type EditablePromotion = PromoView & { id: string; active: boolean; perUserLimit: number | null; maxRedemptions: number | null };

/**
 * Create a promotion by hand, or edit one. Festival and sports codes keep their generated wording
 * and value; for those only posters can be added here.
 */
export default function PromotionEditor({ promotion, onDone, onCancel }: { promotion?: EditablePromotion; onDone: (message: string) => void; onCancel: () => void }) {
  const eventCode = Boolean(promotion && promotion.kind !== "public");
  const today = todayIst();
  const [code, setCode] = useState(promotion?.code ?? "");
  const [names, setNames] = useState<Record<Lang, string>>({ en: promotion?.names.en ?? "", hi: promotion && promotion.names.hi !== promotion.names.en ? promotion.names.hi : "", bn: promotion && promotion.names.bn !== promotion.names.en ? promotion.names.bn : "" });
  const [blurb, setBlurb] = useState<Record<Lang, string>>({ en: promotion?.blurb?.en ?? "", hi: promotion?.blurb?.hi ?? "", bn: promotion?.blurb?.bn ?? "" });
  const [discountType, setDiscountType] = useState<"fixed" | "percent" | "balance">(promotion?.discountType ?? "fixed");
  const [discount, setDiscount] = useState(String(promotion?.discount ?? 50));
  const [minimum, setMinimum] = useState(String(promotion?.minimum ?? 150));
  const [startsOn, setStartsOn] = useState(promotion?.startsOn ?? today);
  const [endsOn, setEndsOn] = useState(promotion?.endsOn && promotion.endsOn < "2099-01-01" ? promotion.endsOn : addDays(today, 30));
  const [perUser, setPerUser] = useState(promotion?.perUserLimit === null ? "" : String(promotion?.perUserLimit ?? 1));
  const [maxUses, setMaxUses] = useState(promotion?.maxRedemptions ? String(promotion.maxRedemptions) : "");
  const [posters, setPosters] = useState<Partial<Record<Lang, string>>>(promotion?.posters ?? {});
  const [scope, setScope] = useState<Scope | null>(promotion?.appliesTo ?? null);
  const [maxDiscount, setMaxDiscount] = useState(promotion?.maxDiscount ? String(promotion.maxDiscount) : "");
  const [maxPercent, setMaxPercent] = useState(String(promotion?.maxPercent ?? 20));
  const [audience, setAudience] = useState<"everyone" | "customer">("everyone");
  const [customerPhone, setCustomerPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (eventCode && promotion) {
        await secureApi("M7x3Q9vB2kF5", { id: promotion.id, posters, appliesTo: scope });
        onDone(`${promotion.code} saved.`);
        return;
      }
      const details = {
        names, description: blurb.en.trim() ? blurb : null, discountType, discount: Number(discount), maxPercent: discountType === "balance" ? Number(maxPercent) : null, minimum: Number(minimum),
        perUserLimit: perUser ? Number(perUser) : null, maxRedemptions: maxUses ? Number(maxUses) : null, posters,
        appliesTo: scope, maxDiscount: (discountType === "percent" || discountType === "balance") && maxDiscount ? Number(maxDiscount) : null,
        ...(!promotion && audience === "customer" ? { customerPhone } : {}),
      };
      if (!promotion && audience === "customer" && customerPhone.length !== 10) { setError("Enter the customer's 10-digit mobile number."); setBusy(false); return; }
      if (promotion) {
        await secureApi("M7x3Q9vB2kF5", { id: promotion.id, ...details, startsOn, endsOn });
        onDone(`${promotion.code} updated.`);
      } else {
        const result = await secureApi<{ code: string }>("N4v8Q1cR6tY3", { code, startsOn, endsOn, ...details });
        onDone(`${result.code} created. It shows on the offers page and in the step flows while it’s live.`);
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save the promotion."); }
    finally { setBusy(false); }
  }

  return <form className="promo-editor" onSubmit={submit}>
    <div className="promo-editor__head"><h3>{promotion ? eventCode ? `Posters & services for ${promotion.code}` : `Edit ${promotion.code}` : "New promotion"}</h3><button type="button" className="icon-btn" onClick={onCancel} aria-label="Close"><X size={18}/></button></div>
    {!eventCode && <>
      <fieldset className="pe-card"><legend>1 · The code</legend>
        <div className="pe-grid">
          <label className="field"><span className="field__label">Code</span><input value={code} disabled={Boolean(promotion)} required onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20))} placeholder="e.g. RENEW50"/><small className="field__hint">Letters, numbers and dashes. Can't be changed later.</small></label>
          <label className="field"><span className="field__label">Name (English)</span><input value={names.en} onChange={(event) => setNames({ ...names, en: event.target.value })} required maxLength={80} placeholder="Insurance renewal week"/></label>
        </div>
        <details className="pe-more"><summary>Hindi, Bengali names and short lines (optional)</summary>
          <div className="pe-grid">
            <label className="field"><span className="field__label">Name (हिन्दी)</span><input value={names.hi} onChange={(event) => setNames({ ...names, hi: event.target.value })} maxLength={80}/></label>
            <label className="field"><span className="field__label">Name (বাংলা)</span><input value={names.bn} onChange={(event) => setNames({ ...names, bn: event.target.value })} maxLength={80}/></label>
            <label className="field"><span className="field__label">Short line (English)</span><input value={blurb.en} onChange={(event) => setBlurb({ ...blurb, en: event.target.value })} maxLength={240}/></label>
            <label className="field"><span className="field__label">Short line (हिन्दी)</span><input value={blurb.hi} onChange={(event) => setBlurb({ ...blurb, hi: event.target.value })} maxLength={240}/></label>
            <label className="field"><span className="field__label">Short line (বাংলা)</span><input value={blurb.bn} onChange={(event) => setBlurb({ ...blurb, bn: event.target.value })} maxLength={240}/></label>
          </div>
        </details>
      </fieldset>

      <fieldset className="pe-card"><legend>2 · The discount</legend>
        <div className="pe-seg" role="group" aria-label="Discount type">
          <button type="button" className={discountType === "fixed" ? "is-on" : undefined} aria-pressed={discountType === "fixed"} onClick={() => setDiscountType("fixed")}>₹ Rupees off</button>
          <button type="button" className={discountType === "percent" ? "is-on" : undefined} aria-pressed={discountType === "percent"} onClick={() => setDiscountType("percent")}>% Percent off</button>
          <button type="button" className={discountType === "balance" ? "is-on" : undefined} aria-pressed={discountType === "balance"} onClick={() => setDiscountType("balance")}>₹ Balance</button>
        </div>
        <div className="pe-grid">
          <label className="field"><span className="field__label">{discountType === "percent" ? "Percent off" : discountType === "balance" ? "Total balance (₹)" : "Rupees off"}</span><input type="number" min={1} max={discountType === "percent" ? 50 : 5000} value={discount} onChange={(event) => setDiscount(event.target.value)} required/></label>
          {discountType === "percent" && <label className="field"><span className="field__label">Most they can save (₹)</span><input type="number" min={1} max={5000} value={maxDiscount} onChange={(event) => setMaxDiscount(event.target.value)} placeholder="No cap"/></label>}
          {discountType === "balance" && <label className="field"><span className="field__label">Most per order (% of the bill)</span><input type="number" min={1} max={100} value={maxPercent} onChange={(event) => setMaxPercent(event.target.value)} required/><small className="field__hint">₹{discount || 0} balance, max {maxPercent || 0}% per order: a ₹100 order takes ₹{Math.min(Number(discount) || 0, (100 * (Number(maxPercent) || 0)) / 100)}, the rest waits for the next order.</small></label>}
          {discountType === "balance" && <label className="field"><span className="field__label">Most per order (₹, optional)</span><input type="number" min={1} max={5000} value={maxDiscount} onChange={(event) => setMaxDiscount(event.target.value)} placeholder="No cap"/></label>}
          <label className="field"><span className="field__label">Smallest order (₹)</span><input type="number" min={0} value={minimum} onChange={(event) => setMinimum(event.target.value)} required/><small className="field__hint">0 = works on any order.</small></label>
        </div>
        <p className="field__hint">Codes reduce your service charge or print bill only. Don’t describe them as a discount on an insurance premium or a government fee.</p>
      </fieldset>

      <fieldset className="pe-card"><legend>3 · Who can use it</legend>
        <div className="pe-seg" role="group" aria-label="Who can use this code">
          <button type="button" className={audience === "everyone" ? "is-on" : undefined} aria-pressed={audience === "everyone"} disabled={Boolean(promotion)} onClick={() => setAudience("everyone")}>Everyone</button>
          <button type="button" className={audience === "customer" ? "is-on" : undefined} aria-pressed={audience === "customer"} disabled={Boolean(promotion)} onClick={() => setAudience("customer")}>One customer</button>
        </div>
        {audience === "customer" && <label className="field"><span className="field__label">Customer's mobile number</span><span className="input-wrap"><span className="input-prefix">+91</span><input inputMode="numeric" maxLength={10} value={customerPhone} disabled={Boolean(promotion)} onChange={(event) => setCustomerPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="98765 43210"/></span><small className="field__hint">They must already have an account. Only they can use the code.</small></label>}
        {promotion && <small className="field__hint">Who can use a code is fixed when it is created. Create a new code to change it.</small>}
        <div className="pe-grid">
          <div className="field"><span className="field__label">How many customers can use it, in total?</span>
            <label className="check"><input type="checkbox" checked={!maxUses} onChange={(event) => setMaxUses(event.target.checked ? "" : "100")}/> No limit</label>
            {maxUses !== "" && <input type="number" min={1} value={maxUses} onChange={(event) => setMaxUses(event.target.value)} aria-label="Total uses"/>}</div>
          <div className="field"><span className="field__label">How many times can each customer use it?</span>
            <label className="check"><input type="checkbox" checked={!perUser} onChange={(event) => setPerUser(event.target.checked ? "" : "1")}/> No limit</label>
            {perUser !== "" && <input type="number" min={1} max={50} value={perUser} onChange={(event) => setPerUser(event.target.value)} aria-label="Uses per customer"/>}</div>
        </div>
        <p className="pe-summary">{audience === "customer" ? "Only that customer" : "Anyone with the code"} can use it, {perUser ? `${perUser} time${perUser === "1" ? "" : "s"} each` : "as many times as they like"}{maxUses ? `, up to ${maxUses} use${maxUses === "1" ? "" : "s"} in total` : ""}.</p>
      </fieldset>

      <fieldset className="pe-card"><legend>4 · When</legend>
        <div className="pe-grid">
          <label className="field"><span className="field__label">From</span><input type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} required/></label>
          <label className="field"><span className="field__label">Until</span><input type="date" value={endsOn} min={startsOn} onChange={(event) => setEndsOn(event.target.value)} required/></label>
        </div>
      </fieldset>
    </>}
    <fieldset className="pe-card"><legend>{eventCode ? "Services" : "5 · Services"}</legend>
    <span className="field__label">Where can this code be used? <em>the discount is only given on these services</em></span>
    <ScopePicker value={scope} onChange={setScope}/>
    </fieldset>
    <fieldset className="pe-card"><legend>{eventCode ? "Posters" : "6 · Posters (optional)"}</legend>
    <span className="field__label">Posters <em>shown on the offers page and sent with WhatsApp campaigns, in the customer’s language</em></span>
    <PosterPicker value={posters} onChange={setPosters}/>
    </fieldset>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    <div className="promo-editor__actions"><button className="btn btn--primary" disabled={busy}><Save size={16}/>{busy ? "Saving…" : promotion ? "Save" : "Create promotion"}</button><button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button></div>
  </form>;
}
