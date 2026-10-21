"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Lock, X } from "lucide-react";
import type { Offer } from "@/lib/offers";
import { liveOfferCodes, type PromoView } from "@/lib/promo-view";
import { secureApi } from "@/lib/secure-api-client";

/** Festival and sports codes that are live today, loaded once by the root layout. Visitors only ever get masked codes. */
const OffersContext = createContext<PromoView[]>([]);
type Reveal = { signedIn: boolean; codes: Record<string, string>; openGate: () => void };
const RevealContext = createContext<Reveal>({ signedIn: false, codes: {}, openGate: () => {} });

const GATE_TEXT = {
  en: { title: "Sign in to see the code", body: "Offer codes are for our registered customers. Sign in or create a free account and every live code unlocks.", signIn: "Sign in", signUp: "Create free account", close: "Close" },
  hi: { title: "कोड देखने के लिए साइन इन करें", body: "ऑफ़र कोड हमारे रजिस्टर्ड ग्राहकों के लिए हैं। साइन इन करें या मुफ़्त खाता बनाएँ, सभी लाइव कोड खुल जाएँगे।", signIn: "साइन इन", signUp: "मुफ़्त खाता बनाएँ", close: "बंद करें" },
  bn: { title: "কোড দেখতে সাইন ইন করুন", body: "অফার কোড আমাদের নিবন্ধিত গ্রাহকদের জন্য। সাইন ইন করুন বা বিনামূল্যে অ্যাকাউন্ট খুলুন, সব লাইভ কোড খুলে যাবে।", signIn: "সাইন ইন", signUp: "বিনামূল্যে অ্যাকাউন্ট খুলুন", close: "বন্ধ করুন" },
};

export type Teaser = { title: Record<"en" | "hi" | "bn", string>; cta: Record<"en" | "hi" | "bn", string> | null; href: string | null };
const TeaserContext = createContext<Teaser | null>(null);
export const useTeaser = () => useContext(TeaserContext);
export const useSignedIn = () => useContext(RevealContext).signedIn;

export default function OffersProvider({ promos, teaser = null, children }: { promos: PromoView[]; teaser?: Teaser | null; children: ReactNode }) {
  const [reveal, setReveal] = useState<{ signedIn: boolean; codes: Record<string, string> }>({ signedIn: false, codes: {} });
  const [gate, setGate] = useState(false);
  const [lang, setLang] = useState<"en" | "hi" | "bn">("en");

  useEffect(() => {
    let active = true;
    if (document.documentElement.lang.startsWith("hi")) setLang("hi"); else if (document.documentElement.lang.startsWith("bn")) setLang("bn");
    secureApi<{ signedIn: boolean; codes: Record<string, string> }>("H3d8Y5qN2sW7")
      .then((result) => { if (active && result.signedIn) setReveal({ signedIn: true, codes: result.codes ?? {} }); })
      .catch(() => { /* stays masked */ });
    return () => { active = false; };
  }, []);

  const openGate = useCallback(() => setGate(true), []);
  const value = useMemo(() => ({ ...reveal, openGate }), [reveal, openGate]);
  const text = GATE_TEXT[lang];
  return <OffersContext.Provider value={promos}><TeaserContext.Provider value={teaser}><RevealContext.Provider value={value}>
    {children}
    {gate && <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title" onClick={(event) => { if (event.target === event.currentTarget) setGate(false); }}>
      <div className="gate__box">
        <button type="button" className="icon-btn gate__close" onClick={() => setGate(false)} aria-label={text.close}><X size={18}/></button>
        <span className="gate__lock" aria-hidden="true"><Lock size={26}/></span>
        <h2 id="gate-title">{text.title}</h2>
        <p>{text.body}</p>
        <div className="gate__actions"><Link className="btn btn--primary" href="/login">{text.signIn}</Link><Link className="btn btn--ghost" href="/signup">{text.signUp}</Link></div>
      </div>
    </div>}
  </RevealContext.Provider></TeaserContext.Provider></OffersContext.Provider>;
}

export function useLivePromos() {
  return useContext(OffersContext);
}

/** Live codes as offer cards, soonest-ending first. */
export function useLiveCodes(): Offer[] {
  const promos = useContext(OffersContext);
  const { codes } = useContext(RevealContext);
  return useMemo(() => liveOfferCodes(promos).map((offer) => {
    const real = offer.masked && offer.code ? codes[offer.code] : undefined;
    return real ? { ...offer, code: real, masked: false, href: offer.kind === "welcome" ? "/profile#vouchers" : `/request?coupon=${encodeURIComponent(real)}` } : offer;
  }), [promos, codes]);
}

/** The code to show for a possibly masked token: the real code once signed in, otherwise XXXXXX and `locked`. */
export function useCode(code: string | undefined, masked?: boolean) {
  const { codes, openGate } = useContext(RevealContext);
  if (!code) return { text: "", locked: false, real: undefined as string | undefined, openGate };
  if (!masked) return { text: code, locked: false, real: code, openGate };
  const real = codes[code];
  return real ? { text: real, locked: false, real, openGate } : { text: "XXXXXX", locked: true, real: undefined as string | undefined, openGate };
}
