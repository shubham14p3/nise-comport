import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { addStaff, deleteStaff, listStaff, resetStaffPassword, updateStaff } from "@/lib/staff";

export const dynamic = "force-dynamic";

/** Owner only: the team and what each person may do. */
export async function GET() {
  try {
    await requireStaff("admin");
    return NextResponse.json({ staff: await listStaff() }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

const addSchema = z.object({
  email: z.string().trim().min(3).max(254), name: z.string().trim().max(100).default(""), phone: z.string().trim().max(20).optional(),
  role: z.enum(["staff", "admin"]).default("staff"), permissions: z.array(z.string().max(40)).max(80).default([]), password: z.string().max(128).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const actor = await requireStaff("admin");
    const input = addSchema.parse(await readJson(request));
    return NextResponse.json({ ok: true, ...(await addStaff(input, actor)) }, { status: 201 });
  } catch (error) { return apiError(error); }
}

const patchSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().max(100).optional(), email: z.string().trim().max(254).optional(), phone: z.string().trim().max(20).nullable().optional(),
  role: z.enum(["staff", "admin"]).optional(), permissions: z.array(z.string().max(40)).max(80).optional(),
  disabled: z.boolean().optional(), remove: z.boolean().optional(),
  resetPassword: z.boolean().optional(), password: z.string().max(128).optional(), delete: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireStaff("admin");
    const { id, resetPassword, password, delete: del, ...patch } = patchSchema.parse(await readJson(request));
    if (del) return NextResponse.json({ ok: true, ...(await deleteStaff(id, actor)) });
    if (resetPassword) return NextResponse.json({ ok: true, ...(await resetStaffPassword(id, password, actor)) });
    return NextResponse.json({ ok: true, ...(await updateStaff(id, patch, actor)) });
  } catch (error) { return apiError(error); }
}
