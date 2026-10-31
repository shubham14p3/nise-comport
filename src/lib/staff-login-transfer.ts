import { and, eq, inArray } from 'drizzle-orm';
import { activityLog, sessions, users } from '@/db/schema';
import { db } from '@/lib/db';
import { PublicError } from '@/lib/errors';
import { normalizeEmail, normalizePhone } from '@/lib/validation';

/** Explicit owner action, never a phone-based merge. Each account retains its historical data. */
export async function transferStaffLogin(sourceId: string, targetEmail: string, actor: { id: string; role: string; name?: string }) {
  if (actor.role !== 'admin' || actor.id === sourceId) throw new PublicError('Only an owner can move another staff member’s access.', 403);
  const email = normalizeEmail(targetEmail);
  const targetId = await db.transaction(async tx => {
    // Lock both accounts before changing either role.
    const rows = await tx.select().from(users).where(inArray(users.id, [sourceId])).for('update');
    const source = rows[0];
    const [target] = await tx.select().from(users).where(eq(users.email, email)).for('update');
    if (!source || source.role !== 'staff' || source.deletedAt || source.disabledAt) throw new PublicError('Choose an active staff login. Owner logins cannot be transferred here.', 409);
    if (!target || target.role !== 'customer' || target.deletedAt || target.disabledAt) throw new PublicError('The destination must be an active, existing customer account.', 409);
    if (!source.phone || !target.phone || !normalizePhone(source.phone) || normalizePhone(source.phone) !== normalizePhone(target.phone)) throw new PublicError('These accounts do not have the same contact number. Check the customer identity first.', 409);
    const now = new Date();
    await tx.update(users).set({ role: 'staff', permissions: source.permissions, updatedAt: now }).where(and(eq(users.id, target.id), eq(users.role, 'customer')));
    await tx.update(users).set({ role: 'customer', permissions: [], disabledAt: now, updatedAt: now }).where(eq(users.id, source.id));
    await tx.delete(sessions).where(inArray(sessions.userId, [source.id, target.id]));
    await tx.insert(activityLog).values({ kind: 'staff', permission: 'team', title: `${actor.name ?? 'Owner'} moved staff access to an existing customer login`, detail: `Previous login disabled: ${sourceId}. Historical records stay with their original accounts.`, refType: 'user', refId: target.id, actorId: actor.id });
    return target.id;
  });
  return { id: targetId };
}
