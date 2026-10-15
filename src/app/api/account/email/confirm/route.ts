import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { confirmEmailChange, requireUser } from "@/lib/auth";
import { apiError, clientIp, readJson } from "@/lib/http";

const schema = z.object({ newEmail: z.string().trim().min(3).max(254), code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from the email.") });

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await readJson(request));
    const result = await confirmEmailChange(user, body.newEmail, body.code, clientIp(request));
    return NextResponse.json({ ok: true, ...result });
  } catch (error) { return apiError(error); }
}
