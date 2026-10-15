import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requestDrafts } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, readJson } from "@/lib/http";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";

/** Only form fields: no files, no OTPs. Long text is trimmed. */
const draftSchema = z.object({
  step: z.number().int().min(0).max(3).optional(),
  serviceSlug: z.string().max(80).optional(), category: z.string().max(60).optional(), query: z.string().max(80).optional(),
  name: z.string().max(100).optional(), phone: z.string().max(20).optional(), contact: z.string().max(10).optional(),
  description: z.string().max(1500).optional(), mode: z.string().max(10).optional(), day: z.string().max(10).optional(), slot: z.string().max(10).optional(),
  addressId: z.string().max(40).optional(), address: z.record(z.string().max(30), z.union([z.string().max(200), z.number(), z.boolean(), z.null()])).refine((value) => Object.keys(value).length <= 16).optional(), offerId: z.string().max(60).optional(), coupon: z.string().max(40).optional(),
}).strip();

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), draft: draftSchema }),
  z.object({ action: z.literal("clear") }),
]);

/** The signed-in customer's saved, half-filled request (or null). */
export async function GET() {
  try {
    const user = await requireUser();
    const [row] = await db.select().from(requestDrafts).where(eq(requestDrafts.userId, user.id)).limit(1);
    return NextResponse.json({ draft: row ? row.data : null, updatedAt: row?.updatedAt ?? null }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    await enforceRate(RATE_RULES.draftSavesPerUserHour, identity("user", user.id), "Saving too often. Your answers are still kept on this device.");
    const input = schema.parse(await readJson(request));
    if (input.action === "clear") {
      await db.delete(requestDrafts).where(eq(requestDrafts.userId, user.id));
      return NextResponse.json({ ok: true });
    }
    const data = input.draft;
    await db.insert(requestDrafts).values({ userId: user.id, data, updatedAt: new Date() })
      .onConflictDoUpdate({ target: requestDrafts.userId, set: { data, updatedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
