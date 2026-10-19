import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { PublicError } from "@/lib/errors";
import { actorFor, storeUpload } from "@/lib/mail";
import { MAX_ATTACHMENT_BYTES } from "@/lib/mail-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** One file at a time, before the message is sent. Unused files are removed after 24 hours. */
export async function POST(request: NextRequest) {
  try {
    const actor = actorFor(await requireUser());
    if (Number(request.headers.get("content-length") ?? "0") > MAX_ATTACHMENT_BYTES + 1024 * 1024) throw new PublicError("Each file can be up to 15 MB.", 413, { code: "too_large" });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new PublicError("Choose a file to attach.", 400);
    return NextResponse.json({ ok: true, file: await storeUpload(actor, file) }, { status: 201, headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
