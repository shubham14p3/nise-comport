"use client";

import { FormEvent, useState } from "react";
import { Save, X } from "lucide-react";
import PosterPicker from "@/components/poster-picker";
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
  const [discountType, setDiscountType] = useState<"fixed" | "percent">(promotion?.discountType ?? "fixed");
  const [discount, setDiscount] = useState(String(promotion?.discount ?? 50));
  const [minimum, setMinimum] = useState(String(promotion?.minimum ?? 150));
  const [startsOn, setStartsOn] = useState(promotion?.startsOn ?? today);
  const [endsOn, setEndsOn] = useState(promotion?.endsOn && promotion.endsOn < "2099-01-01" ? promotion.endsOn : addDays(today, 30));
  const [perUser, setPerUser] = useState(promotion?.perUserLimit === null ? "" : String(promotion?.perUserLimit ?? 1));
  const [maxUses, setMaxUses] = useState(promotion?.maxRedemptions ? String(promotion.maxRedemptions) : "");
  const [posters, setPosters] = useState<Partial<Record<Lang, string>>>(promotion?.posters ?? {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (eventCode && promotion) {
        await secureApi("M7x3Q9vB2kF5", { id: promotion.id, posters });
        onDone(`Posters saved for ${promotion.code}.`);
        return;
      }
      const details = {
        names, description: blurb.en.trim() ? blurb : null, discountType, discount: Number(discount), minimum: Number(minimum),
        perUserLimit: perUser ? Number(perUser) : null, maxRedemptions: maxUses ? Number(maxUses) : null, posters,
      };
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
    <div className="promo-editor__head"><h3>{promotion ? eventCode ? `Posters for ${promotion.code}` : `Edit ${promotion.code}` : "New promotion"}</h3><button type="button" className="icon-btn" onClick={onCancel} aria-label="Close"><X size={18}/></button></div>
    {!eventCode && <>
      <div className="form-grid form-grid--3">
        <label className="field"><span className="field__label">Code</span><input value={code} disabled={Boolean(promotion)} required onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20))} placeholder="e.g. RENEW50"/></label>
        <label className="field"><span className="field__label">From</span><input type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} required/></label>
        <label className="field"><span className="field__label">Until</span><input type="date" value={endsOn} min={startsOn} onChange={(event) => setEndsOn(event.target.value)} required/></label>
      </div>
      <div className="form-grid form-grid--3">
        <label className="field"><span className="field__label">Name (English)</span><input value={names.en} onChange={(event) => setNames({ ...names, en: event.target.value })} required maxLength={80} placeholder="Insurance renewal week"/></label>
        <label className="field"><span className="field__label">Name (हिन्दी) <em>optional</em></span><input value={names.hi} onChange={(event) => setNames({ ...names, hi: event.target.value })} maxLength={80} placeholder="बीमा रिन्यूअल सप्ताह"/></label>
        <label className="field"><span className="field__label">Name (বাংলা) <em>optional</em></span><input value={names.bn} onChange={(event) => setNames({ ...names, bn: event.target.value })} maxLength={80} placeholder="বিমা রিনিউয়াল সপ্তাহ"/></label>
      </div>
      <div className="form-grid form-grid--3">
        <label className="field"><span className="field__label">Short line (English) <em>optional</em></span><input value={blurb.en} onChange={(event) => setBlurb({ ...blurb, en: event.target.value })} maxLength={240}/></label>
        <label className="field"><span className="field__label">Short line (हिन्दी)</span><input value={blurb.hi} onChange={(event) => setBlurb({ ...blurb, hi: event.target.value })} maxLength={240}/></label>
        <label className="field"><span className="field__label">Short line (বাংলা)</span><input value={blurb.bn} onChange={(event) => setBlurb({ ...blurb, bn: event.target.value })} maxLength={240}/></label>
      </div>
      <div className="form-grid form-grid--4">
        <label className="field"><span className="field__label">Discount</span><span className="input-wrap"><select value={discountType} onChange={(event) => setDiscountType(event.target.value as "fixed" | "percent")} aria-label="Discount type"><option value="fixed">₹ off</option><option value="percent">% off</option></select><input type="number" min={1} max={discountType === "percent" ? 50 : 5000} value={discount} onChange={(event) => setDiscount(event.target.value)} required/></span></label>
        <label className="field"><span className="field__label">Minimum order (₹)</span><input type="number" min={0} value={minimum} onChange={(event) => setMinimum(event.target.value)} required/></label>
        <label className="field"><span className="field__label">Uses per customer</span><input type="number" min={1} max={50} value={perUser} onChange={(event) => setPerUser(event.target.value)} placeholder="Unlimited"/></label>
        <label className="field"><span className="field__label">Total uses <em>optional</em></span><input type="number" min={1} value={maxUses} onChange={(event) => setMaxUses(event.target.value)} placeholder="No limit"/></label>
      </div>
      <p className="field__hint">Codes reduce your service charge or print bill only. Don’t describe them as a discount on an insurance premium or a government fee.</p>
    </>}
    <span className="field__label">Posters <em>shown on the offers page and sent with WhatsApp campaigns, in the customer’s language</em></span>
    <PosterPicker value={posters} onChange={setPosters}/>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    <div className="promo-editor__actions"><button className="btn btn--primary" disabled={busy}><Save size={16}/>{busy ? "Saving…" : promotion ? "Save" : "Create promotion"}</button><button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button></div>
  </form>;
}
