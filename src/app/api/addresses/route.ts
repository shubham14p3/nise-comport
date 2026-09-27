import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { addresses, printJobs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";

const addressSchema = z.object({
  label: z.string().trim().min(1).max(40).default("Home"),
  line1: z.string().trim().min(3).max(160), line2: z.string().trim().max(160).optional().default(""),
  city: z.string().trim().min(2).max(80), state: z.string().trim().min(2).max(80),
  postalCode: z.string().regex(/^\d{6}$/), isDefault: z.boolean().optional().default(false),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const rows = await db.select().from(addresses).where(eq(addresses.userId, user.id)).orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
  return NextResponse.json({ addresses: rows });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to save an address." }, { status: 401 });
  try {
    const input = addressSchema.parse(await request.json());
    const current = await db.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, user.id)).limit(1);
    const makeDefault = input.isDefault || current.length === 0;
    const [address] = await db.transaction(async (tx) => {
      if (makeDefault) await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
      return tx.insert(addresses).values({ ...input, line2: input.line2 || null, isDefault: makeDefault, userId: user.id }).returning();
    });
    return NextResponse.json({ ok: true, address }, { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Address id is required." }, { status: 400 });
  const [address] = await db.select().from(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, user.id))).limit(1);
  if (!address) return NextResponse.json({ error: "Address not found." }, { status: 404 });
  const linked = await db.select({ id: printJobs.id }).from(printJobs).where(eq(printJobs.addressId, id)).limit(1);
  if (linked.length) return NextResponse.json({ error: "This address is linked to a print order and can’t be removed." }, { status: 409 });
  await db.delete(addresses).where(eq(addresses.id, id));
  if (address.isDefault) {
    const [next] = await db.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, user.id)).limit(1);
    if (next) await db.update(addresses).set({ isDefault: true }).where(eq(addresses.id, next.id));
  }
  return NextResponse.json({ ok: true });
}
