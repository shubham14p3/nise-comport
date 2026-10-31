import { PublicError } from '@/lib/errors';
import { eq } from 'drizzle-orm';
import { activityLog, loyaltySettings } from '@/db/schema';
import { db } from '@/lib/db';
import { counterPolicy, type CounterPolicy } from '@/lib/counter-rules';

/** Separate JSON row: never overwrites the existing completed-order loyalty rules. */
export async function getCounterPolicy() {
  const [row] = await db.select().from(loyaltySettings).where(eq(loyaltySettings.id, 'counter')).limit(1);
  return counterPolicy(row?.settings);
}
export async function saveCounterPolicy(settings: CounterPolicy, actor: { id: string; role: string }) {
  if (actor.role !== "admin") throw new PublicError("Only the owner can change wallet rates.", 403);
  const actorId = actor.id;
  const policy = counterPolicy(settings);
  await db.transaction(async tx => {
    await tx.insert(loyaltySettings).values({ id: 'counter', settings: policy, updatedBy: actorId, updatedAt: new Date() }).onConflictDoUpdate({ target: loyaltySettings.id, set: { settings: policy, updatedBy: actorId, updatedAt: new Date() } });
    await tx.insert(activityLog).values({ kind: 'staff', permission: 'team', title: 'Owner updated counter wallet rates', detail: `Deduction ${policy.deductionPercent}%; accumulation ${policy.accumulationPercent}%`, actorId });
  });
  return policy;
}
