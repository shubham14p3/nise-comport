import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { resendCustomerEmailCode, searchCustomers, setCustomerTempPassword, setCustomerVerified } from "@/lib/customer-finder";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { hasPermission } from "@/lib/permissions";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("search"), query: z.string().trim().min(3, "Type an email or mobile number.").max(120) }),
  z.object({ action: z.literal("temp-password"), id: z.string().uuid(), password: z.string().max(100).optional() }),
  z.object({ action: z.literal("resend-email-code"), id: z.string().uuid() }),
  z.object({ action: z.literal("set-verified"), id: z.string().uuid(), channel: z.enum(["email", "phone"]), verified: z.boolean() }),
]);

/** Find customer: search by email or mobile, set a temporary password, resend the email code. */
export async function POST(request: NextRequest) {
  try {
    const actor = await getCurrentUser();
    if (!actor || !hasPermission(actor, "records")) throw new PublicError("You don’t have access to customer records.", 403, { code: "forbidden" });
    const input = schema.parse(await readJson(request));
    if (input.action === "search") return NextResponse.json({ customers: await searchCustomers(input.query) });
    if (input.action === "temp-password") return NextResponse.json(await setCustomerTempPassword(input.id, input.password, actor));
    if (input.action === "set-verified") return NextResponse.json(await setCustomerVerified(input.id, input.channel, input.verified, actor));
    return NextResponse.json(await resendCustomerEmailCode(input.id, actor));
  } catch (error) {
    return apiError(error);
  }
}
