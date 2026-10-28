import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { serviceRequests, users } from "@/db/schema";
import { requestEmailOtp, type User } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { notifyNewRequest, recordEvent, withUniqueReference } from "@/lib/requests";
import { sendRequestWhatsApp } from "@/lib/whatsapp-alerts";

/** Services that need the customer's own account (documents, uploads or a dedicated form). */
export const ACCOUNT_ONLY_SERVICES = ["voter-id", "passport-driving-licence", "pan-card", "printing-scanning"] as const;

/**
 * Finds the account for this email, or creates an unverified one. The random password is never
 * shown: the visitor signs in with an emailed code, which also verifies the email.
 * A verified account is never taken over; the caller gets a clear "sign in" error instead.
 */
export async function findOrCreateVisitor(input: { name: string; phone: string; email: string }): Promise<{ account: User; created: boolean }> {
  const [existing] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  if (existing) {
    if (existing.emailVerifiedAt) throw new PublicError("An account already exists for this email. Sign in to continue.", 409, { code: "account_exists" });
    return { account: existing, created: false };
  }
  const passwordHash = await hash(randomBytes(32).toString("base64url"));
  const [created] = await db.insert(users).values({ name: input.name, email: input.email, phone: input.phone, passwordHash, preferredContact: "whatsapp" }).returning();
  if (!created) throw new PublicError("We couldn’t open your request. Please try again or call us.", 500);
  return { account: created, created: true };
}

export type GuestIntakeInput = {
  serviceSlug: string;
  serviceName: string;
  category: string | null;
  description: string;
  name: string;
  phone: string;
  email: string;
  preferredContact: "email" | "phone" | "whatsapp";
  consentedAt: Date;
};

/**
 * Opens a request for a visitor: account, request in the Query state (status "submitted"),
 * staff alert, WhatsApp to the shop, and a sign-in code to verify the email.
 */
export async function openGuestRequest(input: GuestIntakeInput) {
  const { account, created: accountCreated } = await findOrCreateVisitor(input);
  const lines = [
    `Service: ${input.serviceName}`,
    `Applicant: ${input.name}`,
    `Contact: ${input.name} · ${input.phone} (prefers ${input.preferredContact})`,
    `Email: ${input.email}`,
    `Need: ${input.description.slice(0, 300)}`,
    `Consents given: ${input.consentedAt.toISOString()}`,
  ];
  const row = await withUniqueReference("NC", async (reference) => {
    const [inserted] = await db.insert(serviceRequests).values({
      reference, userId: account.id, serviceSlug: input.serviceSlug, serviceName: input.serviceName,
      details: {
        description: input.description, contactName: input.name, contactPhone: input.phone, preferredContact: input.preferredContact,
        source: "guest-intake", consents: { terms: input.consentedAt.toISOString(), contact: input.consentedAt.toISOString() },
      },
      serviceFee: "0.00", externalFee: "0.00",
    }).returning({ id: serviceRequests.id, reference: serviceRequests.reference });
    if (!inserted) throw new PublicError("We couldn’t open your request. Please try again or call us.", 500);
    return inserted;
  });
  await recordEvent("service", row.id, account.id, null, "submitted", "Opened by visitor (query)");
  await notifyNewRequest(account, row.reference, input.serviceName, lines, input.category ?? undefined);
  sendRequestWhatsApp({ name: input.name, phone: input.phone, reference: row.reference, service: input.serviceName, details: lines.join(" · ") });
  await requestEmailOtp(input.email, "signin").catch((error) => console.error("[intake] sign-in code not sent", error));
  return { reference: row.reference, accountCreated };
}
