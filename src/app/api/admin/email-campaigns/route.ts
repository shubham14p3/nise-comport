import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { cancelEmailCampaign, createEmailCampaign, listEmailCampaigns, scheduleEmailCampaign } from "@/lib/email-campaigns";

export const dynamic = "force-dynamic";
const headers = { "cache-control": "private, no-store" };

export async function GET() {
  try {
    await requirePermission("campaigns");
    return NextResponse.json(await listEmailCampaigns(), { headers });
  } catch (error) { return apiError(error); }
}

/** create (subject, body, optional image) · schedule (id, sendAt or null for now) · cancel (id) */
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("campaigns");
    const body = z.discriminatedUnion("action", [
      z.object({ action: z.literal("create"), subject: z.string(), body: z.string(),
        image: z.object({ type: z.string(), data: z.string().max(400_000) }).optional(),
        audience: z.enum(["yes", "selected"]).optional(), audienceIds: z.array(z.string().uuid()).max(5000).optional() }),
      z.object({ action: z.literal("schedule"), id: z.string().uuid(), sendAt: z.string().datetime().nullable() }),
      z.object({ action: z.literal("cancel"), id: z.string().uuid() }),
    ]).parse(await readJson(request, 600_000));
    if (body.action === "create") return NextResponse.json(await createEmailCampaign(body, user), { headers });
    if (body.action === "schedule") return NextResponse.json(await scheduleEmailCampaign(body.id, body.sendAt ? new Date(body.sendAt) : null, user), { headers });
    return NextResponse.json(await cancelEmailCampaign(body.id, user), { headers });
  } catch (error) { return apiError(error); }
}
