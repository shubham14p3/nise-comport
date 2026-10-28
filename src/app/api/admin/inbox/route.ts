import { NextRequest, NextResponse } from "next/server";
import { audiences, inbox, inboxSummary, markInboxSeen } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { PublicError } from "@/lib/errors";
import { CALLBACK_TABS, type CallbackTab, listCallbackPage } from "@/lib/leads";
import { isStaffRole } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function staff() {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) throw new PublicError("Staff access is required.", 403, { code: "forbidden" });
  return user;
}

/** ?count=1 returns only the summary numbers (badge and cards); otherwise the inbox. */
export async function GET(request: NextRequest) {
  try {
    const user = await staff();
    if (request.nextUrl.searchParams.get("count")) return NextResponse.json(await inboxSummary(user));
    const params = request.nextUrl.searchParams;
    const base = await inbox(user, { category: params.get("category") || undefined });
    // Callbacks need the requests permission; they are paged by tab, so the page never depends on a fixed cap.
    const requested = params.get("leadTab") ?? "";
    const tab: CallbackTab = (Object.keys(CALLBACK_TABS) as CallbackTab[]).includes(requested as CallbackTab) ? (requested as CallbackTab) : "open";
    const pageNumber = Number.parseInt(params.get("leadPage") ?? "0", 10);
    const callbacks = audiences(user).includes("requests")
      ? await listCallbackPage({ tab, mine: params.get("leadScope") === "mine", viewerId: user.id, page: Number.isFinite(pageNumber) ? pageNumber : 0 })
      : null;
    return NextResponse.json({ ...base, callbacks });
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
