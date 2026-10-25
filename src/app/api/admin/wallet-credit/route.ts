import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { and, countDistinct, desc, eq, ilike, or, sql } from "drizzle-orm";
import { logActivity } from "@/lib/activity";
import { z } from "zod";
import { walletEntries, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
import { PublicError } from "@/lib/errors";

const schema = z.object({ email: z.email().transform(value=>value.trim().toLowerCase()), amount: z.number().positive().max(100000), description: z.string().trim().min(3).max(160) });
export async function POST(request: NextRequest) {
  try {
    const actor = await getCurrentUser();
    if (!hasPermission(actor, "wallet")) return NextResponse.json({ error: "Wallet access is required." }, { status: 403 });
    const input = schema.parse(await request.json());
    const [customer] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
    if (!customer) return NextResponse.json({ error: "No customer account matches this email." }, { status: 404 });
    const [entry] = await db.insert(walletEntries).values({ userId: customer.id, amount: input.amount.toFixed(2), kind: "credit", description: input.description }).returning({ id: walletEntries.id });
    return NextResponse.json({ ok: true, entry: entry.id }, { status: 201 });
  } catch (error) { return apiError(error); }
}


/** Paginated wallet holders and per-customer transactions; read-only and permission-gated. */
export async function GET(request: NextRequest) {
  try {
    const actor = await getCurrentUser();
    if (!hasPermission(actor, "wallet")) return NextResponse.json({ error: "Wallet access required." }, { status: 403 });
    const params = request.nextUrl.searchParams;
    const size = [10, 20, 50].includes(Number(params.get("size"))) ? Number(params.get("size")) : 20;
    const page = Math.max(0, Math.min(Number(params.get("page")) || 0, 100000));
    const userId = z.uuid().safeParse(params.get("userId")).data;
    if (userId) {
      const [person] = await db.select({ name: users.name, email: users.email, phone: users.phone }).from(users).where(eq(users.id, userId)).limit(1);
      if (!person) throw new PublicError("Customer not found.", 404);
      const [rows, [totalRow], [balanceRow]] = await Promise.all([
        db.select({ id: walletEntries.id, kind: walletEntries.kind, amount: walletEntries.amount, description: walletEntries.description, reference: walletEntries.reference, createdAt: walletEntries.createdAt }).from(walletEntries).where(eq(walletEntries.userId, userId)).orderBy(desc(walletEntries.createdAt), desc(walletEntries.id)).limit(size).offset(page * size),
        db.select({ total: sql<number>`count(*)::int` }).from(walletEntries).where(eq(walletEntries.userId, userId)),
        db.select({ balance: sql<string>`coalesce(sum(case when ${walletEntries.kind} = 'debit' then -${walletEntries.amount} else ${walletEntries.amount} end), 0)::text` }).from(walletEntries).where(eq(walletEntries.userId, userId)),
      ]);
      return NextResponse.json({ customer: person, transactions: rows, total: totalRow.total, balance: balanceRow.balance }, { headers: { "cache-control": "private, no-store" } });
    }
    const q = (params.get("q") ?? "").trim().slice(0, 80);
    const like = q ? `%${q.replace(/[\\%_]/g, "\\$&")}%` : "";
    const where = like ? or(ilike(users.name, like), ilike(users.email, like), ilike(users.phone, like)) : undefined;
    const [rows, [countRow]] = await Promise.all([
      db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone,
        balance: sql<string>`coalesce(sum(case when ${walletEntries.kind} = 'debit' then -${walletEntries.amount} else ${walletEntries.amount} end), 0)::text`,
        credits: sql<number>`count(*)::int` })
        .from(walletEntries).innerJoin(users, eq(walletEntries.userId, users.id)).where(where)
        .groupBy(users.id, users.name, users.email, users.phone)
        .orderBy(desc(sql`max(${walletEntries.createdAt})`)).limit(size).offset(page * size),
      db.select({ total: countDistinct(users.id) }).from(walletEntries).innerJoin(users, eq(walletEntries.userId, users.id)).where(where),
    ]);
    return NextResponse.json({ customers: rows, total: Number(countRow.total) }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

const correctionSchema = z.object({
  entryId: z.uuid(), amount: z.number().positive().max(100000),
  reason: z.string().trim().min(10).max(180),
});

/** Reversals are append-only; the original financial entry can never be overwritten. */
export async function PATCH(request: NextRequest) {
  try {
    const actor = await getCurrentUser();
    if (actor?.role !== "admin") return NextResponse.json({ error: "Owner access required for wallet corrections." }, { status: 403 });
    const input = correctionSchema.parse(await request.json());
    const cents = Math.round(input.amount * 100);
    if (!Number.isSafeInteger(cents) || cents < 1) throw new PublicError("Enter a valid amount.", 400);
    const adjustment = await db.transaction(async (tx) => {
      const [entry] = await tx.select().from(walletEntries).where(and(eq(walletEntries.id, input.entryId), eq(walletEntries.kind, "credit"))).limit(1);
      if (!entry) throw new PublicError("Only existing credits can be corrected.", 400);
      // Serialize adjustments on each customer, including two owner tabs at once.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${entry.userId}))`);
      const [already] = await tx.select({ amount: sql<string>`coalesce(sum(${walletEntries.amount}),0)::text` }).from(walletEntries)
        .where(and(eq(walletEntries.userId, entry.userId), eq(walletEntries.kind, "debit"), eq(walletEntries.reference, `correction:${entry.id}`)));
      const [balance] = await tx.select({ amount: sql<string>`coalesce(sum(case when ${walletEntries.kind} = 'debit' then -${walletEntries.amount} else ${walletEntries.amount} end),0)::text` }).from(walletEntries).where(eq(walletEntries.userId, entry.userId));
      const originalCents = Math.round(Number(entry.amount) * 100);
      const correctedCents = Math.round(Number(already.amount) * 100);
      const balanceCents = Math.round(Number(balance.amount) * 100);
      if (cents > originalCents - correctedCents) throw new PublicError("This correction exceeds the remaining original credit.", 409);
      if (cents > balanceCents) throw new PublicError("Customer balance is insufficient; review redeemed funds before correcting.", 409);
      const [created] = await tx.insert(walletEntries).values({
        userId: entry.userId, kind: "debit", amount: (cents / 100).toFixed(2),
        description: `Owner correction: ${input.reason}`, reference: `correction:${entry.id}`,
      }).returning({ id: walletEntries.id, userId: walletEntries.userId });
      return created;
    });
    await logActivity({ kind: "promotion", permission: "wallet", title: "Owner wallet credit correction", detail: `₹${(cents / 100).toFixed(2)} · ${input.reason}`, refType: "wallet", refId: adjustment.id, actorId: actor.id });
    return NextResponse.json({ ok: true, id: adjustment.id }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
