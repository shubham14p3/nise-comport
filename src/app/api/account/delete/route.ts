import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteAccount, requireUser } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";

const schema = z.object({ password: z.string().min(1, "Enter your password.").max(128), confirmation: z.string().max(20) });

/** Closes the account after a password check. Blocked while requests are still open. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await readJson(request));
    await deleteAccount(user, body.password, body.confirmation);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
