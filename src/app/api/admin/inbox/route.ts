import { NextRequest, NextResponse } from "next/server";
import { inbox, markInboxSeen, unreadCount } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { PublicError } from "@/lib/errors";
import { isStaffRole } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function staff() {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) throw new PublicError("Staff access is required.", 403, { code: "forbidden" });
  return user;
}

/** ?count=1 returns only the unread number (for the badge); otherwise the inbox. */
export async function GET(request: NextRequest) {
  try {
    const user = await staff();
    if (request.nextUrl.searchParams.get("count")) return NextResponse.json({ unread: await unreadCount(user) });
    return NextResponse.json(await inbox(user, { category: request.nextUrl.searchParams.get("category") || undefined }));
  } catch (error) { return apiError(error); }
}

/** Marks everything up to now as seen. */
export async function POST() {
  try {
    const user = await staff();
    await markInboxSeen(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
