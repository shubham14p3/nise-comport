/** Counter discount rules shared by the server and the counter desk (pure, no server imports). */

/** Discount on each counter bill. It is paid from the customer's wallet, up to their balance. */
export const COUNTER_DISCOUNT_PERCENT = 10;

export type CounterPolicy = { deductionPercent: number; accumulationPercent: number };
export const DEFAULT_COUNTER_POLICY: CounterPolicy = { deductionPercent: 10, accumulationPercent: 5 };
export function counterPolicy(input: unknown): CounterPolicy {
  const raw = (input && typeof input === 'object' ? input : {}) as Partial<CounterPolicy>;
  const rate = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? Math.round(value * 100) / 100 : fallback;
  return { deductionPercent: rate(raw.deductionPercent, 10), accumulationPercent: rate(raw.accumulationPercent, 5) };
}
export function counterAmounts(billPaise: number, balancePaise: number, mode: 'deduct' | 'accumulate', policy: CounterPolicy) {
  if (!Number.isSafeInteger(billPaise) || billPaise < 0 || billPaise > 100_000_000 || !Number.isSafeInteger(balancePaise)) throw new Error('Invalid counter amount.');
  const balance = Math.max(0, balancePaise);
  const accumulate = mode === 'accumulate' || balance === 0;
  const discountPaise = accumulate ? 0 : Math.min(Math.floor(billPaise * Math.round(policy.deductionPercent * 100) / 10000), balance);
  const earnedPaise = accumulate ? Math.floor(billPaise * Math.round(policy.accumulationPercent * 100) / 10000) : 0;
  return { discountPaise, earnedPaise, collectPaise: billPaise - discountPaise, balanceAfterPaise: balancePaise - discountPaise + earnedPaise };
}
