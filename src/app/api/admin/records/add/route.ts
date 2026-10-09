import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { PublicError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { recordScope } from "@/lib/record-access";
import { addRecord } from "@/lib/records";
import { vaultReady } from "@/lib/vault";

export const dynamic = "force-dynamic";

/** Adds one person to a service by hand. Needs Customer records plus Add customer records. */
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("records");
    if (!hasPermission(user, "add_records")) throw new PublicError("Adding records is not switched on for your account. Ask the owner.", 403, { code: "forbidden" });
    if (!vaultReady()) throw new PublicError("Customer records need RECORDS_ENCRYPTION_KEY (or PAN_ENCRYPTION_KEY) in the server settings.", 503);
    const body = z.object({
      service: z.string().max(40), name: z.string().max(100), mobile: z.string().max(20),
      whatsapp: z.string().max(20).optional(), pan: z.string().max(12).optional(), email: z.string().max(254).optional(), address: z.string().max(300).optional(),
      recordDate: z.string().max(10).optional(), status: z.string().max(20).optional(), note: z.string().max(300).optional(),
    }).parse(await readJson(request));
    return NextResponse.json(await addRecord(body, user, recordScope(user)), { status: 201, headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
