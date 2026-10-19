/**
 * Thank-you credit for completed work. The rules below are only the starting values: the owner edits them in
 * Admin → Loyalty credit, and the saved rules are used from then on.
 * The first enabled rule whose keywords appear in the service text decides the credit (rules never stack).
 */
export type LoyaltyRule = {
  id: string; label: string; enabled: boolean;
  /** Any of these words (lower case) in the service slug, name or print file name triggers the rule. */
  keywords: string[];
  type: "flat" | "percent";
  /** Rupees for "flat", percent of the order total for "percent". */
  value: number;
  /** Highest credit per order for "percent" rules; null = no limit. */
  cap: number | null;
  /** "percent" rules give nothing for orders below this many rupees. */
  minOrder: number;
};
export type LoyaltySettings = { enabled: boolean; rules: LoyaltyRule[] };
export type LoyaltyReward = { amount: number; ruleId: string; label: string };

export const DEFAULT_LOYALTY: LoyaltySettings = {
  enabled: true,
  rules: [
    { id: "insurance", label: "Insurance", enabled: true, keywords: ["insurance", "bima", "बीमा", "বিমা"], type: "flat", value: 50, cap: null, minOrder: 0 },
    { id: "certificate", label: "Income, caste or residential certificate", enabled: true, keywords: ["income", "caste", "residen", "domicile", "आय", "जाति", "निवास"], type: "flat", value: 50, cap: null, minOrder: 0 },
    { id: "print", label: "Printing", enabled: true, keywords: ["print", "xerox", "photocopy", "lamination", "प्रिंट", "প্রিন্ট"], type: "percent", value: 20, cap: null, minOrder: 20 },
  ],
};

/** Cleans whatever was saved so a bad value can never give out a wrong amount. */
export function sanitizeLoyalty(input: unknown): LoyaltySettings {
  const source = (input && typeof input === "object" ? input : {}) as { enabled?: unknown; rules?: unknown };
  const rules = Array.isArray(source.rules) ? source.rules : DEFAULT_LOYALTY.rules;
  const clean: LoyaltyRule[] = [];
  const seen = new Set<string>();
  for (const raw of rules.slice(0, 30)) {
    const rule = (raw ?? {}) as Record<string, unknown>;
    const label = String(rule.label ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
    const keywords = (Array.isArray(rule.keywords) ? rule.keywords : String(rule.keywords ?? "").split(","))
      .map((word) => String(word).toLowerCase().trim()).filter(Boolean).slice(0, 30).map((word) => word.slice(0, 40));
    if (!label || !keywords.length) continue;
    const type = rule.type === "percent" ? "percent" : "flat";
    const value = Math.max(0, Math.min(type === "percent" ? 100 : 100000, Math.round(Number(rule.value) * 100) / 100 || 0));
    const capValue = rule.cap === null || rule.cap === "" || rule.cap === undefined ? null : Math.round(Number(rule.cap) * 100) / 100;
    let id = String(rule.id ?? "").replace(/[^a-z0-9-]/gi, "").slice(0, 40) || label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "rule";
    while (seen.has(id)) id += "-2";
    seen.add(id);
    clean.push({ id, label, enabled: rule.enabled !== false, keywords, type, value, cap: capValue !== null && Number.isFinite(capValue) && capValue > 0 ? capValue : null, minOrder: Math.max(0, Math.round(Number(rule.minOrder) * 100) / 100 || 0) });
  }
  return { enabled: source.enabled !== false, rules: clean };
}

/** Credit in rupees (to the paisa) for one completed order; null when nothing is earned. `total` is the order total or service charge. */
export function loyaltyReward(settings: LoyaltySettings, text: string, total = 0): LoyaltyReward | null {
  if (!settings.enabled) return null;
  const value = text.toLowerCase();
  const rule = settings.rules.find((item) => item.enabled && item.keywords.some((word) => value.includes(word)));
  if (!rule || rule.value <= 0) return null;
  let amount = rule.value;
  if (rule.type === "percent") {
    if (!Number.isFinite(total) || total <= 0 || total < rule.minOrder) return null;
    amount = Math.floor(total * rule.value) / 100;
    if (rule.cap !== null) amount = Math.min(amount, rule.cap);
  }
  amount = Math.round(amount * 100) / 100;
  return amount > 0 ? { amount, ruleId: rule.id, label: rule.label } : null;
}

export function loyaltyReference(kind: "service" | "print" | "csv", key: string) { return `loyalty:${kind}:${key}`; }
