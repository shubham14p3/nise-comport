/**
 * Thank-you credit for completed work. Change the numbers here; everything else follows.
 *   insurance                         → flat ₹50
 *   income / caste / residential cert → flat ₹50
 *   printing                          → 20% of the order total, at most ₹100 per order
 * The credit goes to the customer's wallet and can be used on later requests.
 */
export const LOYALTY = { insuranceFlat: 50, certificateFlat: 50, printPercent: 20, printCap: 100 } as const;

export type LoyaltyKind = "insurance" | "certificate" | "print";
export type LoyaltyReward = { amount: number; kind: LoyaltyKind; label: string };

/** Works on a service slug, a service name or the free text of an old record. */
export function loyaltyKindForText(text: string): LoyaltyKind | null {
  const value = text.toLowerCase();
  if (/insurance|bima|बीमा|বিমা/.test(value)) return "insurance";
  if (/income|caste|residen|domicile|आय|जाति|निवास/.test(value)) return "certificate";
  if (/\bprint|xerox|photocopy|lamination|प्रिंट|প্রিন্ট/.test(value)) return "print";
  return null;
}

/** Credit in rupees (two decimals) for one completed order; null when nothing is earned. `total` is only used for printing. */
export function loyaltyReward(kind: LoyaltyKind | null, total = 0): LoyaltyReward | null {
  if (kind === "insurance") return { amount: LOYALTY.insuranceFlat, kind, label: "insurance" };
  if (kind === "certificate") return { amount: LOYALTY.certificateFlat, kind, label: "certificate" };
  if (kind === "print") {
    if (!Number.isFinite(total) || total <= 0) return null;
    const amount = Math.min(LOYALTY.printCap, Math.floor((total * LOYALTY.printPercent) / 100 * 100) / 100);
    return amount > 0 ? { amount, kind, label: "printing" } : null;
  }
  return null;
}

export function loyaltyReference(kind: "service" | "print" | "csv", key: string) { return `loyalty:${kind}:${key}`; }
