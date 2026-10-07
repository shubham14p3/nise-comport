import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { LEAD_STATUSES, listLeads, updateLead } from "@/lib/leads";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("requests");
    const all = request.nextUrl.searchParams.get("all") === "1";
    return NextResponse.json({ leads: await listLeads(all ? [...LEAD_STATUSES] : undefined) });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requirePermission("requests");
    const input = z.object({ id: z.uuid(), status: z.enum(LEAD_STATUSES) }).parse(await request.json());
    return NextResponse.json({ ok: true, lead: await updateLead(input.id, input.status, user) });
  } catch (error) { return apiError(error); }
}
