import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signInWithPassword } from "@/lib/auth";
import { apiError } from "@/lib/http";

const loginSchema = z.object({ email: z.email(), password: z.string().min(1).max(128) });
export async function POST(request: NextRequest) {
  try { const input = loginSchema.parse(await request.json()); const result = await signInWithPassword(input.email, input.password); return NextResponse.json({ ok: true, ...result }); }
  catch (error) { return apiError(error); }
}
