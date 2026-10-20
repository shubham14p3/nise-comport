import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { users, walletEntries } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { isPlaceholderEmail, missingDetails, VERIFY_REWARD_RUPEES } from "@/lib/mobile-login-core";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { otpChannels } from "@/lib/sms";
import { cleanName, normalizePhone } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** What is still missing from the signed-in person's details, for the "add your details" prompt. */
export async function GET() {
  try {
    const user = await requireUser();
    const earned = await db.select({ reference: walletEntries.reference }).from(walletEntries).where(sql`${walletEntries.userId} = ${user.id} and ${walletEntries.reference} like 'verify:%'`);
    return NextResponse.json({
      missing: missingDetails(user), smsEnabled: otpChannels().length > 0, whatsappEnabled: otpChannels().includes("whatsapp"), rewards: VERIFY_REWARD_RUPEES,
      earned: earned.map((row) => String(row.reference).split(":")[1]),
      user: { name: user.name, email: isPlaceholderEmail(user.email) ? "" : user.email, phone: user.phone ?? "", whatsapp: user.whatsapp ?? "" },
    }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

const schema = z.object({ name: z.string().max(200).optional(), whatsapp: z.string().max(30).optional() });

/** Saves just the name and/or WhatsApp number from the prompt. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    await enforceRate(RATE_RULES.accountChangePerUserHour, identity("user", user.id), "Too many account changes.");
    const body = schema.parse(await readJson(request));
    const set: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
    const fields: Record<string, string> = {};
    if (body.name !== undefined) { const name = cleanName(body.name); if (name.length < 2 || name.length > 100) fields.name = "Enter your name (2–100 characters)."; else set.name = name; }
    if (body.whatsapp !== undefined && body.whatsapp.trim()) { const whatsapp = normalizePhone(body.whatsapp); if (!whatsapp) fields.whatsapp = "Enter a valid WhatsApp number, e.g. 98765 43210."; else set.whatsapp = whatsapp; }
    if (Object.keys(fields).length) throw new PublicError(Object.values(fields)[0], 400, { fields });
    await db.update(users).set(set).where(eq(users.id, user.id));
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
