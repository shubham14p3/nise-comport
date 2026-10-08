import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { setRecordStatus } from "@/lib/records";
import { RECORD_STATUS_KEYS } from "@/lib/record-status";

export const dynamic = "force-dynamic";

/** Changes where one record stands (new, in progress, waiting for documents…). */
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("records");
    const body = z.object({ recordId: z.string().uuid(), status: z.enum(RECORD_STATUS_KEYS as [string, ...string[]]), note: z.string().max(300).optional() }).parse(await readJson(request));
    return NextResponse.json(await setRecordStatus(body.recordId, body.status, user, body.note), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
