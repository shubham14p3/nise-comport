import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { adminPhotos, deletePhoto, updatePhoto } from "@/lib/gallery-store";
import { apiError, readJson } from "@/lib/http";
import { hasPermission } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const src = z.string().max(300).regex(/^\/(images\/gallery\/photos|gallery\/photo)\/[a-z0-9-]+\.webp$/);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("update"), src, tag: z.string().max(60).optional(), title: z.string().max(140).optional(), alt: z.string().max(240).optional(), hidden: z.boolean().optional() }),
  z.object({ action: z.literal("delete"), src }),
]);

async function editor() {
  const user = await getCurrentUser();
  return user && hasPermission(user, "content") ? user : null;
}

/** Every gallery photo (including hidden) for Admin → Gallery. */
export async function GET() {
  if (!(await editor())) return NextResponse.json({ error: "Site content access is required." }, { status: 403 });
  try { return NextResponse.json({ photos: await adminPhotos() }, { headers: { "cache-control": "private, no-store" } }); }
  catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  const user = await editor();
  if (!user) return NextResponse.json({ error: "Site content access is required." }, { status: 403 });
  try {
    const input = schema.parse(await readJson(request));
    if (input.action === "delete") await deletePhoto(input.src, user);
    else await updatePhoto(input.src, { tag: input.tag, title: input.title, alt: input.alt, hidden: input.hidden }, user);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
