import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { logRecordSend } from "@/lib/records";

export const dynamic = "force-dynamic";

/** Staff tapped WhatsApp on a person in the records list: log it and return the updated counts. */
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("records");
    const { key } = z.object({ key: z.string().min(8).max(200) }).parse(await readJson(request));
    return NextResponse.json(await logRecordSend(key, user), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
