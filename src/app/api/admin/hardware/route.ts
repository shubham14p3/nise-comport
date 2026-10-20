import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { adminHardware, deleteHardwareItem, saveHardwareItem, setBuiltInHardwareHidden } from "@/lib/hardware-items";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), id: z.string().max(60).optional(), groupSlug: z.string().max(60), name: z.string().max(120), note: z.string().max(200).optional(), image: z.string().max(200).optional(), published: z.boolean().optional(), sortOrder: z.number().optional() }),
  z.object({ action: z.literal("delete"), id: z.string().max(60) }),
  z.object({ action: z.enum(["hide", "show"]), groupSlug: z.string().max(60), name: z.string().max(120) }),
]);

/** Admin → Hardware parts: add, edit, hide and delete the parts shown on /hardware. */
export async function GET() {
  try {
    await requirePermission("content");
    return NextResponse.json(await adminHardware(), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("content");
    const body = schema.parse(await readJson(request));
    const actor = { id: user.id, name: user.name };
    if (body.action === "save") await saveHardwareItem(body, actor);
    else if (body.action === "delete") await deleteHardwareItem(body.id, actor);
    else await setBuiltInHardwareHidden(body.groupSlug, body.name, body.action === "hide", actor);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
