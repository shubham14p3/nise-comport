"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLiveCodes, useSignedIn, useTeaser } from "@/components/offers-provider";
import { dict, type Locale } from "@/lib/i18n";

const DEFAULT_TEASER = {
  en: { text: "Sign up free and unlock exclusive offers", cta: "Sign up" },
  hi: { text: "मुफ़्त साइन अप करें और खास ऑफ़र पाएँ", cta: "साइन अप" },
  bn: { text: "বিনামূল্যে সাইন আপ করুন, বিশেষ অফার পান", cta: "সাইন আপ" },
};

/**
 * One calm line above the header. Visitors see a single, editable "sign up to unlock offers" message
 * (Admin → Site content → banner "The single offer line above the menu"); signed-in customers see
 * their soonest-ending live offer. All other offers live on /offers.
 */
export default function OfferTicker({ locale }: { locale: Locale }) {
  const signedIn = useSignedIn();
  const teaser = useTeaser();
  const codes = useLiveCodes();
  const t = dict(locale).ticker;
  const offer = signedIn ? codes[0] : undefined;
  const fallback = DEFAULT_TEASER[locale];
  const text = offer ? `${offer.highlight[locale]} · ${offer.ticker[locale]}` : teaser ? teaser.title[locale] || teaser.title.en : fallback.text;
  const href = offer ? offer.code ? `/offers#${offer.code}` : offer.href : teaser?.href || "/signup";
  const cta = offer ? t.viewAll : teaser?.cta ? teaser.cta[locale] || teaser.cta.en : fallback.cta;
  return <div className="ticker ticker--single" role="region" aria-label={t.live}>
    <div className="container ticker__inner">
      <Link href={href} className="ticker__one"><Sparkles size={14} aria-hidden="true"/><span>{text}</span></Link>
      <Link className="ticker__all" href={signedIn ? "/offers" : href}>{cta}<ArrowRight size={14}/></Link>
    </div>
  </div>;
}
