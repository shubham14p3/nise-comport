import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { listContacts, saveContact, setConsent } from "@/lib/campaigns";
import { apiError, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("campaigns");
    const params = request.nextUrl.searchParams;
    return NextResponse.json(await listContacts({ q: params.get("q") ?? "", consent: params.get("consent") ?? "" }), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100), phone: z.string().trim().min(8).max(20), locale: z.enum(["en", "hi", "bn"]).optional(), area: z.string().max(80).nullable().optional(),
  services: z.array(z.object({ service: z.string().max(40), renewalOn: z.string().max(10).nullable().optional(), note: z.string().max(120).nullable().optional() })).max(12).optional(),
  consent: z.enum(["unknown", "opted_in", "opted_out"]).optional(), notes: z.string().max(500).nullable().optional(),
});

/** Add or update a contact (matched by mobile number, so duplicates merge). */
export async function POST(request: NextRequest) {
  try {
    await requirePermission("campaigns");
    const row = await saveContact({ ...contactSchema.parse(await readJson(request)), source: "admin" });
    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch (error) { return apiError(error); }
}

/** Record a YES / STOP given by phone or at the counter. */
export async function PATCH(request: NextRequest) {
  try {
    await requirePermission("campaigns");
    const { id, consent } = z.object({ id: z.uuid(), consent: z.enum(["unknown", "opted_in", "opted_out"]) }).parse(await readJson(request));
    await setConsent(id, consent);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
