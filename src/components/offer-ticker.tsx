"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLiveCodes } from "@/components/offers-provider";
import { dict, type Locale } from "@/lib/i18n";
import { liveOffers } from "@/lib/offers";

/**
 * Thin scrolling strip of live offers above the header, with a blinking LIVE badge: festival and
 * Team India codes first (soonest-ending), then the shop's standing offers. Follows the language.
 */
export default function OfferTicker({ locale }: { locale: Locale }) {
  const codes = useLiveCodes();
  const items = [...codes, ...liveOffers()];
  if (!items.length) return null;
  const t = dict(locale).ticker;
  const row = items.map((offer) => <Link key={offer.id} href={offer.code ? `/offers#${offer.code}` : offer.href} className={`ticker__item tone-${offer.tone}`}>
    {offer.emoji ? <span className="ticker__emoji" aria-hidden="true">{offer.emoji}</span> : <Sparkles size={14} aria-hidden="true"/>}
    <b>{offer.highlight[locale]}</b>{offer.ticker[locale]}
  </Link>);
  return <div className="ticker" role="region" aria-label={t.live}>
    <div className="container ticker__inner">
      <span className="badge badge--live"><i aria-hidden="true"/>{t.live}</span>
      <div className="ticker__viewport">
        <div className="ticker__track" style={{ animationDuration: `${Math.max(38, items.length * 7)}s` }}>{row}<span className="ticker__clone" aria-hidden="true" inert>{row}</span></div>
      </div>
      <Link className="ticker__all" href="/offers">{t.viewAll}<ArrowRight size={14}/></Link>
    </div>
  </div>;
}
