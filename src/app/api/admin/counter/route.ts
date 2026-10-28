import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { lookupCustomer, recordVisit, topUpWallet } from "@/lib/counter";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { publishedServiceDetails } from "@/lib/services";
import { normalizePhone } from "@/lib/validation";

const phone = z.string().trim().min(10, "Enter a valid 10-digit mobile number.").max(20);
const amount = z.number().positive("Enter an amount.").max(1_000_000);

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("lookup"), phone }),
  z.object({ action: z.literal("visit"), phone, name: z.string().trim().max(100).optional(), serviceSlug: z.string().min(2).max(80), amount }),
  z.object({ action: z.literal("topup"), phone, name: z.string().trim().max(100).optional(), amount, note: z.string().max(120).optional() }),
]);

function normalised(raw: string) {
  const value = normalizePhone(raw);
  if (!value) throw new PublicError("Enter a valid 10-digit mobile number.", 400, { fields: { phone: "Check the number." } });
  return value;
}

/** Owner-only counter desk: look up a customer, record a walk-in visit, or top up the wallet. */
export async function POST(request: NextRequest) {
  try {
    const actor = await getCurrentUser();
    if (!actor || actor.role !== "admin") throw new PublicError("Only the owner can use the counter desk.", 403, { code: "forbidden" });
    const input = schema.parse(await readJson(request));

    if (input.action === "lookup") return NextResponse.json(await lookupCustomer(input.phone));

    if (input.action === "visit") {
      const service = publishedServiceDetails.find((item) => item.slug === input.serviceSlug);
      if (!service) throw new PublicError("Choose a service from the list.", 400, { fields: { serviceSlug: "Choose a service from the list." } });
      const result = await recordVisit({
        staffId: actor.id, phone: normalised(input.phone), name: input.name,
        serviceSlug: service.slug, serviceName: service.title, billRupees: input.amount,
      });
      return NextResponse.json({ ok: true, ...result }, { status: 201 });
    }

    const result = await topUpWallet({ staffName: actor.name, phone: normalised(input.phone), name: input.name, rupees: input.amount, note: input.note });
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
