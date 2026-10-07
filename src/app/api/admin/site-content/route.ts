import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { adminBanners, adminServices, deleteBanner, deleteService, saveBanner, saveService, setBuiltInHidden } from "@/lib/site-content";

export const runtime = "nodejs";

/** Banners and services for Admin → Site content. */
export async function GET() {
  try {
    await requirePermission("content");
    const [banners, services] = await Promise.all([adminBanners(), adminServices()]);
    return NextResponse.json({ banners, ...services });
  } catch (error) { return apiError(error); }
}

const action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("saveBanner"), banner: z.record(z.string(), z.unknown()) }),
  z.object({ action: z.literal("deleteBanner"), id: z.uuid() }),
  z.object({ action: z.literal("saveService"), service: z.record(z.string(), z.unknown()) }),
  z.object({ action: z.literal("deleteService"), id: z.uuid() }),
  z.object({ action: z.literal("hideService"), slug: z.string().max(80), hidden: z.boolean() }),
]);

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("content");
    const input = action.parse(await readJson(request));
    if (input.action === "saveBanner") return NextResponse.json({ ok: true, banner: await saveBanner(input.banner, actor) });
    if (input.action === "deleteBanner") { await deleteBanner(input.id, actor); return NextResponse.json({ ok: true }); }
    if (input.action === "saveService") { const row = await saveService(input.service, actor); return NextResponse.json({ ok: true, slug: row.slug }); }
    if (input.action === "deleteService") { await deleteService(input.id, actor); return NextResponse.json({ ok: true }); }
    await setBuiltInHidden(input.slug, input.hidden, actor);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
