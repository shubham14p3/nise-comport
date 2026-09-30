import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { campaignAction, listCampaigns, saveCampaign } from "@/lib/campaigns";
import { apiError, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    await requirePermission("campaigns");
    return NextResponse.json(await listCampaigns(), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

const text3 = z.object({ en: z.string().max(1000).optional(), hi: z.string().max(1000).optional(), bn: z.string().max(1000).optional() });
const saveSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(3).max(100),
  kind: z.enum(["renewal", "offer", "optin"]),
  service: z.string().max(40).nullable().optional(),
  message: text3.optional(),
  posters: z.object({ en: z.string().max(200).optional(), hi: z.string().max(200).optional(), bn: z.string().max(200).optional() }).nullable().optional(),
  couponCode: z.string().max(40).nullable().optional(),
  audience: z.object({ renewalWithinDays: z.number().int().min(1).max(365).nullable().optional(), locales: z.array(z.string().max(4)).max(3).nullable().optional() }).optional(),
  testNumbers: z.array(z.string().max(20)).max(10).optional(),
  pacing: z.object({ batchSize: z.number().optional(), gapMinMinutes: z.number().optional(), gapMaxMinutes: z.number().optional(), dailyLimit: z.number().optional(), windowStart: z.number().optional(), windowEnd: z.number().optional() }).optional(),
  provider: z.enum(["manual", "cloud"]).optional(),
  templateName: z.string().max(100).nullable().optional(),
});

/** Create or edit a campaign (a running campaign must be paused first). */
export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("campaigns");
    const row = await saveCampaign(saveSchema.parse(await readJson(request)), actor.id);
    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch (error) { return apiError(error); }
}

const actionSchema = z.object({ id: z.uuid(), action: z.enum(["test", "start", "pause", "resume", "stop", "run"]), testLocales: z.array(z.string().max(4)).max(3).optional() });

/** Send a test, start, pause, resume, stop or "run now". */
export async function PATCH(request: NextRequest) {
  try {
    await requirePermission("campaigns");
    const { id, action, testLocales } = actionSchema.parse(await readJson(request));
    return NextResponse.json({ ok: true, ...(await campaignAction(id, action, { testLocales })) });
  } catch (error) { return apiError(error); }
}
