import { randomInt } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { users } from "@/db/schema";
import { db } from "@/lib/db";
import { requireUser, revokeOtherSessions } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { PublicError } from "@/lib/errors";
import { generatePin, isWeakPin, pinProblem } from "@/lib/mobile-login-core";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  currentPassword: z.string().min(1).max(128),
  pin: z.string().max(6).optional(),
});

/** Allows an account holder to set or replace their own PIN after reauthentication.
 * This never chooses accounts by their shared contact number.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.emailVerifiedAt) throw new PublicError("Verify your email before enabling email + PIN sign-in.", 403);
    const { currentPassword, pin: custom } = schema.parse(await readJson(request));
    const [fresh] = await db.select({
      id: users.id, passwordHash: users.passwordHash, phone: users.phone, disabledAt: users.disabledAt,
    }).from(users).where(eq(users.id, user.id)).limit(1);
    if (!fresh || fresh.disabledAt || !await verify(fresh.passwordHash, currentPassword).catch(() => false)) {
      throw new PublicError("Current password is incorrect.", 401);
    }
    const pin = custom?.trim() || generatePin((below) => randomInt(below));
    const issue = pinProblem(pin);
    if (issue) throw new PublicError(issue, 400, { fields: { pin: issue } });
    if (isWeakPin(pin)) throw new PublicError("Choose a less predictable PIN (not sequential or repeated digits).", 400);
    await db.update(users).set({ loginPinHash: await hash(pin), updatedAt: new Date() }).where(eq(users.id, user.id));
    await revokeOtherSessions(user.id);
    await logActivity({ kind: "staff", permission: "team", title: "Account holder updated their sign-in PIN", refType: "user", refId: user.id, actorId: user.id });
    return NextResponse.json({ ok: true, pin, message: "PIN updated. Other devices were signed out. Save this PIN privately." },
      { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
