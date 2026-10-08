import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertNotImpersonating, requireUser } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { addCustomerFollowUp } from "@/lib/followups";
import { isStaffRole } from "@/lib/permissions";
import { PublicError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/** Customer: tell the centre what is not working on one of their past records. Staff see it in the Inbox. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (isStaffRole(user.role)) throw new PublicError("Staff reply from the admin area.", 403);
    await assertNotImpersonating();
    const body = z.object({ recordId: z.string().uuid(), body: z.string().min(1).max(1000) }).parse(await readJson(request));
    return NextResponse.json(await addCustomerFollowUp(user, body.recordId, body.body), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
