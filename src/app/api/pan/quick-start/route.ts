import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { z } from "zod";
import { serviceRequests, users } from "@/db/schema";
import { getCurrentUser, requestEmailOtp, type User } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { apiError, clientIp, readJson } from "@/lib/http";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { notifyNewRequest, recordEvent, withUniqueReference } from "@/lib/requests";
import { cleanName, looksLikeEmail, normalizeEmail, normalizePhone } from "@/lib/validation";
import { sendRequestWhatsApp } from "@/lib/whatsapp-alerts";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  phone: z.string().trim().min(10, "Enter a valid 10-digit mobile number.").max(20),
  email: z.string().trim().min(5, "Enter a valid email address.").max(200),
});

const LABEL = "PAN assistance – quick start";

/**
 * Step 1 of the PAN flow: name, mobile and email are enough to open a request and tell staff.
 * A visitor gets an account that is not yet verified (the email is confirmed with a code before
 * any payment). The full form comes after this, inside the account.
 */
export async function POST(request: NextRequest) {
  try {
    const input = schema.parse(await readJson(request));
    const name = cleanName(input.name);
    const phone = normalizePhone(input.phone);
    const email = normalizeEmail(input.email);
    if (!phone) throw new PublicError("Enter a valid 10-digit mobile number.", 400, { fields: { phone: "Check the number." } });
    if (!looksLikeEmail(email)) throw new PublicError("Enter a valid email address.", 400, { fields: { email: "Enter a valid email address." } });
    await enforceRate(RATE_RULES.leadsPerIpHour, identity("ip", clientIp(request)), "Too many requests from this network. Please call or WhatsApp us.");

    const current = await getCurrentUser();
    const signedIn = Boolean(current && current.role !== "demo");
    let owner: User | null = signedIn ? current : null;
    let accountCreated = false;

    if (!owner) {
      const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing) {
        if (existing.emailVerifiedAt) throw new PublicError("An account already exists for this email. Sign in to continue.", 409, { code: "account_exists" });
        owner = existing;
      } else {
        // Random password: the visitor signs in with an emailed code, never with this hash.
        const passwordHash = await hash(randomBytes(32).toString("base64url"));
        const [created] = await db.insert(users).values({ name, email, phone, passwordHash, preferredContact: "whatsapp" }).returning();
        owner = created;
        accountCreated = true;
      }
    }

    if (!owner) throw new PublicError("We couldn’t open your request. Please try again or call us.", 500);
    const account: User = owner;
    const lines = [`Applicant: ${name}`, `Contact: ${name} · ${phone}`, `Email: ${email}`, "Next: full PAN form to be completed in the account"];
    const created = await withUniqueReference("PAN", async (reference) => {
      const [row] = await db.insert(serviceRequests).values({
        reference, userId: account.id, serviceSlug: "pan-card", serviceName: LABEL,
        details: { description: "Quick start: name, mobile and email. Full form to follow.", contactName: name, contactPhone: phone, preferredContact: "whatsapp", panQuickStart: true },
        serviceFee: "0.00", externalFee: "0.00",
      }).returning({ id: serviceRequests.id, reference: serviceRequests.reference });
      return row;
    });
    await recordEvent("service", created.id, account.id, null, "submitted", "PAN quick start");
    await notifyNewRequest(account, created.reference, LABEL, lines, "pan");
    sendRequestWhatsApp({ name, phone, reference: created.reference, service: LABEL, details: lines.join(" · ") });

    // Send a sign-in code so the visitor can confirm the email and carry on in the account.
    if (!signedIn) await requestEmailOtp(email, "signin").catch((error) => console.error("[pan] quick-start code not sent", error));

    return NextResponse.json({ ok: true, reference: created.reference, accountCreated, signedIn }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
