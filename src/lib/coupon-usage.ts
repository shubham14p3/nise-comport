import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { couponBlocks, couponRedemptions, coupons, printJobs, serviceRequests, users } from "@/db/schema";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";

/** Who used which coupon: one row per use, newest first, with how many times that customer has used that code. */
export async function couponUsage(filter: { couponId?: string; userId?: string; q?: string }) {
  const q = (filter.q ?? "").trim().slice(0, 60);
  const like = q ? `%${q.replace(/[%_\\]/g, "\\$&")}%` : null;
  const rows = await db.select({
    id: couponRedemptions.id, couponId: coupons.id, code: coupons.code, userId: users.id, name: users.name, phone: users.phone, email: users.email,
    kind: couponRedemptions.requestKind, requestId: couponRedemptions.requestId, amount: couponRedemptions.amount, usedAt: couponRedemptions.createdAt,
    serviceReference: serviceRequests.reference, serviceName: serviceRequests.serviceName, printReference: printJobs.reference,
    timesByCustomer: sql<number>`(select count(*)::int from ${couponRedemptions} cr where cr.coupon_id = ${couponRedemptions.couponId} and cr.user_id = ${couponRedemptions.userId})`,
  }).from(couponRedemptions)
    .innerJoin(coupons, eq(coupons.id, couponRedemptions.couponId))
    .innerJoin(users, eq(users.id, couponRedemptions.userId))
    .leftJoin(serviceRequests, and(eq(couponRedemptions.requestKind, "service"), eq(serviceRequests.id, couponRedemptions.requestId)))
    .leftJoin(printJobs, and(eq(couponRedemptions.requestKind, "print"), eq(printJobs.id, couponRedemptions.requestId)))
    .where(and(
      filter.couponId ? eq(couponRedemptions.couponId, filter.couponId) : undefined,
      filter.userId ? eq(couponRedemptions.userId, filter.userId) : undefined,
      like ? or(ilike(coupons.code, like), ilike(users.name, like), ilike(users.phone, like), ilike(users.email, like)) : undefined,
    ))
    .orderBy(desc(couponRedemptions.createdAt)).limit(300);
  const blocks = await db.select({
    id: couponBlocks.id, userId: couponBlocks.userId, couponId: couponBlocks.couponId, code: coupons.code, reason: couponBlocks.reason, createdAt: couponBlocks.createdAt, name: users.name, phone: users.phone,
  }).from(couponBlocks).innerJoin(users, eq(users.id, couponBlocks.userId)).leftJoin(coupons, eq(coupons.id, couponBlocks.couponId)).orderBy(desc(couponBlocks.createdAt)).limit(200);
  const codes = await db.select({ id: coupons.id, code: coupons.code }).from(coupons).where(isNull(coupons.userId)).orderBy(coupons.code).limit(500);
  return {
    uses: rows.map((row) => ({ ...row, amount: Number(row.amount), usedAt: row.usedAt.toISOString(), reference: row.serviceReference ?? row.printReference ?? null, what: row.kind === "print" ? "Print order" : row.serviceName ?? "Service request" })),
    blocks: blocks.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    codes,
  };
}

type Actor = { id: string; name: string };

/** Stops one customer from using one code (couponId) or every code (couponId null). */
export async function blockCustomer(input: { userId: string; couponId?: string | null; reason?: string | null }, actor: Actor) {
  const [user] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, input.userId)).limit(1);
  if (!user) throw new PublicError("Customer not found.", 404);
  let code = "all coupons";
  if (input.couponId) {
    const [coupon] = await db.select({ code: coupons.code }).from(coupons).where(eq(coupons.id, input.couponId)).limit(1);
    if (!coupon) throw new PublicError("Coupon not found.", 404);
    code = coupon.code;
  }
  await db.insert(couponBlocks).values({ userId: user.id, couponId: input.couponId ?? null, reason: input.reason?.replace(/\s+/g, " ").trim().slice(0, 200) || null, createdBy: actor.id }).onConflictDoNothing();
  await logActivity({ kind: "promotion", permission: "promotions", category: "content", title: `${actor.name} blocked ${user.name} from ${code}`, actorId: actor.id });
}

export async function unblockCustomer(blockId: string, actor: Actor) {
  const [row] = await db.delete(couponBlocks).where(eq(couponBlocks.id, blockId)).returning();
  if (!row) throw new PublicError("Block not found.", 404);
  await logActivity({ kind: "promotion", permission: "promotions", category: "content", title: `${actor.name} allowed a customer to use coupons again`, actorId: actor.id });
}
