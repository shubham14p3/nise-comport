import { awardLoyalty } from "@/lib/loyalty";
import { NextRequest, NextResponse, after } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { printJobs, serviceRequests, users, payments } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { deliverNotifications, queueNotification } from "@/lib/notifications";
import { releaseRedemptions } from "@/lib/promotions";
import { recordEvent, REQUEST_STATUSES, statusLabel } from "@/lib/requests";
import { logActivity } from "@/lib/activity";
import { sendOfficialReferenceWhatsApp, sendReviewRequestWhatsApp, sendStatusWhatsApp } from "@/lib/whatsapp-alerts";
import { site } from "@/lib/site";

const schema = z.object({
  kind: z.enum(["print", "service"]),
  status: z.enum(REQUEST_STATUSES),
  /** The status the staff member saw. If someone else changed it meanwhile, the update is refused. */
  expectedStatus: z.string().max(40).optional(),
  note: z.string().trim().max(500).optional(),
  notifyCustomer: z.boolean().optional().default(true),
  /**
   * The real number the government portal / ECI / insurer issues once staff actually file the
   * application there — distinct from our own internal `reference`. Only meaningful for
   * kind: "service". officialReferenceLabel names what it is ("ServicePlus application no.",
   * "EPIC no.", "Policy no.", etc). Sending an empty string clears a previously-set value.
   */
  officialReference: z.string().trim().max(80).optional(),
  officialReferenceLabel: z.string().trim().max(60).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requirePermission("requests");
    const input = schema.parse(await readJson(request));
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new PublicError("Not found.", 404);
    // Print orders have no official-reference columns; select `reference` under the same key so
    // both branches share a type — officialChanged is always false for kind: "print", so it's unused.
    const [current] = input.kind === "print"
      ? await db.select({ id: printJobs.id, reference: printJobs.reference, userId: printJobs.userId, status: printJobs.status, label: printJobs.fileName, officialReference: printJobs.reference, officialReferenceLabel: printJobs.reference }).from(printJobs).where(eq(printJobs.id, id)).limit(1)
      : await db.select({ id: serviceRequests.id, reference: serviceRequests.reference, userId: serviceRequests.userId, status: serviceRequests.status, label: serviceRequests.serviceName, officialReference: serviceRequests.officialReference, officialReferenceLabel: serviceRequests.officialReferenceLabel }).from(serviceRequests).where(eq(serviceRequests.id, id)).limit(1);
    if (!current) throw new PublicError(input.kind === "print" ? "Print order not found." : "Service request not found.", 404);
    if (input.expectedStatus && input.expectedStatus !== current.status) {
      throw new PublicError(`Someone else changed this to “${statusLabel(current.status)}”. Refresh the queue before updating.`, 409, { code: "stale_status" });
    }
    if(input.kind==="service" && input.status!==current.status && ["awaiting_payment","payment_received"].includes(input.status)){
      const [payment]=await db.select({status:payments.status}).from(payments).where(eq(payments.requestId,id)).orderBy(desc(payments.createdAt)).limit(1);
      if(input.status==="awaiting_payment" && !payment)
        throw new PublicError("First approve the review and issue a payment quote.",409);
      if(input.status==="payment_received" && payment?.status!=="paid")
        throw new PublicError("Do not mark payment received manually. Verify it through the payment gateway or the bank-confirmed UPI/desk payment.",409);
    }
    // Official reference numbers (ServicePlus application no., EPIC no., policy no., ...) only apply
    // to service requests filed with a real government portal or insurer — never to print orders.
    const officialChanged = input.kind === "service"
      && input.officialReference !== undefined
      && input.officialReference !== (current.officialReference ?? "");
    if (current.status === input.status && !input.note && !officialChanged) {
      return NextResponse.json({ ok: true, status: current.status, unchanged: true });
    }

    const now = new Date();
    const [updated] = input.kind === "print"
      ? await db.update(printJobs).set({ status: input.status, updatedAt: now }).where(and(eq(printJobs.id, id), eq(printJobs.status, current.status))).returning({ id: printJobs.id })
      : await db.update(serviceRequests).set({
          status: input.status, updatedAt: now,
          ...(officialChanged ? {
            officialReference: input.officialReference || null,
            officialReferenceLabel: input.officialReference ? (input.officialReferenceLabel || current.officialReferenceLabel || "Official reference") : null,
            officialReferenceSetAt: input.officialReference ? now : null,
          } : {}),
        }).where(and(eq(serviceRequests.id, id), eq(serviceRequests.status, current.status))).returning({ id: serviceRequests.id });
    if (!updated) throw new PublicError("This item changed while you were updating it. Refresh and try again.", 409, { code: "stale_status" });
    await recordEvent(input.kind, id, staff.id, current.status, input.status, input.note);
    await logActivity({ kind: "status", permission: "requests", category: input.kind === "print" ? "print" : null, title: `${staff.name} moved ${current.reference} to “${statusLabel(input.status)}”`, detail: input.note || current.label, refType: "request", refId: current.reference, actorId: staff.id });
    if (officialChanged) {
      await logActivity({ kind: "status", permission: "requests", category: null, title: `${staff.name} ${input.officialReference ? "added" : "cleared"} the official reference for ${current.reference}`, detail: input.officialReference ? `${input.officialReferenceLabel || "Official reference"}: ${input.officialReference}` : null, refType: "request", refId: current.reference, actorId: staff.id });
    }
    // A cancelled order gives its coupon back so the customer can use it again.
    if (input.status === "cancelled") await releaseRedemptions(input.kind, id);
    // Thank-you wallet credit for finished insurance, certificate and print work (once per order).
    if (input.status === "completed") await awardLoyalty(input.kind, id).catch((error) => console.error("[loyalty] could not award credit", error));

    const statusChanged = current.status !== input.status;
    if (input.notifyCustomer && (statusChanged || (officialChanged && input.officialReference))) {
      const [customer] = await db.select({ name: users.name, email: users.email, phone: users.phone, whatsapp: users.whatsapp, deletedAt: users.deletedAt }).from(users).where(eq(users.id, current.userId)).limit(1);
      if (customer && !customer.deletedAt) {
        const label = input.kind === "print" ? "print order" : current.label;
        const statusText = statusLabel(input.status);
        const officialLabel = input.officialReferenceLabel || current.officialReferenceLabel || "Official reference";
        if (officialChanged && input.officialReference) {
          // A freshly-added or changed official number gets its own clear message, separate from
          // an ordinary status update, so the customer notices there's a new number to keep.
          try {
            const notificationId = await queueNotification(current.userId, "official_reference", {
              name: customer.name, email: customer.email, reference: current.reference, label, status: statusText,
              officialReference: input.officialReference, officialReferenceLabel: officialLabel,
            });
            after(async () => { try { await deliverNotifications([notificationId]); } catch (error) { console.error("[admin] official reference email failed; cron will retry", error); } });
          } catch (error) { console.error("[admin] could not queue official reference email", error); }
          sendOfficialReferenceWhatsApp({ name: customer.name, phone: customer.whatsapp ?? customer.phone ?? null, reference: current.reference, officialReference: input.officialReference, officialReferenceLabel: officialLabel });
        } else if (statusChanged) {
          try {
            const notificationId = await queueNotification(current.userId, "status_update", {
              name: customer.name, email: customer.email, reference: current.reference, label, status: statusText,
              ...(current.officialReference ? { officialReference: current.officialReference, officialReferenceLabel: officialLabel } : {}),
            });
            after(async () => { try { await deliverNotifications([notificationId]); } catch (error) { console.error("[admin] status email failed; cron will retry", error); } });
          } catch (error) { console.error("[admin] could not queue status email", error); }
          sendStatusWhatsApp({ name: customer.name, phone: customer.whatsapp ?? customer.phone ?? null, reference: current.reference, service: label, status: statusText });
          // Service requests marked complete are the moment to ask for a rating — never for print orders.
          if (input.kind === "service" && input.status === "completed") {
            try {
              const reviewNotificationId = await queueNotification(current.userId, "review_request", {
                name: customer.name, email: customer.email, reference: current.reference, label,
              });
              after(async () => { try { await deliverNotifications([reviewNotificationId]); } catch (error) { console.error("[admin] review request email failed; cron will retry", error); } });
            } catch (error) { console.error("[admin] could not queue review request email", error); }
            sendReviewRequestWhatsApp({ name: customer.name, phone: customer.whatsapp ?? customer.phone ?? null, reference: current.reference, service: label, reviewLink: `${site.url}/review/${encodeURIComponent(current.reference)}` });
          }
        }
      }
    }
    return NextResponse.json({ ok: true, status: input.status, ...(officialChanged ? { officialReference: input.officialReference || null } : {}) });
  } catch (error) { return apiError(error); }
}
