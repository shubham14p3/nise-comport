"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Offer } from "@/lib/offers";
import { liveOfferCodes, type PromoView } from "@/lib/promo-view";

/** Festival and sports codes that are live today, loaded once by the root layout. */
const OffersContext = createContext<PromoView[]>([]);

export default function OffersProvider({ promos, children }: { promos: PromoView[]; children: ReactNode }) {
  return <OffersContext.Provider value={promos}>{children}</OffersContext.Provider>;
}

export function useLivePromos() {
  return useContext(OffersContext);
}

/** Live codes as offer cards, soonest-ending first. */
export function useLiveCodes(): Offer[] {
  const promos = useContext(OffersContext);
  return useMemo(() => liveOfferCodes(promos), [promos]);
}
