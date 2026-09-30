import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { dict, type Locale } from "@/lib/i18n";
import { offerEndsLabel, type Offer } from "@/lib/offers";

/** Glowing offer card with a blinking badge. Used on the home page, /offers and the step flows. */
export default function OfferCard({ offer, locale = "en", variant = "full", applies = false }: { offer: Offer; locale?: Locale; variant?: "full" | "rail"; applies?: boolean }) {
  const t = dict(locale).rail;
  const ends = offerEndsLabel(offer, locale);
  return <article className={`offer-card offer-card--${variant} tone-${offer.tone}${applies ? " is-applied" : ""}`}>
    <div className="offer-card__top">
      <span className={`badge badge--${offer.badge === "LIVE" ? "live" : "soft"}`}>{offer.badge === "LIVE" && <i aria-hidden="true"/>}{offer.badge === "LIVE" ? dict(locale).ticker.live : offer.badge}</span>
      {applies && <span className="offer-card__applies">✓ {t.applies}</span>}
    </div>
    <strong className="offer-card__highlight">{offer.highlight[locale]}</strong>
    <h3>{offer.title[locale]}</h3>
    {variant === "full" && <p>{offer.detail[locale]}</p>}
    <div className="offer-card__meta">
      {ends && <span><Clock3 size={14} aria-hidden="true"/>{t.validTill} {ends}</span>}
      {offer.firstTimeOnly && <span>{t.firstOnly}</span>}
    </div>
    {variant === "full" && <p className="offer-card__terms">{offer.terms[locale]}</p>}
    {!applies && <Link className="offer-card__cta" href={offer.href}>{t.claim}<ArrowRight size={16}/></Link>}
  </article>;
}
