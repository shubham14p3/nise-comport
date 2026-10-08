import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signInWithRecords } from "@/lib/auth";
import { apiError, clientIp, readJson } from "@/lib/http";

const schema = z.object({
  mobile: z.string().trim().min(10, "Enter a valid 10-digit mobile number.").max(20),
  name: z.string().trim().min(2, "Enter the name used on your record.").max(100),
  method: z.enum(["reference", "pan"]),
  value: z.string().trim().min(1, "Enter the number.").max(40),
});

/** Sign in with a past record: mobile + name + receipt reference or PAN. No password needed. */
export async function POST(request: NextRequest) {
  try {
    const input = schema.parse(await readJson(request));
    const user = await signInWithRecords(input.mobile, input.name, input.method, input.value, clientIp(request));
    return NextResponse.json({ ok: true, user });
  } catch (error) { return apiError(error); }
}
