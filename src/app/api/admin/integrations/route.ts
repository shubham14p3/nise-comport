import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { deleteIntegration, integrationStatuses, PROVIDERS, saveIntegration } from "@/lib/integration-vault";

export const runtime = "nodejs";
async function owner() {
  const user = await requirePermission("campaigns");
  if (user.role !== "admin") throw new Error("Only the owner can manage integration credentials.");
  return user;
}
const schema = z.object({
  provider: z.enum(PROVIDERS),
  credentials: z.record(z.string(), z.string().max(4096)).optional(),
  action: z.enum(["save", "delete"]),
});
export async function GET() {
  try { await owner(); return NextResponse.json({ integrations: await integrationStatuses() }); }
  catch (error) { return apiError(error); }
}
export async function POST(request: NextRequest) {
  try {
    const user = await owner();
    const input = schema.parse(await readJson(request));
    if (input.action === "delete") await deleteIntegration(input.provider);
    else {
      if (!input.credentials || !Object.keys(input.credentials).length) return NextResponse.json({ error: "Credentials required" }, { status: 400 });
      await saveIntegration(input.provider, input.credentials, user.id);
    }
    return NextResponse.json({ ok: true, integrations: await integrationStatuses() });
  } catch (error) { return apiError(error); }
}
