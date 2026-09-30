import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { addStaff, listStaff, updateStaff } from "@/lib/staff";

export const dynamic = "force-dynamic";

/** Owner only: the team and what each person may do. */
export async function GET() {
  try {
    await requireStaff("admin");
    return NextResponse.json({ staff: await listStaff() }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

const addSchema = z.object({ email: z.string().trim().min(3).max(254), name: z.string().trim().max(100).default(""), permissions: z.array(z.string().max(40)).max(10) });

export async function POST(request: NextRequest) {
  try {
    const actor = await requireStaff("admin");
    const input = addSchema.parse(await readJson(request));
    return NextResponse.json({ ok: true, ...(await addStaff(input, actor)) }, { status: 201 });
  } catch (error) { return apiError(error); }
}

const patchSchema = z.object({ id: z.uuid(), permissions: z.array(z.string().max(40)).max(10).optional(), remove: z.boolean().optional() });

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireStaff("admin");
    const { id, ...patch } = patchSchema.parse(await readJson(request));
    return NextResponse.json({ ok: true, ...(await updateStaff(id, patch, actor)) });
  } catch (error) { return apiError(error); }
}
