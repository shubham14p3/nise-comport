import Link from "next/link";
import { ArrowRight, CalendarPlus, CalendarDays, Clock3, TriangleAlert } from "lucide-react";
import CopyCode from "@/components/copy-code";
import { daysBetween } from "@/lib/festivals";
import type { Locale } from "@/lib/i18n";
import { fill } from "@/lib/i18n";
import { promoDict, shortDate } from "@/lib/promo-i18n";
import { posterFor } from "@/lib/poster-library";
import { googleCalendarLink, promoText, THEME_TONE, type PromoView } from "@/lib/promo-view";

/** "3 days left", "Last day today!" or "Unlocks 9 Oct". */
export function promoTiming(view: Pick<PromoView, "startsOn" | "endsOn">, today: string, locale: Locale) {
  const t = promoDict(locale);
  if (today < view.startsOn) return { live: false, label: fill(t.unlocks, { date: shortDate(view.startsOn, locale) }), urgent: false };
  const left = daysBetween(today, view.endsOn) + 1;
  return { live: true, label: left <= 1 ? t.lastDay : fill(t.daysLeft, { n: left }), urgent: left <= 3 };
}

/** When the festival or the matches are. */
export function promoWhen(view: PromoView, locale: Locale) {
  const t = promoDict(locale);
  if (!view.eventStarts) return "";
  if (view.kind === "sport" && view.eventEnds && view.eventEnds !== view.eventStarts) {
    const sameYear = view.eventStarts.slice(0, 4) === view.eventEnds.slice(0, 4);
    return fill(t.matches, { from: shortDate(view.eventStarts, locale, !sameYear), to: shortDate(view.eventEnds, locale, true) });
  }
  return fill(t.festivalOn, { date: shortDate(view.eventStarts, locale, true) });
}

/**
 * Festival / sports promo as a themed ticket: big emoji art, ₹50 OFF, the code with a copy
 * button, the countdown and "Add to Google Calendar".
 */
export default function PromoCard({ view, locale, today, siteUrl, variant = "full" }: { view: PromoView; locale: Locale; today: string; siteUrl: string; variant?: "full" | "compact" }) {
  const t = promoDict(locale);
  const text = promoText(view, locale);
  const timing = promoTiming(view, today, locale);
  const when = promoWhen(view, locale);
  const poster = posterFor(view.posters, locale);
  return <article className={`promo-card promo-card--${variant} theme-${view.theme} tone-${THEME_TONE[view.theme] ?? "pink"}${timing.live ? " is-live" : ""}`} id={view.code}>
    {poster ? <a className="promo-card__poster" href={poster} target="_blank" rel="noopener noreferrer" aria-label={`${text.name}: poster`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- owner-uploaded poster, shown as-is */}
      <img src={poster} alt="" loading="lazy"/>
      <span className="promo-card__amount">{text.highlight}</span>
    </a> : <div className="promo-card__art" aria-hidden="true">
      <span className="promo-card__emoji">{view.emoji}</span>
      <i className="promo-card__orb promo-card__orb--1"/><i className="promo-card__orb promo-card__orb--2"/>
      <span className="promo-card__amount">{text.highlight}</span>
    </div>}
    <div className="promo-card__body">
      <div className="promo-card__top">
        {timing.live ? <span className="badge badge--live"><i/>{t.live}</span> : <span className="badge badge--soft">{timing.label}</span>}
        {timing.live && <span className={`promo-card__countdown${timing.urgent ? " is-urgent" : ""}`}><Clock3 size={14} aria-hidden="true"/>{timing.label}</span>}
      </div>
      <h3>{text.name}</h3>
      {text.blurb && variant === "full" && <p className="promo-card__blurb">{text.blurb}</p>}
      {when && <p className="promo-card__when"><CalendarDays size={15} aria-hidden="true"/>{when}{view.tentative && <span className="promo-card__tbc"><TriangleAlert size={13} aria-hidden="true"/>{t.tentative}</span>}</p>}
      <div className="promo-card__code">
        <span className="promo-card__code-label">{t.code}</span>
        <b>{view.code}</b>
        <CopyCode text={view.code} locale={locale} className="copy-btn copy-btn--sm"/>
      </div>
      <p className="promo-card__meta">{fill(t.minOrder, { min: view.minimum })} · {t.oneUse} · {fill(t.validTill, { date: shortDate(view.endsOn, locale) })}</p>
      <div className="promo-card__actions">
        {timing.live && <Link className="btn btn--primary btn--sm" href={`/request?coupon=${encodeURIComponent(view.code)}`}>{t.useNow}<ArrowRight size={16}/></Link>}
        <a className="btn btn--ghost btn--sm" href={googleCalendarLink(view, { siteUrl, locale })} target="_blank" rel="noopener noreferrer" aria-label={`${t.addToCalendar}: ${text.name}`} title={t.addToCalendar}><CalendarPlus size={16}/>{t.calendarShort}</a>
      </div>
    </div>
  </article>;
}
