import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { linkedRecords } from "@/lib/claims";

export const dynamic = "force-dynamic";

/** Customer: the past records linked to this account. */
export async function POST() {
  try {
    const user = await requireUser();
    return NextResponse.json({ records: await linkedRecords(user.id) }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
