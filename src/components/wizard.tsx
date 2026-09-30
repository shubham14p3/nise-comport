"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import OfferCard from "@/components/offer-card";
import { WhatsAppIcon } from "@/components/icons";
import { dict, fill, type Locale } from "@/lib/i18n";
import { offerAppliesTo, offersFor } from "@/lib/offers";
import { whatsappHref } from "@/lib/public-contact";

/** Progress header: numbered steps with a filling bar. Completed steps can be revisited. */
export function WizardSteps({ steps, current, onJump, locale }: { steps: string[]; current: number; onJump?: (index: number) => void; locale: Locale }) {
  const t = dict(locale).wizard;
  return <div className="wizard-steps">
    <div className="wizard-steps__label"><span>{fill(t.stepOf, { n: current + 1, total: steps.length })}</span><b>{steps[current]}</b></div>
    <div className="wizard-steps__bar" aria-hidden="true"><i style={{ width: `${((current + 1) / steps.length) * 100}%` }}/></div>
    <ol className="wizard-steps__list">{steps.map((label, index) => {
      const state = index < current ? "is-done" : index === current ? "is-current" : "";
      return <li key={label} className={state}>
        <button type="button" disabled={index >= current || !onJump} onClick={() => onJump?.(index)} aria-current={index === current ? "step" : undefined}>
          <span className="wizard-steps__dot">{index < current ? <Check size={14}/> : index + 1}</span><span className="wizard-steps__text">{label}</span>
        </button>
      </li>;
    })}</ol>
  </div>;
}

/** Side rail with blinking live offers for the chosen category, a help card and trust points. */
export function OfferRail({ category, locale, whatsappText, appliedOfferId, before }: { category?: string | null; locale: Locale; whatsappText: string; appliedOfferId?: string | null; before?: ReactNode }) {
  const t = dict(locale).rail;
  const offers = offersFor(category).slice(0, 3);
  return <aside className="rail" aria-label={t.live}>
    {before}
    {offers.length > 0 && <div className="rail__offers">
      <div className="rail__title"><span className="badge badge--live"><i/>{dict(locale).ticker.live}</span><b>{t.live}</b></div>
      {offers.map((offer) => <OfferCard key={offer.id} offer={offer} locale={locale} variant="rail" applies={offer.id === appliedOfferId || Boolean(category && offer.categories !== "all" && offerAppliesTo(offer, category))}/>)}
    </div>}
    <div className="rail__help">
      <Sparkles size={20}/>
      <b>{t.helpTitle}</b>
      <p>{t.helpSub}</p>
      <a className="btn btn--wa btn--sm btn--block" href={whatsappHref(whatsappText)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={17}/>{t.helpCta}</a>
    </div>
    <ul className="rail__trust">{t.trust.map((item) => <li key={item}><ShieldCheck size={16}/>{item}</li>)}</ul>
  </aside>;
}

/** Compact, horizontally scrolling offer strip shown above the form on phones. */
export function OfferStrip({ category, locale }: { category?: string | null; locale: Locale }) {
  const offers = offersFor(category).slice(0, 3);
  if (!offers.length) return null;
  return <div className="offer-strip" aria-label={dict(locale).rail.live}>
    {offers.map((offer) => <Link key={offer.id} href={offer.href} className={`offer-strip__item tone-${offer.tone}`}><span className="badge badge--live"><i/>{offer.badge === "LIVE" ? dict(locale).ticker.live : offer.badge}</span><b>{offer.highlight[locale]}</b><span>{offer.title[locale]}</span></Link>)}
  </div>;
}

/** Back / Continue bar; sticks to the bottom of the screen on phones. */
export function WizardActions({ locale, onBack, onNext, nextLabel, busy, nextDisabled, hideBack }: { locale: Locale; onBack?: () => void; onNext?: () => void; nextLabel?: string; busy?: boolean; nextDisabled?: boolean; hideBack?: boolean }) {
  const t = dict(locale).wizard;
  return <div className="wizard-actions">
    {!hideBack && onBack ? <button type="button" className="btn btn--ghost" onClick={onBack} disabled={busy}><ArrowLeft size={18}/>{t.back}</button> : <span/>}
    <button type={onNext ? "button" : "submit"} className="btn btn--primary btn--lg" onClick={onNext} disabled={busy || nextDisabled}>{busy ? t.sending : nextLabel ?? t.next}{!busy && <ArrowRight size={18}/>}</button>
  </div>;
}

/** Page frame for a step flow: heading, progress, the step card and the offer rail. */
export function WizardFrame({ kicker, title, lead, steps, current, onJump, locale, rail, strip, children }: {
  kicker: string; title: ReactNode; lead: string; steps: string[]; current: number; onJump?: (index: number) => void; locale: Locale; rail: ReactNode; strip?: ReactNode; children: ReactNode;
}) {
  return <div className="wizard">
    <div className="wizard__hero">
      <div className="page-hero__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/></div>
      <div className="container">
        <span className="pill pill--glass"><i className="live-dot"/>{kicker}</span>
        <h1>{title}</h1>
        <p>{lead}</p>
      </div>
    </div>
    <div className="container wizard__layout">
      <div className="wizard__main">
        <WizardSteps steps={steps} current={current} onJump={onJump} locale={locale}/>
        {strip}
        <div className="wizard__card" key={current}>{children}</div>
      </div>
      {rail}
    </div>
  </div>;
}
