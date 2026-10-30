import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { MAX_LOADER_BYTES } from "@/lib/loader-image";
import { uploadLoader } from "@/lib/site-branding";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const actor = await requireStaff("admin");
    if (Number(request.headers.get("content-length") ?? 0) > MAX_LOADER_BYTES + 256 * 1024) return NextResponse.json({ error: "Keep loader images under 2 MB." }, { status: 413 });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a loader image." }, { status: 400 });
    return NextResponse.json({ loader: await uploadLoader(file, actor.id) }, { status: 201 });
  } catch (error) { return apiError(error); }
}
