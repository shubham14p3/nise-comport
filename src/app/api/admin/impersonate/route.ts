import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff, startImpersonation } from "@/lib/auth";
import { apiError, clientIp, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Owner, or staff with records access: start viewing a customer's account for support. */
export async function POST(request: NextRequest) {
  try {
    const owner = await requireStaff("staff");
    const { email } = z.object({ email: z.string().min(3).max(200) }).parse(await readJson(request));
    const result = await startImpersonation(owner, email, clientIp(request));
    return NextResponse.json(result, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
