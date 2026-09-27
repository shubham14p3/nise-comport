import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
const schema = z.object({ name: z.string().trim().min(2).max(100), phone: z.string().trim().max(30).optional().default("") });
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to update your profile." }, { status: 401 });
  try {
    const input = schema.parse(await request.json());
    const [updated] = await db.update(users).set({ name: input.name, phone: input.phone || null }).where(eq(users.id, user.id)).returning({ id: users.id, name: users.name, email: users.email, phone: users.phone });
    return NextResponse.json({ ok: true, user: updated });
  } catch (error) { return apiError(error); }
}
