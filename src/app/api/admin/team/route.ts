import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { adminTeam, deleteTeamMember, importDefaultTeam, moveTeamMember, saveTeamMember } from "@/lib/team";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const member = z.object({
  id: z.string().uuid().optional(), name: z.string().max(80), role: z.string().max(80),
  bio: z.string().max(300).nullable().optional(), image: z.string().max(200).nullable().optional(), active: z.boolean().optional(),
});
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), member }),
  z.object({ action: z.literal("delete"), id: z.string().uuid() }),
  z.object({ action: z.literal("move"), id: z.string().uuid(), direction: z.enum(["up", "down"]) }),
  z.object({ action: z.literal("importDefaults") }),
]);

/** Only the owner changes who the website shows as its team. */
async function owner() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

export async function GET() {
  try {
    if (!(await owner())) return NextResponse.json({ error: "Owner access is required." }, { status: 403 });
    const { people, fromDatabase } = await adminTeam();
    return NextResponse.json({ members: people, fromDatabase }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await owner();
    if (!user) return NextResponse.json({ error: "Owner access is required." }, { status: 403 });
    const input = schema.parse(await readJson(request));
    if (input.action === "save") await saveTeamMember(input.member, user);
    else if (input.action === "delete") await deleteTeamMember(input.id, user);
    else if (input.action === "move") await moveTeamMember(input.id, input.direction);
    else await importDefaultTeam(user);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
