import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { whatsappMessages } from "@/db/schema";
import { requireAnyPermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { normalizePhone } from "@/lib/validation";
import { cloudApiConfigured } from "@/lib/whatsapp";
import { replyAndLog } from "@/lib/whatsapp-bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Staff chat view: latest conversations (grouped by number) and replying from the website. */
export async function GET(request: NextRequest) {
  try {
    await requireAnyPermission(["whatsapp", "campaigns"]);
    const phone = request.nextUrl.searchParams.get("phone");
    if (phone) {
      const messages = await db.select().from(whatsappMessages).where(eq(whatsappMessages.phone, phone)).orderBy(desc(whatsappMessages.createdAt)).limit(100);
      return NextResponse.json({ messages: messages.reverse() }, { headers: { "cache-control": "private, no-store" } });
    }
    const rows = await db.select().from(whatsappMessages).orderBy(desc(whatsappMessages.createdAt)).limit(400);
    const seen = new Map<string, { phone: string; name: string | null; last: string; at: string; direction: string; needsHuman: boolean }>();
    for (const row of rows) {
      const entry = seen.get(row.phone);
      if (!entry) seen.set(row.phone, { phone: row.phone, name: row.name, last: row.body.slice(0, 140), at: row.createdAt.toISOString(), direction: row.direction, needsHuman: row.needsHuman && row.direction === "in" });
      else { if (!entry.name && row.name) entry.name = row.name; if (row.needsHuman && row.direction === "in" && !entry.needsHuman && rows.indexOf(row) < 20) entry.needsHuman = true; }
    }
    return NextResponse.json({ conversations: [...seen.values()], configured: cloudApiConfigured() }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

const schema = z.object({ phone: z.string().max(30), text: z.string().trim().min(1).max(1000) });

export async function POST(request: NextRequest) {
  try {
    await requireAnyPermission(["whatsapp", "campaigns"]);
    const input = schema.parse(await readJson(request));
    const phone = normalizePhone(input.phone);
    if (!phone) throw new PublicError("That number doesn’t look right.", 400);
    const result = await replyAndLog(phone, input.text, "staff");
    if (!result.ok) throw new PublicError(`Not delivered: ${result.error}. WhatsApp only lets us reply within 24 hours of the customer’s last message.`, 502);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
