import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { addStaffFollowUp } from "@/lib/followups";
import { assertRecordAccess } from "@/lib/records";
import { recordScope } from "@/lib/record-access";

export const dynamic = "force-dynamic";

/** Staff: write on a record. The customer sees it on their past records. */
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("records");
    const body = z.object({ recordId: z.string().uuid(), body: z.string().min(1).max(1000) }).parse(await readJson(request));
    await assertRecordAccess(body.recordId, recordScope(user));
    return NextResponse.json(await addStaffFollowUp(user, body.recordId, body.body), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
