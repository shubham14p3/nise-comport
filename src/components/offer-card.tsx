import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import CopyCode from "@/components/copy-code";
import { dict, type Locale } from "@/lib/i18n";
import { offerEndsLabel, type Offer } from "@/lib/offers";
import { promoDict } from "@/lib/promo-i18n";

/**
 * Glowing offer card with a blinking badge. Used on the home page, /offers and the step flows.
 * Festival and sports codes show their emoji and the code with a copy button.
 */
export default function OfferCard({ offer, locale = "en", variant = "full", applies = false }: { offer: Offer; locale?: Locale; variant?: "full" | "rail"; applies?: boolean }) {
  const t = dict(locale).rail;
  const p = promoDict(locale);
  const ends = offerEndsLabel(offer, locale);
  return <article className={`offer-card offer-card--${variant} tone-${offer.tone}${offer.theme ? ` theme-${offer.theme}` : ""}${applies ? " is-applied" : ""}`}>
    {offer.emoji && <span className="offer-card__emoji" aria-hidden="true">{offer.emoji}</span>}
    <div className="offer-card__top">
      <span className={`badge badge--${offer.badge === "LIVE" ? "live" : "soft"}`}>{offer.badge === "LIVE" && <i aria-hidden="true"/>}{offer.badge === "LIVE" ? dict(locale).ticker.live : offer.badge}</span>
      {applies && <span className="offer-card__applies">✓ {t.applies}</span>}
    </div>
    <strong className="offer-card__highlight">{offer.highlight[locale]}</strong>
    <h3>{offer.title[locale]}</h3>
    {variant === "full" && <p>{offer.detail[locale]}</p>}
    {offer.code && <div className="offer-card__code"><span>{p.code}</span><b>{offer.code}</b><CopyCode text={offer.code} locale={locale} className="copy-btn copy-btn--sm copy-btn--light"/></div>}
    <div className="offer-card__meta">
      {ends && <span><Clock3 size={14} aria-hidden="true"/>{t.validTill} {ends}</span>}
      {offer.firstTimeOnly && <span>{t.firstOnly}</span>}
      {offer.tentative && <span>{p.tentative}</span>}
    </div>
    {variant === "full" && <p className="offer-card__terms">{offer.terms[locale]}</p>}
    {!applies && <Link className="offer-card__cta" href={offer.href}>{offer.code ? p.useNow : t.claim}<ArrowRight size={16}/></Link>}
  </article>;
}
