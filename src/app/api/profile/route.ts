import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { cleanName, isIndianPin, normalizePhone } from "@/lib/validation";

const schema = z.object({
  name: z.string().max(200),
  phone: z.string().max(30).optional().default(""),
  whatsapp: z.string().max(30).optional().default(""),
  city: z.string().trim().max(100, "City must be 100 characters or fewer.").optional().default(""),
  state: z.string().trim().max(100, "State must be 100 characters or fewer.").optional().default(""),
  postalCode: z.string().trim().max(6).optional().default(""),
  profileSummary: z.string().trim().max(500, "Keep the note under 500 characters.").optional().default(""),
  preferredContact: z.enum(["email", "phone", "whatsapp"]).default("email"),
  /** Optimistic concurrency: the updatedAt the form was loaded with. */
  expectedUpdatedAt: z.string().max(40).optional(),
});

const returning = { id: users.id, name: users.name, email: users.email, phone: users.phone, whatsapp: users.whatsapp, city: users.city, state: users.state, postalCode: users.postalCode, profileSummary: users.profileSummary, preferredContact: users.preferredContact, updatedAt: users.updatedAt };

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const input = schema.parse(await readJson(request));
    const name = cleanName(input.name);
    const fields: Record<string, string> = {};
    if (name.length < 2 || name.length > 100) fields.name = "Enter your name (2–100 characters).";
    const phone = input.phone.trim() ? normalizePhone(input.phone) : null;
    if (input.phone.trim() && !phone) fields.phone = "Enter a valid phone number, e.g. 98765 43210.";
    const whatsapp = input.whatsapp.trim() ? normalizePhone(input.whatsapp) : null;
    if (input.whatsapp.trim() && !whatsapp) fields.whatsapp = "Enter a valid WhatsApp number, e.g. 98765 43210.";
    if (input.postalCode && !isIndianPin(input.postalCode)) fields.postalCode = "Enter a valid 6-digit PIN code.";
    if ((input.preferredContact === "phone" || input.preferredContact === "whatsapp") && !phone) fields.preferredContact = "Add a phone number to get updates by phone or WhatsApp.";
    if (Object.keys(fields).length) throw new PublicError(Object.values(fields)[0], 400, { code: "invalid_input", fields });

    const expected = input.expectedUpdatedAt ? new Date(input.expectedUpdatedAt) : null;
    const guard = expected && Number.isFinite(expected.getTime())
      ? and(eq(users.id, user.id), sql`date_trunc('milliseconds', ${users.updatedAt}) = ${expected.toISOString()}::timestamptz`)
      : eq(users.id, user.id);
    const [updated] = await db.update(users).set({
      name, phone, whatsapp: whatsapp && whatsapp !== phone ? whatsapp : null, city: input.city || null, state: input.state || null, postalCode: input.postalCode || null,
      profileSummary: input.profileSummary || null, preferredContact: input.preferredContact, updatedAt: new Date(),
    }).where(guard).returning(returning);
    if (!updated) throw new PublicError("Your profile was changed in another tab or device. Reload the page to see the latest details, then try again.", 409, { code: "stale_profile" });
    return NextResponse.json({ ok: true, user: { ...updated, updatedAt: updated.updatedAt.toISOString() } });
  } catch (error) { return apiError(error); }
}
