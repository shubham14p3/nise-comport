import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { PublicError } from "@/lib/errors";
import { configWithPreviews, copyMessages, listBirthdays, refreshData, refreshState, renewalsDue, saveConfig, saveContactExtras, sendBirthdays, sendRenewals } from "@/lib/outreach";
import { vaultReady } from "@/lib/vault";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NO_STORE = { "cache-control": "private, no-store" };
const need = () => { if (!vaultReady()) throw new PublicError("Birthdays and renewals need RECORDS_ENCRYPTION_KEY (or PAN_ENCRYPTION_KEY) in the server settings.", 503); };

/** Every staff member (admin or staff) can open Birthdays and Renewals. ?view=birthdays | renewals | config */
export async function GET(request: NextRequest) {
  try {
    await requireStaff();
    need();
    const params = request.nextUrl.searchParams;
    const view = params.get("view");
    const page = Math.max(0, Number(params.get("page")) || 0);
    const pageSize = [10,20,50].includes(Number(params.get("pageSize"))) ? Number(params.get("pageSize")) : 20;
    if (view === "config") return NextResponse.json(await configWithPreviews(), { headers: NO_STORE });
    if (view === "renewals") {
      return NextResponse.json({ ...(await renewalsDue({ days: Number(params.get("days")) || 7, overdue: params.get("overdue") === "1", vehicle: params.get("vehicle") ?? "", q: params.get("q") ?? "", template: params.get("template") ?? undefined, page, pageSize })), refresh: await refreshState() }, { headers: NO_STORE });
    }
    const range = params.get("range");
    return NextResponse.json({
      ...(await listBirthdays({ range: range === "week" || range === "month" || range === "all" ? range : "today", month: Number(params.get("month")) || undefined, q: params.get("q") ?? "", template: params.get("template") ?? undefined, page, pageSize })),
      refresh: await refreshState(),
    }, { headers: NO_STORE });
  } catch (error) { return apiError(error); }
}

const channels = z.array(z.enum(["email", "whatsapp"])).min(1).max(2);
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("send-birthdays"), ids: z.array(z.uuid()).min(1).max(2000), channels, template: z.string().max(40) }),
  z.object({ action: z.literal("send-renewals"), keys: z.array(z.string().max(60)).min(1).max(2000), channels, template: z.string().max(40), days: z.number().int().min(1).max(90).optional() }),
  z.object({ action: z.literal("scan") }),
  z.object({ action: z.literal("copy"), kind: z.enum(["birthday", "renewal"]), ids: z.array(z.string().max(60)).min(1).max(500), template: z.string().max(40), days: z.number().int().min(1).max(90).optional() }),
  z.object({ action: z.literal("contact"), id: z.uuid(), email: z.string().max(200).nullable().optional(), birthMonth: z.number().int().min(1).max(12).nullable().optional(), birthDay: z.number().int().min(1).max(31).nullable().optional(), emailConsent: z.enum(["unknown", "opted_in", "opted_out"]).optional() }),
  z.object({ action: z.literal("config"), settings: z.unknown().optional(), birthdayTemplates: z.unknown().optional(), renewalTemplates: z.unknown().optional() }),
]);

export async function POST(request: NextRequest) {
  try {
    const user = await requireStaff();
    need();
    const body = actionSchema.parse(await readJson(request, 256 * 1024));
    const actor = { id: user.id, name: user.name };
    switch (body.action) {
      case "send-birthdays": return NextResponse.json(await sendBirthdays(body, actor));
      case "send-renewals": return NextResponse.json(await sendRenewals(body, actor));
      case "copy": return NextResponse.json(await copyMessages(body));
      case "scan": return NextResponse.json(await refreshData(actor));
      case "contact": { const { action, ...rest } = body; void action; await saveContactExtras(rest); return NextResponse.json({ ok: true }); }
      case "config": return NextResponse.json(await saveConfig({ settings: body.settings, birthdayTemplates: body.birthdayTemplates, renewalTemplates: body.renewalTemplates }, actor));
    }
  } catch (error) { return apiError(error); }
}
