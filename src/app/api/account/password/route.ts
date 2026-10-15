import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { changePassword, requireUser } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";

const schema = z.object({ currentPassword: z.string().min(1, "Enter your current password.").max(128), newPassword: z.string().min(1, "Choose a new password.").max(128) });

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await readJson(request));
    const result = await changePassword(user, body.currentPassword, body.newPassword);
    return NextResponse.json({ ok: true, ...result, message: result.signedOut ? `Password changed. ${result.signedOut} other device${result.signedOut === 1 ? " was" : "s were"} signed out.` : "Password changed." });
  } catch (error) { return apiError(error); }
}
