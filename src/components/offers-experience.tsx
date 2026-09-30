"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, CalendarCheck2, CalendarPlus, Download, FileSpreadsheet, Gift, ShieldCheck, Sparkles, TicketCheck, TriangleAlert } from "lucide-react";
import CopyCode from "@/components/copy-code";
import OfferCard from "@/components/offer-card";
import PromoCard, { promoTiming } from "@/components/promo-card";
import { COMMUNITY_LABELS, todayIst, type Community } from "@/lib/festivals";
import { dict, fill } from "@/lib/i18n";
import { liveOffers } from "@/lib/offers";
import { monthLabel, promoDict, shortDate } from "@/lib/promo-i18n";
import { googleCalendarLink, googleSubscribeLink, isPromoLive, promoText, type PromoView } from "@/lib/promo-view";
import { useLocale } from "@/lib/use-locale";

type Filter = "all" | "festival" | "sport" | Community;

const FILTER_ORDER: Community[] = ["hindu", "bengali", "punjabi", "christian", "muslim", "jharkhand", "jain-buddhist", "regional", "national"];
const PREVIEW_ROWS = 36;

/**
 * /offers: live codes, the offer calendar to December 2028 with community filters, the ₹50
 * welcome coupon and "take it with you" exports (Google Calendar, Google Sheets, .ics, CSV).
 * Text follows the visitor's chosen language.
 */
export default function OffersExperience({ views, siteUrl, crumbs }: { views: PromoView[]; siteUrl: string; crumbs?: ReactNode }) {
  const locale = useLocale();
  const t = promoDict(locale);
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState(false);
  const today = todayIst();

  const live = useMemo(() => views.filter((view) => isPromoLive(view)).sort((a, b) => a.endsOn.localeCompare(b.endsOn) || a.code.localeCompare(b.code)), [views]);
  const upcoming = views.filter((view) => view.endsOn >= today);
  const brandOffers = liveOffers().filter((offer) => offer.kind !== "welcome");
  const filtered = upcoming.filter((view) => filter === "all" || view.kind === filter || view.communities.includes(filter));
  const shown = expanded ? filtered : filtered.slice(0, PREVIEW_ROWS);
  const months = groupByMonth(shown);
  // The last code starts in December 2028 (New Year 2029's code runs through December).
  const lastYear = upcoming.at(-1)?.startsOn.slice(0, 4) ?? "2028";
  const available = new Set(upcoming.flatMap((view) => view.communities));
  const langQuery = locale === "en" ? "" : `?lang=${locale}`;
  const feedUrl = `${siteUrl}/offers/calendar.ics${langQuery}`;
  const csvUrl = `${siteUrl}/offers/offers.csv${langQuery}`;
  const formula = `=IMPORTDATA("${csvUrl}")`;
  const withDownload = (url: string) => `${url}${url.includes("?") ? "&" : "?"}download=1`;

  return <>
    <section className="page-hero page-hero--offers">
      <div className="page-hero__bg" aria-hidden="true"><span className="blob blob--1"/><span className="blob blob--2"/><span className="blob blob--3"/></div>
      <div className="offers-hero__confetti" aria-hidden="true">{["🪔", "🏏", "🎨", "🎄", "🌙", "🪁", "🏅", "🌺", "🥁", "🏑"].map((emoji, index) => <span key={emoji} style={{ left: `${6 + index * 9.2}%`, animationDelay: `${index * 0.45}s` }}>{emoji}</span>)}</div>
      <div className="container offers-hero">
        <div>
          {crumbs}
          <span className="pill pill--glass"><i className="live-dot"/>{t.kicker}</span>
          <h1>{t.heroA} <span className="grad-text grad-text--warm">{t.heroB}</span></h1>
          <p className="page-hero__lead">{t.heroLead}</p>
          <div className="offers-stats">
            <div><b>{live.length}</b><span>{t.statLive}</span></div>
            <div><b>{upcoming.length}</b><span>{t.statAhead}</span></div>
            <div><b>{lastYear}</b><span>{t.statTill}</span></div>
          </div>
        </div>
        <aside className="welcome-ticket" aria-label={t.welcomeTitle}>
          <span className="welcome-ticket__kicker"><Gift size={16}/>{t.welcomeKicker}</span>
          <strong>{t.welcomeTitle}</strong>
          <p>{t.welcomeText}</p>
          <div className="welcome-ticket__actions">
            <Link className="btn btn--light" href="/signup">{t.welcomeCta}<ArrowRight size={17}/></Link>
            <Link className="btn btn--glass btn--sm" href="/profile#vouchers">{t.welcomeHave}</Link>
          </div>
        </aside>
      </div>
    </section>

    <section className="section section--flush offers-live" id="live">
      <div className="container">
        <div className="section-head section-head--left"><span className="badge badge--live"><i/>{t.live}</span><h2>{t.liveTitle}</h2><p>{t.liveSub}</p></div>
        {live.length ? <div className="promo-grid">{live.map((view) => <PromoCard key={view.code} view={view} locale={locale} today={today} siteUrl={siteUrl}/>)}</div>
          : <div className="empty-state"><span className="empty-state__icon"><Sparkles size={24}/></span><h3>{t.noVouchers}</h3><p>{t.noVouchersText}</p></div>}
        <p className="offers-rules"><ShieldCheck size={16}/>{t.rules}</p>
      </div>
    </section>

    <section className="section offers-calendar" id="calendar">
      <div className="container">
        <div className="section-head section-head--left"><span className="eyebrow"><CalendarCheck2 size={15}/> {shortDate(today, locale, true)} – {monthLabel(`${lastYear}-12-01`, locale)}</span><h2>{t.calendarTitle}</h2><p>{t.calendarSub}</p></div>
        <div className="chip-row chip-row--scroll" role="group" aria-label={t.calendarTitle}>
          {(["all", "festival", "sport"] as Filter[]).map((id) => <button key={id} type="button" className={filter === id ? "chip-btn is-active" : "chip-btn"} aria-pressed={filter === id} onClick={() => { setFilter(id); setExpanded(false); }}>{id === "all" ? t.all : id === "festival" ? t.festivals : t.sports}</button>)}
          {FILTER_ORDER.filter((community) => available.has(community)).map((community) => <button key={community} type="button" className={filter === community ? "chip-btn is-active" : "chip-btn"} aria-pressed={filter === community} onClick={() => { setFilter(community); setExpanded(false); }}>{COMMUNITY_LABELS[community][locale]}</button>)}
        </div>
        {months.length ? <div className="cal-months">{months.map(([month, items]) => <div className="cal-month" key={month}>
          <h3 className="cal-month__title">{monthLabel(month, locale)}</h3>
          <ol className="cal-list">{items.map((view) => {
            const timing = promoTiming(view, today, locale);
            const date = view.eventStarts ?? view.startsOn;
            const text = promoText(view, locale);
            return <li key={view.code} className={`cal-item theme-${view.theme}${timing.live ? " is-live" : ""}`}>
              <span className="cal-item__date"><b>{Number(date.slice(8, 10))}</b><small>{shortDate(date, locale).replace(/^\d+\s*/, "")}</small></span>
              <span className="cal-item__emoji" aria-hidden="true">{view.emoji}</span>
              <span className="cal-item__main">
                <b>{text.name}</b>
                <small>{view.kind === "sport" && view.eventEnds && view.eventEnds !== date ? `${shortDate(date, locale)} – ${shortDate(view.eventEnds, locale, true)} · ` : ""}{timing.live ? <em className="cal-item__live">{t.live} · {timing.label}</em> : timing.label}{view.tentative && <em className="cal-item__tbc"><TriangleAlert size={12}/>{t.tentative}</em>}</small>
              </span>
              <span className="cal-item__code">{view.code}</span>
              <a className="icon-btn cal-item__gcal" href={googleCalendarLink(view, { siteUrl, locale })} target="_blank" rel="noopener noreferrer" aria-label={`${t.addToCalendar}: ${text.name}`} title={t.addToCalendar}><CalendarPlus size={17}/></a>
            </li>;
          })}</ol>
        </div>)}</div> : <p className="admin-empty">{t.empty}</p>}
        {!expanded && filtered.length > PREVIEW_ROWS && <div className="section-foot"><button type="button" className="btn btn--ghost" onClick={() => setExpanded(true)}>{fill(t.showMore, { n: filtered.length })}</button></div>}
      </div>
    </section>

    <section className="section section--flush" id="export">
      <div className="container">
        <div className="section-head section-head--left"><span className="eyebrow"><Download size={15}/> Google</span><h2>{t.exportTitle}</h2><p>{t.exportSub}</p></div>
        <div className="export-grid">
          <article className="export-card export-card--cal">
            <span className="export-card__icon"><CalendarPlus size={24}/></span>
            <h3>{t.gcalTitle}</h3><p>{t.gcalText}</p>
            <div className="export-card__actions">
              <a className="btn btn--primary" href={googleSubscribeLink(feedUrl)} target="_blank" rel="noopener noreferrer">{t.gcalCta}<ArrowRight size={17}/></a>
              <a className="btn btn--ghost btn--sm" href={withDownload(feedUrl.replace(siteUrl, ""))}><Download size={16}/>{t.icsCta}</a>
            </div>
          </article>
          <article className="export-card export-card--sheet">
            <span className="export-card__icon"><FileSpreadsheet size={24}/></span>
            <h3>{t.sheetsTitle}</h3><p>{t.sheetsText}</p>
            <div className="formula"><code>{formula}</code><CopyCode text={formula} locale={locale} label={t.copyFormula} className="copy-btn copy-btn--sm"/></div>
            <div className="export-card__actions">
              <a className="btn btn--primary" href="https://sheets.new" target="_blank" rel="noopener noreferrer">{t.sheetsOpen}<ArrowRight size={17}/></a>
              <a className="btn btn--ghost btn--sm" href={withDownload(csvUrl.replace(siteUrl, ""))}><Download size={16}/>{t.csvCta}</a>
            </div>
          </article>
        </div>
      </div>
    </section>

    {brandOffers.length > 0 && <section className="section section--flush">
      <div className="container">
        <div className="section-head section-head--left"><h2>{t.alwaysOn}</h2></div>
        <div className="offer-grid offer-grid--page">{brandOffers.map((offer) => <OfferCard key={offer.id} offer={offer} locale={locale}/>)}</div>
        <div className="how-offers">
          <article><span className="mini-icon tone-pink"><Gift size={18}/></span><h3>1. {t.how1}</h3><p>{t.how1Text}</p></article>
          <article><span className="mini-icon tone-violet"><TicketCheck size={18}/></span><h3>2. {t.how2}</h3><p>{t.how2Text}</p></article>
          <article><span className="mini-icon tone-green"><ShieldCheck size={18}/></span><h3>3. {t.how3}</h3><p>{t.how3Text}</p></article>
        </div>
        <div className="section-foot"><Link className="btn btn--primary" href="/request">{dict(locale).nav.startRequest} <ArrowRight size={18}/></Link><Link className="btn btn--ghost" href="/print">{t.useOnPrint}</Link></div>
      </div>
    </section>}
  </>;
}

function groupByMonth(views: PromoView[]) {
  const groups = new Map<string, PromoView[]>();
  for (const view of views) {
    const month = (view.eventStarts ?? view.startsOn).slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), view]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}
