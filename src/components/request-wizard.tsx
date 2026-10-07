"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, FileText, Headphones, House, Laptop, MapPin, PartyPopper, Search, Store, Upload, X } from "lucide-react";
import AddressPicker, { addressProblem, EMPTY_ADDRESS, formatAddress, type AddressValue } from "@/components/address-picker";
import { CategoryIcon, WhatsAppIcon } from "@/components/icons";
import { useLiveCodes } from "@/components/offers-provider";
import { scopeAllows } from "@/lib/promo-scope";
import PromoCodeField, { type AppliedCode, type CodeSuggestion } from "@/components/promo-code-field";
import { OfferRail, OfferStrip, WizardActions, WizardFrame } from "@/components/wizard";
import { categoryMeta, categoryMetaFor } from "@/lib/categories";
import { newIdempotencyKey } from "@/lib/client-id";
import type { OpeningHoursRule } from "@/lib/hours";
import { dict, fill, type Locale } from "@/lib/i18n";
import { findOffer, isOfferLive, offerAppliesTo, offersFor } from "@/lib/offers";
import { promoDict } from "@/lib/promo-i18n";
import { secureApi, secureUpload, SecureApiError } from "@/lib/secure-api-client";
import { useLocale } from "@/lib/use-locale";
import { whatsappHref } from "@/lib/public-contact";
import { rememberReturn } from "@/lib/after-login";

export type WizardService = { slug: string; name: string; category: string; description: string };
type Mode = "walkin" | "callback" | "doorstep" | "online";
type Slot = "morning" | "afternoon" | "evening";
type Contact = "whatsapp" | "phone" | "email";
type SavedAddress = { id: string; label: string; line1: string; line2: string | null; city: string; state: string; postalCode: string; isDefault: boolean };
type Draft = {
  step: number; serviceSlug: string; category: string; query: string;
  name: string; phone: string; contact: Contact; description: string;
  mode: Mode | ""; day: string; slot: Slot | ""; addressId: string; address: AddressValue;
  offerId: string; consent: boolean; coupon: string;
};
type Voucher = { code: string; emoji: string; names: Record<Locale, string>; used: boolean; live: boolean; personal: boolean; appliesTo?: { categories: string[]; services: string[] } | null };
type SessionUser = { name: string; role: string } | null;

const DRAFT_KEY = "nise-request-wizard";
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const QUICK_PICKS: Record<string, string[]> = {
  "government-services": ["New application", "Correction / update", "Check application status", "Which documents do I need?"],
  banking: ["Cash withdrawal (AEPS)", "Money transfer", "Open a bank account", "Balance enquiry"],
  insurance: ["Renew my policy", "New policy quote", "Compare plans", "Claim help"],
  education: ["Exam form", "Scholarship form", "Admission form", "Photo & signature resize"],
  "fee-payments": ["Electricity bill", "Mobile / DTH recharge", "School or college fee"],
  "form-filing": ["ITR filing help", "GST help", "Udyam registration", "Rent agreement"],
  "it-services": ["Printing / scanning", "Computer repair", "CCTV enquiry", "Website for my shop"],
  travel: ["Train ticket", "Bus ticket", "Flight ticket", "Hotel booking"],
  other: ["I’m not sure which service", "Documents check", "General question"],
};

function readDraft(): Partial<Draft> | null {
  try { const raw = window.sessionStorage.getItem(DRAFT_KEY); return raw ? JSON.parse(raw) as Partial<Draft> : null; } catch { return null; }
}
function saveDraft(draft: Draft) {
  try { window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* storage unavailable */ }
}
function clearDraft() {
  try { window.sessionStorage.removeItem(DRAFT_KEY); } catch { /* storage unavailable */ }
}

/** Next 7 open days (India time), skipping days the shop is closed when hours are configured. */
function upcomingDays(rules: OpeningHoursRule[]) {
  const codes = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
  const days: { iso: string; weekday: string; date: string; offset: number }[] = [];
  const nowIst = new Date(Date.now() + 5.5 * 3_600_000);
  for (let offset = 0; days.length < 7 && offset < 14; offset++) {
    const day = new Date(nowIst.getTime() + offset * 86_400_000);
    const code = codes[day.getUTCDay()];
    if (rules.length && !rules.some((rule) => rule.days.includes(code))) continue;
    days.push({ iso: day.toISOString().slice(0, 10), weekday: day.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" }), date: day.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }), offset });
  }
  return days;
}

function validPhone(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits);
}

const noop = () => () => undefined;

type Initial = { service?: string; category?: string; offer?: string; note?: string; coupon?: string; resume?: boolean };

/** Four-step request: service → details → visit → review. Renders only in the browser (it restores a saved draft). */
export default function RequestWizard(props: { services: WizardService[]; initial: Initial; hours: OpeningHoursRule[] }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const locale = useLocale();
  if (!mounted) return <div className="wizard-skeleton" aria-busy="true"><div className="container"><div className="skeleton skeleton--title"/><div className="skeleton skeleton--card"/></div></div>;
  return <Wizard {...props} locale={locale}/>;
}

function initialDraft(services: WizardService[], initial: Initial): Draft {
  const blank: Draft = { step: 0, serviceSlug: "", category: "all", query: "", name: "", phone: "", contact: "whatsapp", description: "", mode: "", day: "", slot: "", addressId: "", address: EMPTY_ADDRESS, offerId: "", consent: false, coupon: "" };
  const saved = readDraft();
  const coupon = (initial.coupon ?? "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40);
  const hasUrlChoice = Boolean(initial.service || initial.category || initial.offer || initial.note);
  if (saved && (initial.resume || !hasUrlChoice)) return { ...blank, ...saved, coupon: coupon || saved.coupon || "", address: { ...EMPTY_ADDRESS, ...(saved.address ?? {}) } };
  const service = services.find((item) => item.slug === initial.service);
  const category = service?.category ?? (categoryMeta.some((item) => item.slug === initial.category) ? initial.category! : "all");
  const offer = findOffer(initial.offer);
  return { ...blank, serviceSlug: service?.slug ?? "", category, description: initial.note?.slice(0, 300) ?? "", offerId: offer && isOfferLive(offer) ? offer.id : "", coupon, step: service ? 1 : 0 };
}

function Wizard({ services, initial, hours, locale }: { services: WizardService[]; initial: Initial; hours: OpeningHoursRule[]; locale: Locale }) {
  const router = useRouter();
  const t = dict(locale).wizard;
  const p = promoDict(locale);
  const liveCodes = useLiveCodes();
  const [applied, setApplied] = useState<AppliedCode | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [draft, setDraft] = useState<Draft>(() => initialDraft(services, initial));
  const [days] = useState(() => upcomingDays(hours));
  const [user, setUser] = useState<SessionUser | undefined>(undefined);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ reference: string; offerNote?: string; couponNote?: string; couponOk?: boolean; whatsappSent?: boolean; summary: string } | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const leadSent = useRef<string | null>(null);
  const draftRef = useRef<Draft | null>(null);
  const [restored, setRestored] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const cardTop = useRef<HTMLDivElement>(null);

  const service = services.find((item) => item.slug === draft.serviceSlug);
  const activeCategory = service?.category ?? (draft.serviceSlug === "other" && draft.category !== "all" ? draft.category : null);
  const chosenOffer = findOffer(draft.offerId);
  const offer = chosenOffer && isOfferLive(chosenOffer) && (!activeCategory || offerAppliesTo(chosenOffer, activeCategory))
    ? chosenOffer
    : activeCategory ? offersFor(activeCategory).find((item) => item.categories !== "all") : undefined;

  useEffect(() => { saveDraft(draft); draftRef.current = draft; }, [draft]);

  // Signed in: keep the half-filled request on the server too, so it's there next time.
  useEffect(() => {
    if (!user || user.role === "demo" || done) return;
    if (!draft.serviceSlug && !draft.name && !draft.description) return;
    const timer = window.setTimeout(() => {
      const { consent: _consent, ...rest } = draft;
      void _consent;
      void secureApi("D4r8F2kW6nQ1", { action: "save", draft: rest }).catch(() => undefined);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [draft, user, done]);

  useEffect(() => {
    let active = true;
    secureApi<{ user: SessionUser }>("C4w7G2hN6kP9").then(async (session) => {
      if (!active) return;
      setUser(session.user);
      if (!session.user || session.user.role === "demo") return;
      const [profile, saved, server] = await Promise.all([
        secureApi<{ user: { name: string; phone: string | null; preferredContact: Contact }; coupons?: Voucher[] }>("P8a2N5dK1vR7").catch(() => null),
        secureApi<{ addresses: SavedAddress[] }>("P3v8F1qL6sM4").catch(() => null),
        secureApi<{ draft: Partial<Draft> | null }>("D9k3W7pR2xN5").catch(() => null),
      ]);
      if (!active) return;
      // A half-filled request saved from another visit or device.
      const now = draftRef.current;
      const fresh = !now || (!now.serviceSlug && !now.description.trim());
      if (fresh && server?.draft && (server.draft.serviceSlug || server.draft.description)) {
        const back = server.draft;
        setDraft((current) => ({ ...current, ...back, consent: false, address: { ...EMPTY_ADDRESS, ...(back.address ?? {}) } }));
        setRestored(true);
      }
      if (profile?.coupons) setVouchers(profile.coupons);
      if (profile) setDraft((current) => ({ ...current, name: current.name || profile.user.name, phone: current.phone || (profile.user.phone ?? "").replace(/^\+91/, ""), contact: current.contact || profile.user.preferredContact }));
      if (saved) {
        setAddresses(saved.addresses);
        const preferred = saved.addresses.find((item) => item.isDefault) ?? saved.addresses[0];
        if (preferred) setDraft((current) => ({ ...current, addressId: current.addressId || preferred.id }));
      }
    }).catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, []);

  function update(patch: Partial<Draft>) { setError(""); setDraft((current) => ({ ...current, ...patch })); }
  function goTo(step: number) {
    setError(""); setShowErrors(false); setDraft((current) => ({ ...current, step }));
    requestAnimationFrame(() => cardTop.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function validate(step: number) {
    if (step === 0 && !draft.serviceSlug) return t.errChooseService;
    if (step === 1) {
      if (draft.name.trim().length < 2) return t.errName;
      if (!validPhone(draft.phone)) return t.errPhone;
      if (draft.description.trim().length < 8) return t.errDescribe;
      if (file && file.size > MAX_FILE_BYTES) return t.errFile;
    }
    if (step === 2) {
      if (!draft.mode) return t.errMode;
      if (draft.mode === "walkin" && !draft.day) return t.errDay;
      if (draft.mode === "doorstep" && !draft.addressId && addressProblem(draft.address)) return addressProblem(draft.address) || t.errAddress;
    }
    if (step === 3 && !draft.consent) return t.errConsent;
    return "";
  }

  /** As soon as we have a name and number, the shop gets a call-back (closed again when the request is sent). */
  function captureLead() {
    if (draft.name.trim().length < 2 || !validPhone(draft.phone)) return;
    const key = `${draft.phone.replace(/\D/g, "").slice(-10)}|${draft.serviceSlug}`;
    if (leadSent.current === key) return;
    leadSent.current = key;
    void secureApi("Q3n7B1xK5vR8", {
      name: draft.name.trim(), phone: draft.phone.trim(), topic: `Started a request: ${service?.name ?? "General enquiry"}`.slice(0, 120),
      message: draft.description.trim().slice(0, 800) || undefined, page: "/request", locale, source: "wizard",
    }).catch(() => undefined);
  }

  function next() {
    if (draft.step === 1) captureLead();
    const problem = validate(draft.step);
    if (problem) { setError(problem); setShowErrors(true); return; }
    goTo(Math.min(3, draft.step + 1));
  }

  async function submit() {
    for (let step = 0; step < 4; step++) { const problem = validate(step); if (problem) { setError(problem); if (step < 3) goTo(step); return; } }
    if (!user) {
      saveDraft({ ...draft, step: 3 });
      rememberReturn("/request?resume=1");
      router.push("/login");
      return;
    }
    if (user.role === "demo") { setError(t.demo); return; }
    setBusy(true); setError("");
    idempotencyKey.current ??= newIdempotencyKey();
    try {
      let fileId: string | undefined;
      if (file) fileId = (await secureUpload<{ file: { id: string } }>("U7b3R8mQ4zL1", file)).file.id;
      const saved = addresses.find((item) => item.id === draft.addressId);
      const result = await secureApi<{ request: { reference: string }; whatsappSent?: boolean; offer?: { applied: boolean; reason?: string }; coupon?: { applied: boolean; code?: string; reason?: string } }>("S5w2J9nF3kL7", {
        serviceSlug: draft.serviceSlug,
        description: draft.description.trim(),
        preferredContact: draft.contact,
        contactName: draft.name.trim(),
        contactPhone: draft.phone.trim(),
        visit: {
          mode: draft.mode,
          ...(draft.mode === "walkin" ? { day: draft.day, slot: draft.slot || undefined } : {}),
          ...(draft.mode === "doorstep" ? saved ? { addressId: saved.id } : { address: formatAddress(draft.address), latitude: draft.address.latitude ?? undefined, longitude: draft.address.longitude ?? undefined } : {}),
        },
        ...(draft.serviceSlug === "other" && draft.category !== "all" ? { category: draft.category } : {}),
        ...(offer ? { offerId: offer.id } : {}),
        ...(draft.coupon ? { couponCode: draft.coupon } : {}),
        fileId,
        idempotencyKey: idempotencyKey.current,
      });
      clearDraft();
      void secureApi("D4r8F2kW6nQ1", { action: "clear" }).catch(() => undefined);
      setDone({
        whatsappSent: Boolean(result.whatsappSent),
        summary: [`Service: ${service?.name ?? t.somethingElse}`, `Name: ${draft.name.trim()}`, `Mobile: +91 ${draft.phone.trim()}`, `Need: ${draft.description.trim()}`, `Visit: ${visitSummary}`].join("\n"),
        reference: result.request.reference, offerNote: result.offer && !result.offer.applied ? result.offer.reason : undefined,
        couponOk: Boolean(result.coupon?.applied), couponNote: result.coupon ? result.coupon.applied ? fill(p.promoAppliedDone, { code: result.coupon.code ?? draft.coupon }) : `${p.promoNotApplied} ${result.coupon.reason ?? ""}` : undefined,
      });
      setApplied(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (reason) {
      if (reason instanceof SecureApiError && reason.status === 401) { saveDraft({ ...draft, step: 3 }); rememberReturn("/request?resume=1"); router.push("/login"); return; }
      setError(reason instanceof Error ? reason.message : "Could not send your request.");
    } finally { setBusy(false); }
  }

  const whatsappText = `Hi NISE COMPORT, I need help with ${service?.name ?? "a service"}.`;

  if (done) {
    const share = `Hi NISE COMPORT, I just sent a request online.\nReference: ${done.reference}\n${done.summary}`;
    return <div className="wizard wizard--done"><div className="container">
      <div className="success-card">
        <div className="confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ left: `${(index * 53) % 100}%`, animationDelay: `${(index % 6) * 0.12}s` }}/>)}</div>
        <span className="success-card__icon"><PartyPopper size={34}/></span>
        <h1>{t.successTitle}</h1>
        <p>{t.successSub}</p>
        <strong className="success-card__ref">{done.reference}</strong>
        <p>{t.successNext}</p>
        <p className="muted">{done.whatsappSent ? "We’ve also sent a copy to your WhatsApp." : "Tap “" + t.shareWa + "” to keep a copy in your WhatsApp chat with us."}</p>
        {done.offerNote && <p className="alert alert--info">{t.offerNotApplied} {done.offerNote}</p>}
        {done.couponNote && <p className={done.couponOk ? "alert alert--success" : "alert alert--info"}>{done.couponNote}</p>}
        <div className="success-card__actions">
          <Link className="btn btn--primary btn--lg" href="/profile#requests">{t.track}<ArrowRight size={18}/></Link>
          <a className="btn btn--wa btn--lg" href={whatsappHref(share)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18}/>{t.shareWa}</a>
          <button type="button" className="btn btn--ghost" onClick={() => { setDone(null); idempotencyKey.current = null; setFile(null); setDraft(initialDraft(services, {})); }}>{t.another}</button>
        </div>
      </div>
    </div></div>;
  }

  const filtered = services.filter((item) => {
    if (draft.category !== "all" && item.category !== draft.category) return false;
    const words = draft.query.toLowerCase().split(/\s+/).filter(Boolean);
    return words.every((word) => `${item.name} ${item.description}`.toLowerCase().includes(word));
  });
  const savedAddress = addresses.find((item) => item.id === draft.addressId);
  const modeCards: { id: Mode; icon: typeof Store; title: string; sub: string }[] = [
    { id: "walkin", icon: Store, title: t.walkin, sub: t.walkinSub },
    { id: "callback", icon: Headphones, title: t.callback, sub: t.callbackSub },
    { id: "doorstep", icon: House, title: t.doorstep, sub: t.doorstepSub },
    { id: "online", icon: Laptop, title: t.online, sub: t.onlineSub },
  ];
  const slotLabel = (slot: Slot | "") => slot ? t[slot] : "";
  const dayLabel = (iso: string) => { const day = days.find((item) => item.iso === iso); return day ? day.offset === 0 ? t.today : day.offset === 1 ? t.tomorrow : `${day.weekday}, ${day.date}` : iso; };
  const visitSummary = draft.mode === "walkin" ? `${t.walkin} · ${dayLabel(draft.day)}${draft.slot ? ` · ${slotLabel(draft.slot)}` : ""}` : draft.mode === "doorstep" ? `${t.doorstep} · ${savedAddress ? `${savedAddress.line1}, ${savedAddress.city}` : formatAddress(draft.address)}` : draft.mode === "callback" ? t.callback : draft.mode === "online" ? t.online : "";
  // Only suggest codes that work on the chosen service.
  const fitsService = (scope?: { categories: string[]; services: string[] } | null) => !draft.serviceSlug || scopeAllows(scope, { service: draft.serviceSlug, category: service?.category ?? null });
  const suggestions: CodeSuggestion[] = [
    ...vouchers.filter((item) => item.personal && item.live && !item.used && fitsService(item.appliesTo)).map((item) => ({ code: item.code, emoji: item.emoji, label: item.names[locale] ?? item.code, personal: true })),
    ...[...liveCodes].sort((a, b) => Number(Boolean(activeCategory && b.categories !== "all" && b.categories.includes(activeCategory))) - Number(Boolean(activeCategory && a.categories !== "all" && a.categories.includes(activeCategory))))
      .filter((item) => item.code && fitsService(item.appliesTo) && !vouchers.some((voucher) => voucher.code === item.code && voucher.used))
      .map((item) => ({ code: item.code!, emoji: item.emoji, label: item.title[locale] })),
  ];
  const nameBad = showErrors && draft.step === 1 && draft.name.trim().length < 2;
  const phoneBad = showErrors && draft.step === 1 && !validPhone(draft.phone);
  const describeBad = showErrors && draft.step === 1 && draft.description.trim().length < 8;
  const picks = QUICK_PICKS[service?.category ?? (draft.serviceSlug === "other" ? "other" : draft.category)] ?? QUICK_PICKS.other;

  return <WizardFrame
    kicker="4 quick steps · takes about 2 minutes"
    title={<>Start your request, <span className="grad-text">we’ll handle the rest.</span></>}
    lead="Tell us what you need. We confirm documents, fees and timing before any work begins."
    steps={t.steps} current={draft.step} onJump={goTo} locale={locale}
    strip={<OfferStrip category={activeCategory} locale={locale}/>}
    rail={<OfferRail category={activeCategory} locale={locale} whatsappText={whatsappText} appliedOfferId={offer?.id} appliedCode={applied?.code ?? (draft.coupon || null)}/>}
  >
    <div ref={cardTop} className="wizard__anchor"/>
    {restored && <p className="alert alert--info wizard-restored">We kept your unfinished request from last time. <button type="button" className="text-link" onClick={() => { setRestored(false); clearDraft(); void secureApi("D4r8F2kW6nQ1", { action: "clear" }).catch(() => undefined); setDraft(initialDraft(services, {})); }}>Start fresh</button></p>}
    <form className="wizard-form" noValidate onSubmit={(event) => { event.preventDefault(); if (draft.step === 3) void submit(); else next(); }}>
      {draft.step === 0 && <section>
        <h2>{t.s1Title}</h2><p className="wizard-form__sub">{t.s1Sub}</p>
        <label className="input-wrap input-wrap--lg"><Search size={20} aria-hidden="true"/><span className="sr-only">{t.search}</span><input type="search" value={draft.query} onChange={(event) => update({ query: event.target.value })} placeholder={t.search}/></label>
        <div className="chip-row" role="group" aria-label="Categories">
          <button type="button" className={draft.category === "all" ? "chip-btn is-active" : "chip-btn"} onClick={() => update({ category: "all" })}>{t.allCategories}</button>
          {categoryMeta.map((meta) => <button key={meta.slug} type="button" className={`chip-btn tone-${meta.tone}${draft.category === meta.slug ? " is-active" : ""}`} onClick={() => update({ category: meta.slug })}><CategoryIcon icon={meta.icon} size={16}/>{meta.short[locale]}</button>)}
        </div>
        <div className="choice-grid" role="radiogroup" aria-label={t.s1Title}>
          {filtered.map((item) => {
            const meta = categoryMetaFor(item.category);
            const selected = draft.serviceSlug === item.slug;
            return <button type="button" role="radio" aria-checked={selected} key={item.slug} className={`choice tone-${meta?.tone ?? "blue"}${selected ? " is-selected" : ""}`} onClick={() => update({ serviceSlug: item.slug })}>
              <span className="choice__icon">{meta && <CategoryIcon icon={meta.icon} size={20}/>}</span>
              <span className="choice__text"><b>{item.name}</b><small>{meta?.short[locale]}</small></span>
              <span className="choice__check" aria-hidden="true">{selected && <Check size={16}/>}</span>
            </button>;
          })}
          <button type="button" role="radio" aria-checked={draft.serviceSlug === "other"} className={`choice choice--other${draft.serviceSlug === "other" ? " is-selected" : ""}`} onClick={() => update({ serviceSlug: "other" })}>
            <span className="choice__icon"><FileText size={20}/></span><span className="choice__text"><b>{t.somethingElse}</b><small>{t.somethingElseSub}</small></span><span className="choice__check" aria-hidden="true">{draft.serviceSlug === "other" && <Check size={16}/>}</span>
          </button>
        </div>
        {draft.serviceSlug === "pan-card" && <div className="callout"><b>PAN has a dedicated guided form.</b><span>It collects exactly what the PAN process needs.</span><Link className="btn btn--sm btn--primary" href="/pan/request">Open PAN form <ArrowRight size={16}/></Link></div>}
        {draft.serviceSlug === "printing-scanning" && <div className="callout"><b>Printing has its own flow.</b><span>Upload your file, pick pages and see the estimate.</span><Link className="btn btn--sm btn--primary" href="/print">Open print flow <ArrowRight size={16}/></Link></div>}
      </section>}

      {draft.step === 1 && <section>
        <h2>{t.s2Title}</h2><p className="wizard-form__sub">{t.s2Sub}</p>
        {service && <div className="picked"><span>{service.name}</span><button type="button" onClick={() => goTo(0)}>{t.edit}</button></div>}
        <div className="form-grid">
          <label className="field"><span className="field__label">{t.name}</span><input value={draft.name} onChange={(event) => update({ name: event.target.value.replace(/[^\p{L}\p{M}\s.'-]/gu, "") })} onBlur={captureLead} autoComplete="name" maxLength={100} required aria-invalid={nameBad}/>{nameBad && <span className="field__error">{t.errName}</span>}</label>
          <label className="field"><span className="field__label">{t.phone}</span><span className="input-wrap"><span className="input-prefix">+91</span><input value={draft.phone} onChange={(event) => update({ phone: event.target.value.replace(/[^\d\s+-]/g, "").slice(0, 16) })} inputMode="tel" autoComplete="tel-national" placeholder="98765 43210" required onBlur={captureLead} aria-invalid={phoneBad}/></span>{phoneBad ? <span className="field__error">{t.errPhone}</span> : <span className="field__hint">{t.phoneHint}</span>}</label>
        </div>
        <fieldset className="field"><legend className="field__label">{t.contactVia}</legend><div className="seg">
          {(["whatsapp", "phone", "email"] as Contact[]).map((option) => <button key={option} type="button" className={draft.contact === option ? "is-active" : undefined} aria-pressed={draft.contact === option} onClick={() => update({ contact: option })}>{option === "whatsapp" ? <WhatsAppIcon size={16}/> : null}{option === "whatsapp" ? t.viaWhatsapp : option === "phone" ? t.viaPhone : t.viaEmail}</button>)}
        </div></fieldset>
        <label className="field"><span className="field__label">{t.describe}</span><textarea value={draft.description} onChange={(event) => update({ description: event.target.value.slice(0, 1500) })} rows={4} maxLength={1500} required aria-invalid={describeBad}/>{describeBad && <span className="field__error">{t.errDescribe}</span>}<span className="field__hint">{t.describeHint} · {draft.description.length}/1500</span></label>
        <div className="quick-picks"><span>{t.quickPicks}</span>{picks.map((pick) => <button key={pick} type="button" className="chip-btn chip-btn--sm" onClick={() => update({ description: draft.description.includes(pick) ? draft.description : `${draft.description ? `${draft.description.trim()} ` : ""}${pick}.`.slice(0, 1500) })}>+ {pick}</button>)}</div>
        <div className="field"><span className="field__label">{t.attach}</span>
          {user ? file ? <div className="file-pill"><FileText size={18}/><span>{file.name}<small>{(file.size / 1024 / 1024).toFixed(1)} MB</small></span><button type="button" className="icon-btn" onClick={() => { setFile(null); idempotencyKey.current = null; }} aria-label={t.remove}><X size={16}/></button></div>
            : <label className="dropzone"><Upload size={22}/><b>{t.attach}</b><small>{t.attachHint}</small><input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf" onChange={(event) => { setFile(event.target.files?.[0] ?? null); idempotencyKey.current = null; }}/></label>
            : <p className="field__hint">{t.attachLater}</p>}
        </div>
      </section>}

      {draft.step === 2 && <section>
        <h2>{t.s3Title}</h2><p className="wizard-form__sub">{t.s3Sub}</p>
        <div className="mode-grid" role="radiogroup" aria-label={t.s3Title}>{modeCards.map(({ id, icon: Icon, title, sub }) => <button key={id} type="button" role="radio" aria-checked={draft.mode === id} className={draft.mode === id ? "mode is-selected" : "mode"} onClick={() => update({ mode: id })}><span className="mode__icon"><Icon size={22}/></span><b>{title}</b><small>{sub}</small></button>)}</div>
        {draft.mode === "walkin" && <div className="slot-picker">
          <span className="field__label">{t.day}</span>
          <div className="day-row">{days.map((day) => <button key={day.iso} type="button" className={draft.day === day.iso ? "day is-active" : "day"} onClick={() => update({ day: day.iso })}><small>{day.offset === 0 ? t.today : day.offset === 1 ? t.tomorrow : day.weekday}</small><b>{day.date}</b></button>)}</div>
          <span className="field__label">{t.slot}</span>
          <div className="seg">{(["morning", "afternoon", "evening"] as Slot[]).map((slot) => <button key={slot} type="button" className={draft.slot === slot ? "is-active" : undefined} aria-pressed={draft.slot === slot} onClick={() => update({ slot })}>{t[slot]}</button>)}</div>
        </div>}
        {draft.mode === "doorstep" && <div className="field">
          <span className="field__label">{t.address}</span>
          {addresses.length > 0 && <div className="saved-addresses">{addresses.map((item) => <button key={item.id} type="button" className={draft.addressId === item.id ? "saved-address is-selected" : "saved-address"} onClick={() => update({ addressId: item.id })}><MapPin size={18}/><span><b>{item.label}</b><small>{item.line1}, {item.city} {item.postalCode}</small></span></button>)}<button type="button" className={!draft.addressId ? "saved-address is-selected" : "saved-address"} onClick={() => update({ addressId: "" })}><MapPin size={18}/><span><b>New address</b><small>Search or use location</small></span></button></div>}
          {!draft.addressId && <AddressPicker value={draft.address} onChange={(address) => update({ address })}/>}
        </div>}
      </section>}

      {draft.step === 3 && <section>
        <h2>{t.s4Title}</h2><p className="wizard-form__sub">{t.s4Sub}</p>
        <dl className="summary">
          <div><dt>{t.summaryService}</dt><dd>{service?.name ?? t.somethingElse}</dd><button type="button" onClick={() => goTo(0)}>{t.edit}</button></div>
          <div><dt>{t.summaryContact}</dt><dd>{draft.name} · +91 {draft.phone} · {draft.contact === "whatsapp" ? t.viaWhatsapp : draft.contact === "phone" ? t.viaPhone : t.viaEmail}</dd><button type="button" onClick={() => goTo(1)}>{t.edit}</button></div>
          <div><dt>{t.summaryNote}</dt><dd>{draft.description}</dd><button type="button" onClick={() => goTo(1)}>{t.edit}</button></div>
          {file && <div><dt>{t.summaryFile}</dt><dd>{file.name}</dd><button type="button" onClick={() => goTo(1)}>{t.edit}</button></div>}
          <div><dt>{t.summaryVisit}</dt><dd>{visitSummary}</dd><button type="button" onClick={() => goTo(2)}>{t.edit}</button></div>
        </dl>
        {offer && <div className={`applied-offer tone-${offer.tone}`}><span className="badge badge--live"><i/>{dict(locale).ticker.live}</span><div><b>{offer.highlight[locale]} · {offer.title[locale]}</b><small>{t.offerApplied}. {offer.firstTimeOnly ? t.offerCheck : ""}</small></div></div>}
        <PromoCodeField locale={locale} value={draft.coupon} applied={applied} signedIn={Boolean(user && user.role !== "demo")} suggestions={suggestions} service={draft.serviceSlug || undefined}
          onChange={(coupon) => update({ coupon })} onApplied={setApplied}/>
        <label className="check check--agree"><input type="checkbox" checked={draft.consent} onChange={(event) => update({ consent: event.target.checked })}/><span>{t.consent} <Link href="/terms" target="_blank">Terms</Link> · <Link href="/privacy" target="_blank">Privacy</Link></span></label>
        {user === null && <p className="alert alert--info">{t.signInNote}</p>}
      </section>}

      {error && <div className="alert alert--error" role="alert">{error}</div>}
      <WizardActions locale={locale} onBack={draft.step > 0 ? () => goTo(draft.step - 1) : undefined} nextLabel={draft.step === 3 ? user === null ? t.signInToSend : t.submit : t.next} busy={busy}/>
    </form>
  </WizardFrame>;
}
