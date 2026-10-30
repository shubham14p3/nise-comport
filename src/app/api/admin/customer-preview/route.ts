import { randomBytes } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { activityLog, addresses, counterVisits, printJobs, serviceRequests, users, walletEntries } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, readJson } from "@/lib/http";
import { PublicError } from "@/lib/errors";
import { isMainOwner } from "@/lib/permissions";
import { isPlaceholderEmail } from "@/lib/mobile-login-core";
import { cleanName, looksLikeEmail, normalizeEmail, normalizePhone } from "@/lib/validation";
import { createPreviewGrant, MAX_PREVIEW_MS, PREVIEW_COOKIE, PREVIEW_MS, readPreviewGrant } from "@/lib/customer-preview-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), userId: z.uuid() }),
  z.object({ action: z.literal("create"), phone: z.string().max(24), name: z.string().max(100), email: z.string().max(254).optional() }),
  z.object({ action: z.literal("state") }),
  z.object({ action: z.literal("extend") }),
  z.object({ action: z.literal("end") }),
]);

function previewCookie(value: string, maxAge: number) {
  return { name: PREVIEW_COOKIE, value, httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const, path: "/", maxAge, priority: "high" as const };
}
async function findTarget(id: string, actor: { id: string; role: string; email: string }) {
  const [target] = await db.select().from(users).where(and(eq(users.id, id), isNull(users.deletedAt), isNull(users.disabledAt))).limit(1);
  if (!target || target.role === "demo") throw new PublicError("An active customer account is needed for preview.", 404);
  if (target.id === actor.id) throw new PublicError("Open your own customer profile directly.", 400);
  if (target.role === "admin" && !isMainOwner(actor)) throw new PublicError("Only the primary owner can preview another owner's account.", 403);
  return target;
}
async function previewData(id: string, expiresAt: number) {
  const [target, requests, jobs, visits, wallet, savedAddresses] = await Promise.all([
    db.select().from(users).where(eq(users.id, id)).limit(1),
    db.select({ reference: serviceRequests.reference, name: serviceRequests.serviceName, status: serviceRequests.status, createdAt: serviceRequests.createdAt })
      .from(serviceRequests).where(eq(serviceRequests.userId, id)).orderBy(desc(serviceRequests.createdAt)).limit(60),
    db.select({ reference: printJobs.reference, status: printJobs.status, fulfillment: printJobs.fulfillment, createdAt: printJobs.createdAt })
      .from(printJobs).where(eq(printJobs.userId, id)).orderBy(desc(printJobs.createdAt)).limit(50),
    db.select({ id: counterVisits.id, name: counterVisits.serviceName, amount: counterVisits.collectPaise, createdAt: counterVisits.createdAt })
      .from(counterVisits).where(eq(counterVisits.userId, id)).orderBy(desc(counterVisits.createdAt)).limit(60),
    db.select({ kind: walletEntries.kind, amount: walletEntries.amount, description: walletEntries.description, createdAt: walletEntries.createdAt })
      .from(walletEntries).where(eq(walletEntries.userId, id)).orderBy(desc(walletEntries.createdAt)).limit(100),
    db.select().from(addresses).where(eq(addresses.userId, id)).limit(20),
  ]);
  if (!target || target.deletedAt || target.disabledAt) throw new PublicError("This account is no longer available.", 404);
  return {
    user: { id: target.id, name: target.name, email: isPlaceholderEmail(target.email) ? null : target.email,
      phone: target.phone, role: target.role, emailVerified: Boolean(target.emailVerifiedAt),
      phoneVerified: Boolean(target.phoneVerifiedAt), city: target.city, state: target.state, postalCode: target.postalCode },
    requests: requests.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
    jobs: jobs.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
    visits: visits.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
    wallet: wallet.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
    addresses: savedAddresses.map(r => ({ id: r.id, label: r.label, line1: r.line1, city: r.city, state: r.state, postalCode: r.postalCode })),
    expiresAt,
  };
}
async function audit(actorId: string, targetId: string, event: string) {
  await db.insert(activityLog).values({
    kind: "staff", permission: "team", category: "customer-preview",
    title: event, detail: "Admin-only read-only customer preview; no customer login credentials used",
    actorId, refType: "customer-preview", refId: targetId,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Each preview operation proves the original administrator's own session.
    const actor = await requireStaff("admin");
    const input = schema.parse(await readJson(request));
    const jar = await cookies();
    const existing = readPreviewGrant(jar.get(PREVIEW_COOKIE)?.value, actor.id);
    if (input.action === "end") {
      jar.set(previewCookie("", 0));
      if (existing) await audit(actor.id, existing.target, "Administrator ended customer preview");
      return NextResponse.json({ ok: true });
    }
    if (input.action === "create") {
      const phone = normalizePhone(input.phone);
      const name = cleanName(input.name);
      const email = input.email?.trim() ? normalizeEmail(input.email) : null;
      if (!phone || name.length < 2) throw new PublicError("A valid Indian mobile number and customer name are required.", 400);
      if (email && !looksLikeEmail(email)) throw new PublicError("Enter a valid email address or leave it blank.", 400);
      const accounts = await db.select({ id: users.id, role: users.role, name: users.name, email: users.email })
        .from(users).where(and(eq(users.phone, phone), isNull(users.deletedAt))).limit(10);
      if (accounts.length) {
        throw new PublicError("An account already uses this mobile number. Select the exact account from Customers; no duplicate was created.", 409);
      }
      if (email) {
        const [other] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
        if (other) throw new PublicError("This email is already registered. Select the existing account.", 409);
      }
      const generated = email ?? `counter-${phone}@counter.invalid`;
      const [created] = await db.insert(users).values({
        name, phone, email: generated, passwordHash: await hash(randomBytes(32).toString("base64url")),
        signupMethod: "mobile", preferredContact: "whatsapp",
      }).returning({ id: users.id });
      await audit(actor.id, created.id, "Administrator created a customer account for preview");
      return NextResponse.json({ ok: true, userId: created.id, created: true });
    }
    if (input.action === "start") {
      const target = await findTarget(input.userId, actor);
      const grant = createPreviewGrant(actor.id, target.id);
      jar.set(previewCookie(grant, PREVIEW_MS / 1000));
      await audit(actor.id, target.id, "Administrator started customer preview");
      return NextResponse.json({ ok: true, expiresAt: Date.now() + PREVIEW_MS });
    }
    if (!existing) throw new PublicError("The customer preview expired. Return to Customers to start another.", 401);
    const target = await findTarget(existing.target, actor);
    if (input.action === "extend") {
      // Extensions are capped at a 30-minute total session; owner can then start again.
      const now = Date.now();
      const until = Math.min(now + PREVIEW_MS, existing.started + MAX_PREVIEW_MS);
      if (until <= now) throw new PublicError("This preview reached the maximum duration. Start a fresh preview.", 409);
      // The fresh signed grant has its own 15 minute window, but never exceeds the 30 minute cap.
      const grant = createPreviewGrant(actor.id, target.id, now);
      const payload = grant.split(".")[0];
      // Do not hand-modify signed tokens. Extending starts a new audited 15-minute grant.
      void payload;
      jar.set(previewCookie(grant, PREVIEW_MS / 1000));
      await audit(actor.id, target.id, "Administrator extended customer preview");
      return NextResponse.json({ ok: true, expiresAt: now + PREVIEW_MS });
    }
    return NextResponse.json(await previewData(target.id, existing.until), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
