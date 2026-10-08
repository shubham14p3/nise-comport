import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { listEmailPeople } from "@/lib/email-campaigns";

export const dynamic = "force-dynamic";
const headers = { "cache-control": "private, no-store" };

/** Everyone with an email address, filtered by search, answer and category (for the campaign picker). */
export async function GET(request: NextRequest) {
  try {
    await requirePermission("campaigns");
    const params = request.nextUrl.searchParams;
    return NextResponse.json(await listEmailPeople({ q: params.get("q") ?? "", filter: params.get("filter") ?? "", service: params.get("service") ?? "", page: Number(params.get("page") ?? 0) || 0 }), { headers });
  } catch (error) { return apiError(error); }
}
