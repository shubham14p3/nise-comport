import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { contacts, serviceRequests, storedFiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { apiError, clientIp, readJson } from "@/lib/http";
import { createLead } from "@/lib/leads";
import { checkInsuranceForm, PURPOSES, renewalDate, summariseInsurance } from "@/lib/motor-insurance";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { notifyNewRequest, recordEvent, withUniqueReference } from "@/lib/requests";
import { findService } from "@/lib/services";
import { normalizePhone } from "@/lib/validation";

export const runtime = "nodejs";

const body = z.object({ form: z.record(z.string(), z.unknown()), fileIds: z.array(z.uuid()).max(4).optional(), consent: z.literal(true) });

/**
 * Car / bike insurance form: new policy, renewal, expired policy or claim help.
 * Signed-in customers get a tracked request (with their uploads); visitors become a call-back lead.
 * Either way the renewal date is kept for WhatsApp renewal reminders.
 */
export async function POST(request: NextRequest) {
  try {
    const input = body.parse(await readJson(request));
    const { form, problems } = checkInsuranceForm(input.form);
    if (Object.keys(problems).length) throw new PublicError(Object.values(problems)[0], 400, { fields: problems });
    const phone = normalizePhone(form.phone)!;
    const whatsapp = form.whatsapp ? normalizePhone(form.whatsapp) : null;
    await enforceRate(RATE_RULES.leadsPerIpHour, identity("ip", clientIp(request)), "Too many requests.");
    await enforceRate(RATE_RULES.leadsPerPhoneDay, identity("lead-phone", phone), "We already have your request and will call you.");
    const summary = summariseInsurance(form);
    const topic = `${form.vehicle === "car" ? "Car" : "Bike"} insurance · ${PURPOSES[form.purpose]}`;
    const renewOn = renewalDate(form);

    // Keep the number (and renewal date) for reminders without changing an existing YES/STOP.
    const contactPhone = whatsapp ?? phone;
    const [existing] = await db.select({ id: contacts.id, services: contacts.services }).from(contacts).where(eq(contacts.phone, contactPhone)).limit(1);
    if (!existing) await db.insert(contacts).values({ name: form.name, phone: contactPhone, source: "insurance form", services: [{ service: "insurance", renewalOn: renewOn, note: form.regNo || null }] }).onConflictDoNothing();
    else if (renewOn) {
      const services = (existing.services ?? []).filter((item) => item.service !== "insurance");
      await db.update(contacts).set({ services: [...services, { service: "insurance", renewalOn: renewOn, note: form.regNo || null }].slice(0, 12), updatedAt: new Date() }).where(eq(contacts.id, existing.id));
    }

    const user = await getCurrentUser();
    if (!user || user.role === "demo") {
      const lead = await createLead({ name: form.name, phone, topic, message: summary.join("\n"), page: "/insurance", source: "form", details: { insurance: form } });
      return NextResponse.json({ ok: true, kind: "lead", id: lead.id }, { status: 201 });
    }

    const service = findService(form.vehicle === "car" ? "car-insurance-jamshedpur" : "bike-insurance-jamshedpur")!;
    const fileIds = input.fileIds ?? [];
    if (fileIds.length) {
      const files = await db.select({ id: storedFiles.id }).from(storedFiles).where(and(inArray(storedFiles.id, fileIds), eq(storedFiles.userId, user.id), isNull(storedFiles.requestId)));
      if (files.length !== fileIds.length) throw new PublicError("One of the attached files is no longer available. Please attach it again.", 400, { fields: { files: "Attach again." } });
    }
    const created = await withUniqueReference("NC", async (reference) => {
      const [row] = await db.insert(serviceRequests).values({
        reference, userId: user.id, serviceSlug: service.slug, serviceName: `${service.title} – ${PURPOSES[form.purpose]}`,
        details: { description: summary.join("\n"), contactName: form.name, contactPhone: phone, preferredContact: "whatsapp", insurance: form },
        serviceFee: "0.00", externalFee: "0.00",
      }).returning({ id: serviceRequests.id, reference: serviceRequests.reference, status: serviceRequests.status });
      return row;
    });
    if (fileIds.length) await db.update(storedFiles).set({ requestId: created.id }).where(and(inArray(storedFiles.id, fileIds), eq(storedFiles.userId, user.id)));
    await recordEvent("service", created.id, user.id, null, "submitted", "Insurance form");
    await notifyNewRequest(user, created.reference, topic, summary, "insurance");
    return NextResponse.json({ ok: true, kind: "request", request: created }, { status: 201 });
  } catch (error) { return apiError(error); }
}
