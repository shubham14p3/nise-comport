import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { legalForAdmin, saveLegalPage } from "@/lib/legal-pages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ slug: z.string().max(40), body: z.string().max(60000).nullable() });

export async function GET() {
  try {
    await requirePermission("content");
    return NextResponse.json({ pages: await legalForAdmin() }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("content");
    const input = schema.parse(await readJson(request));
    await saveLegalPage(input.slug, input.body, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
