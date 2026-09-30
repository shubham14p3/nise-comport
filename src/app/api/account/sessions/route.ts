import { NextResponse } from "next/server";
import { activeSessionCount, requireUser, revokeOtherSessions } from "@/lib/auth";
import { apiError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ active: await activeSessionCount(user.id) });
  } catch (error) { return apiError(error); }
}

/** "Sign out of all other devices". The current device stays signed in. */
export async function DELETE() {
  try {
    const user = await requireUser();
    const signedOut = await revokeOtherSessions(user.id);
    return NextResponse.json({ ok: true, signedOut });
  } catch (error) { return apiError(error); }
}
