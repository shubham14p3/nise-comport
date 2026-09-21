import { BW_PRICING_TIERS } from "./config";

export function getFlatTierPricePerPage(pageCount, tiers = BW_PRICING_TIERS) {
  if (!Number.isFinite(pageCount) || pageCount < 1) return 0;
  return tiers.find(({ min, max }) => pageCount >= min && pageCount <= max)?.pricePerPage ?? 0;
}

export function calculateFlatTierPrice(pageCount, tiers = BW_PRICING_TIERS) {
  return pageCount * getFlatTierPricePerPage(pageCount, tiers);
}

export function calculateProgressiveTierPrice(pageCount, tiers = BW_PRICING_TIERS) {
  if (!Number.isFinite(pageCount) || pageCount < 1) return 0;
  return tiers.reduce((total, tier) => {
    const upper = Number.isFinite(tier.max) ? Math.min(pageCount, tier.max) : pageCount;
    const quantity = Math.max(0, upper - tier.min + 1);
    return total + quantity * tier.pricePerPage;
  }, 0);
}

export function calculatePrintPrice({ pageCount, strategy = "flat" }) {
  return strategy === "progressive"
    ? calculateProgressiveTierPrice(pageCount)
    : calculateFlatTierPrice(pageCount);
}
