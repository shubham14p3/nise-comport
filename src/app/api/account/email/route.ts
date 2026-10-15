import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestEmailChange, requireUser } from "@/lib/auth";
import { apiError, clientIp, readJson } from "@/lib/http";

const schema = z.object({ newEmail: z.string().trim().min(3, "Enter the new email address.").max(254), password: z.string().min(1, "Enter your password.").max(128) });

/** Step 1 of changing the sign-in email: password check, then a code to the NEW address. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await readJson(request));
    await requestEmailChange(user, body.newEmail, body.password, clientIp(request));
    return NextResponse.json({ ok: true, message: "We’ve sent a 6-digit code to the new email address. Enter it to finish the change." });
  } catch (error) { return apiError(error); }
}
