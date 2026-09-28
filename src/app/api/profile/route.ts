import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^(|\+?[1-9][0-9]{7,14})$/, "Enter 8–15 digits with optional leading +.").optional().default(""),
  city: z.string().trim().max(100).optional().default(""),
  state: z.string().trim().max(100).optional().default(""),
  postalCode: z.string().trim().regex(/^(|[0-9]{6})$/, "Enter a valid 6-digit PIN code.").optional().default(""),
  profileSummary: z.string().trim().max(500).optional().default(""),
  preferredContact: z.enum(["email", "phone", "whatsapp"]).default("email"),
});
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "demo") return NextResponse.json({ error: "Please sign in to update your profile." }, { status: 401 });
  try {
    const input = schema.parse(await request.json());
    const [updated] = await db.update(users).set({ name: input.name, phone: input.phone || null, city: input.city || null, state: input.state || null, postalCode: input.postalCode || null, profileSummary: input.profileSummary || null, preferredContact: input.preferredContact }).where(eq(users.id, user.id)).returning({ id: users.id, name: users.name, email: users.email, phone: users.phone, city: users.city, state: users.state, postalCode: users.postalCode, profileSummary: users.profileSummary, preferredContact: users.preferredContact });
    return NextResponse.json({ ok: true, user: updated });
  } catch (error) { return apiError(error); }
}
