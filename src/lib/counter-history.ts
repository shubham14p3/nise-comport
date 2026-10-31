import { and, count, desc, eq, sql } from 'drizzle-orm';
import { activityLog, counterVisits, jobs, payments, serviceRequests, users, walletEntries } from '@/db/schema';
import { db } from '@/lib/db';
import { PublicError } from '@/lib/errors';
import { hasPermission, type StaffLike } from '@/lib/permissions';

export const counterReference = (id: string) => `CV-${id.toUpperCase()}`;
export async function counterHistory(actor: StaffLike & { id: string }, page: number) {
 const scope = actor.role === 'admin' ? undefined : eq(counterVisits.staffId, actor.id);
 const rows = await db.select({ id: counterVisits.id, customer: users.name, phone: users.phone, service: counterVisits.serviceName, createdAt: counterVisits.createdAt,
  billPaise: counterVisits.billPaise, discountPaise: counterVisits.discountPaise, collectPaise: counterVisits.collectPaise,
  earnedPaise: sql<number>`coalesce((select sum(amount)*100 from ${walletEntries} where reference = 'CV-EARN-' || ${counterVisits.id}::text), 0)::int`,
  paymentStatus: payments.status, jobId: jobs.code,
 }).from(counterVisits).innerJoin(users, eq(users.id, counterVisits.userId))
 .leftJoin(jobs, and(eq(jobs.sourceKind, 'counter'), eq(jobs.sourceId, counterVisits.id)))
 .leftJoin(serviceRequests, sql`${serviceRequests.reference} = 'CV-' || upper(${counterVisits.id}::text)`)
 .leftJoin(payments, sql`${payments.id} = (select p.id from payments p where p.reference = ${serviceRequests.reference} order by p.created_at desc, p.id desc limit 1)`)
 .where(scope).orderBy(desc(counterVisits.createdAt), desc(counterVisits.id)).limit(10).offset(page * 10);
 const [total] = await db.select({ total: count() }).from(counterVisits).where(scope);
 return { rows: rows.map(row => ({ ...row, reference: counterReference(row.id) })), total: total.total, page, pageSize: 10, canCharge: hasPermission(actor, 'charge') };
}
/** Charges the saved outstanding counter amount only after an explicit staff confirmation. */
export async function chargeCounterVisit(id: string, actor: StaffLike & { id: string }) {
 if (!hasPermission(actor, 'charge')) throw new PublicError('Payment-request permission is required.', 403);
 return db.transaction(async tx => {
  const [visit] = await tx.select().from(counterVisits).where(eq(counterVisits.id, id)).for('update');
  if (!visit) throw new PublicError('Counter visit not found.', 404);
  if (actor.role !== 'admin' && visit.staffId !== actor.id) throw new PublicError('Only the owner can raise a payment for another staff member’s visit.', 403);
  if (visit.collectPaise < 100 || visit.collectPaise > 50_000_000) throw new PublicError('Counter payment must be between ₹1 and ₹5,00,000.', 400);
  const reference = counterReference(id);
  const [existing] = await tx.select({ id: serviceRequests.id }).from(serviceRequests).where(eq(serviceRequests.reference, reference)).limit(1);
  if (existing) throw new PublicError('This counter visit already has a payment ticket. Manage it in Payments.', 409);
  const [request] = await tx.insert(serviceRequests).values({ reference, userId: visit.userId, serviceSlug: visit.serviceSlug, serviceName: visit.serviceName,
    status: 'awaiting_payment', serviceFee: (visit.collectPaise / 100).toFixed(2), details: { source: 'counter', counterVisitId: id, billPaise: visit.billPaise, walletDiscountPaise: visit.discountPaise }, notes: 'Counter bill collection only. Not confirmation of insurance approval or government filing.' }).returning({ id: serviceRequests.id });
  await tx.insert(payments).values({ requestId: request.id, reference, userId: visit.userId, amountPaise: visit.collectPaise, note: 'Counter visit: customer confirmed this amount has not yet been collected.', createdBy: actor.id });
  await tx.insert(activityLog).values({ kind: 'request', permission: 'payments', title: 'Payment requested for counter visit', detail: reference, refType: 'request', refId: request.id, actorId: actor.id });
  return { reference, amountPaise: visit.collectPaise, path: `/pay/${reference}` };
 });
}
