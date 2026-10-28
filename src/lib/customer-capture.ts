import { eq } from "drizzle-orm";
import { contacts } from "@/db/schema";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/validation";

/**
 * Keeps Records growing: every new request adds the customer once (matched by phone),
 * and adds the service to an existing customer. Never throws, so a request is never lost because of this.
 */
export async function captureCustomer(input: { name: string; phone: string | null | undefined; email?: string | null; serviceSlug: string; source?: string }) {
  try {
    const phone = input.phone ? normalizePhone(input.phone) : null;
    if (!phone) return;
    const [existing] = await db.select({ id: contacts.id, services: contacts.services, email: contacts.email }).from(contacts).where(eq(contacts.phone, phone)).limit(1);
    if (!existing) {
      await db.insert(contacts).values({ name: input.name.slice(0, 100) || "Customer", phone, email: input.email ?? null, source: input.source ?? "request", services: [{ service: input.serviceSlug }] }).onConflictDoNothing();
      return;
    }
    const current = existing.services ?? [];
    const services = current.some((item) => item.service === input.serviceSlug) ? current : [...current, { service: input.serviceSlug }].slice(0, 12);
    await db.update(contacts).set({ services, email: existing.email ?? input.email ?? null, updatedAt: new Date() }).where(eq(contacts.id, existing.id));
  } catch (error) {
    console.error("customer capture failed", error);
  }
}
