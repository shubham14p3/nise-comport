import { counterHistory, chargeCounterVisit } from "@/lib/counter-history";
import { getCounterPolicy, saveCounterPolicy } from "@/lib/counter-settings";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { lookupCounterAccount, lookupCustomer, lookupCustomerByEmail, recordVisit, requestTopUp, updateCounterCustomer } from "@/lib/counter";
import { checkCounterCode, confirmAtCounter, requestCounterVerification, sendCounterCode } from "@/lib/counter-verify";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { publishedServiceDetails } from "@/lib/services";
import { normalizePhone } from "@/lib/validation";
import { hasPermission } from "@/lib/permissions";

const phone = z.string().trim().min(10, "Enter a valid 10-digit mobile number.").max(20);
const amount = z.number().positive("Enter an amount.").max(1_000_000);

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("history"), page: z.number().int().min(0).max(100000).default(0) }),
  z.object({ action: z.literal("raise-payment"), id: z.uuid() }),
  z.object({ action: z.literal("wallet-policy") }),
  z.object({ action: z.literal("save-wallet-policy"), deductionPercent: z.number().min(0).max(100), accumulationPercent: z.number().min(0).max(100) }),
  z.object({ action: z.literal("lookup"), phone, page: z.number().int().min(0).max(10_000).optional() }),
  z.object({ action: z.literal("lookup-email"), email: z.string().trim().max(120), page: z.number().int().min(0).max(10_000).optional() }),
  z.object({ action: z.literal("lookup-account"), userId: z.uuid(), phone, page: z.number().int().min(0).max(10_000).optional() }),
  z.object({ action: z.literal("update-customer"), userId: z.uuid(), name: z.string().trim().min(2).max(100), email: z.string().trim().max(254).optional() }),
  z.object({ action: z.literal("confirm"), userId: z.string().uuid(), channel: z.enum(["email", "phone"]) }),
  z.object({ action: z.literal("code-send"), userId: z.string().uuid() }),
  z.object({ action: z.literal("code-check"), userId: z.string().uuid(), code: z.string().trim().length(6) }),
  z.object({ action: z.literal("verify-request"), userId: z.string().uuid(), channel: z.enum(["email", "phone"]) }),
  z.object({ action: z.literal("visit"), phone, userId: z.uuid().optional(), name: z.string().trim().max(100).optional(), email: z.string().trim().max(200).optional(), serviceSlug: z.string().min(2).max(80), amount, walletMode: z.enum(["deduct", "accumulate"]).default("deduct") }),
  z.object({ action: z.literal("topup"), phone, userId: z.uuid().optional(), name: z.string().trim().max(100).optional(), email: z.string().trim().max(200).optional(), amount, reason: z.string().max(180).default("") }),
]);

function normalised(raw: string) {
  const value = normalizePhone(raw);
  if (!value) throw new PublicError("Enter a valid 10-digit mobile number.", 400, { fields: { phone: "Check the number." } });
  return value;
}

/**
 * Counter desk: look up a customer, record a walk-in visit, or request a wallet top-up.
 * The owner, and staff the owner has given the "counter" permission. Top-ups still need approval.
 */
export async function POST(request: NextRequest) {
  try {
    const actor = await getCurrentUser();
    if (!actor || !hasPermission(actor, "counter")) throw new PublicError("You don’t have access to the counter desk. Ask the owner to add it to your account.", 403, { code: "forbidden" });
    const input = schema.parse(await readJson(request));

    if (input.action === "history") return NextResponse.json(await counterHistory(actor, input.page));
    if (input.action === "raise-payment") return NextResponse.json(await chargeCounterVisit(input.id, actor));
    if (input.action === "wallet-policy") return NextResponse.json({ policy: await getCounterPolicy() });
    if (input.action === "save-wallet-policy") {
      return NextResponse.json({ policy: await saveCounterPolicy(input, actor) });
    }
    if (input.action === "lookup") return NextResponse.json(await lookupCustomer(input.phone, input.page ?? 0));
    if (input.action === "lookup-email") return NextResponse.json(await lookupCustomerByEmail(input.email, input.page ?? 0));
    if (input.action === "lookup-account") return NextResponse.json(await lookupCounterAccount(input.userId, input.phone, input.page ?? 0));
    if (input.action === "update-customer") return NextResponse.json({
      ok: true, ...(await updateCounterCustomer(input.userId, input.name, input.email, { id: actor.id, name: actor.name })),
    });
    if (input.action === "confirm") return NextResponse.json(await confirmAtCounter(input.userId, input.channel, actor));
    if (input.action === "code-send") return NextResponse.json(await sendCounterCode(input.userId, actor));
    if (input.action === "code-check") return NextResponse.json(await checkCounterCode(input.userId, input.code, actor));
    if (input.action === "verify-request") return NextResponse.json(await requestCounterVerification(input.userId, input.channel, actor));

    if (input.action === "visit") {
      const service = publishedServiceDetails.find((item) => item.slug === input.serviceSlug);
      if (!service) throw new PublicError("Choose a service from the list.", 400, { fields: { serviceSlug: "Choose a service from the list." } });
      const result = await recordVisit({
        staffId: actor.id, phone: normalised(input.phone), userId: input.userId, name: input.name, email: input.email,
        serviceSlug: service.slug, serviceName: service.title, billRupees: input.amount, walletMode: input.walletMode,
      });
      return NextResponse.json({ ok: true, ...result }, { status: 201 });
    }

    // Top-ups wait for a second admin's approval (see /api/admin/wallet-credit/approvals).
    const result = await requestTopUp({ staffId: actor.id, phone: normalised(input.phone), userId: input.userId, name: input.name, email: input.email, rupees: input.amount, reason: input.reason });
    return NextResponse.json({ ok: true, status: result.status, requestId: result.id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
