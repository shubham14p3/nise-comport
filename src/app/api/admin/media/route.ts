import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { listMedia, MAX_POSTER_BYTES, savePoster } from "@/lib/media";
import { hasPermission } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function posterEditor() {
  const user = await getCurrentUser();
  return user && (hasPermission(user, "promotions") || hasPermission(user, "campaigns")) ? user : null;
}

/** Uploaded posters (the built-in ones are listed in src/lib/poster-library.ts). */
export async function GET() {
  if (!(await posterEditor())) return NextResponse.json({ error: "Promotions or campaigns access is required." }, { status: 403 });
  try { return NextResponse.json({ media: await listMedia() }, { headers: { "cache-control": "private, no-store" } }); }
  catch (error) { return apiError(error); }
}

/** Upload a poster (multipart: file, title, locale, category). Posters are public at /media/<id>. */
export async function POST(request: NextRequest) {
  const user = await posterEditor();
  if (!user) return NextResponse.json({ error: "Promotions or campaigns access is required." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? "0") > MAX_POSTER_BYTES + 256 * 1024) return NextResponse.json({ error: "Keep posters under 5 MB." }, { status: 413 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a poster to upload." }, { status: 400 });
    const item = await savePoster(file, { title: String(form.get("title") ?? ""), locale: String(form.get("locale") ?? ""), category: String(form.get("category") ?? "") }, user.id);
    return NextResponse.json({ ok: true, media: item }, { status: 201 });
  } catch (error) { return apiError(error); }
}
