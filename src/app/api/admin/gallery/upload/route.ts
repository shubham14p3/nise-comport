import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { MAX_GALLERY_UPLOAD_BYTES, uploadPhoto } from "@/lib/gallery-store";
import { apiError } from "@/lib/http";
import { hasPermission } from "@/lib/permissions";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** One photo per call (multipart: file, tag). Converted to WebP on the server. */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "content")) return NextResponse.json({ error: "Site content access is required." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? "0") > MAX_GALLERY_UPLOAD_BYTES + 256 * 1024) return NextResponse.json({ error: "Keep each photo under 20 MB." }, { status: 413 });
  try {
    await enforceRate(RATE_RULES.galleryUploadsPerUserHour, identity("user", user.id), "That’s a lot of photos for one hour. Please continue a little later.");
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a photo." }, { status: 400 });
    const photo = await uploadPhoto(file, String(form.get("tag") ?? "shop"), user);
    return NextResponse.json({ ok: true, photo }, { status: 201 });
  } catch (error) { return apiError(error); }
}
