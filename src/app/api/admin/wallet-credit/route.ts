import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { walletEntries, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";

const schema = z.object({ email: z.email().transform(value=>value.trim().toLowerCase()), amount: z.number().positive().max(100000), description: z.string().trim().min(3).max(160) });
export async function POST(request: NextRequest) {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "admin") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  try {
    const input = schema.parse(await request.json());
    const [customer] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
    if (!customer) return NextResponse.json({ error: "No customer account matches this email." }, { status: 404 });
    const [entry] = await db.insert(walletEntries).values({ userId: customer.id, amount: input.amount.toFixed(2), kind: "credit", description: input.description }).returning({ id: walletEntries.id });
    return NextResponse.json({ ok: true, entry: entry.id }, { status: 201 });
  } catch (error) { return apiError(error); }
}
