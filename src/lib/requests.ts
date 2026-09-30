import { after } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { requestEvents, serviceRequests } from "@/db/schema";
import type { User } from "@/lib/auth";
import { isUniqueViolation, postgresCode, PublicError } from "@/lib/errors";
import { makeReference } from "@/lib/http";
import { deliverNotifications, queueNotification, staffAlertEmail } from "@/lib/notifications";

export const REQUEST_STATUSES = ["submitted", "reviewing", "waiting_for_customer", "ready_for_pickup", "out_for_delivery", "completed", "cancelled"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
/** Customers may cancel only before work is ready. */
export const CUSTOMER_CANCELLABLE: RequestStatus[] = ["submitted", "reviewing", "waiting_for_customer"];

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    submitted: "Submitted", reviewing: "Being reviewed", waiting_for_customer: "Waiting for you", ready_for_pickup: "Ready for pickup",
    out_for_delivery: "Out for delivery", completed: "Completed", cancelled: "Cancelled", rejected: "Rejected", closed: "Closed",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

/**
 * Runs an insert that needs a unique reference, retrying with a fresh reference on the (very rare)
 * collision. Other unique violations (e.g. a repeated idempotency key) are re-thrown.
 */
export async function withUniqueReference<T>(prefix: string, insert: (reference: string) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await insert(makeReference(prefix));
    } catch (error) {
      const constraint = (error as { cause?: { constraint?: string }; constraint?: string })?.cause?.constraint ?? (error as { constraint?: string })?.constraint ?? "";
      if (isUniqueViolation(error) && constraint.includes("reference")) continue;
      throw error;
    }
  }
  throw new PublicError("We couldn’t create a reference number. Please try again.", 503);
}

export function isIdempotencyConflict(error: unknown) {
  const constraint = (error as { cause?: { constraint?: string }; constraint?: string })?.cause?.constraint ?? (error as { constraint?: string })?.constraint ?? "";
  return postgresCode(error) === "23505" && constraint.includes("idempotency");
}

export async function recordEvent(kind: "service" | "print", requestId: string, actorId: string | null, fromStatus: string | null, toStatus: string, note?: string) {
  await db.insert(requestEvents).values({ requestKind: kind, requestId, actorId, fromStatus, toStatus, note: note?.slice(0, 500) || null });
}

/** Queues the customer confirmation and the staff alert, then tries to send both right after the response. */
export async function notifyNewRequest(user: User, reference: string, label: string, extraLines: string[] = []) {
  const ids: string[] = [];
  try {
    ids.push(await queueNotification(user.id, "request_received", { name: user.name, email: user.email, reference, label }));
    ids.push(await queueNotification(user.id, "staff_alert", {
      email: staffAlertEmail(),
      subject: `New request ${reference}: ${label}`,
      lines: [`Customer: ${user.name} <${user.email}>${user.phone ? ` · ${user.phone}` : ""}`, `Service: ${label}`, `Reference: ${reference}`, ...extraLines],
    }));
  } catch (error) {
    // A notification problem must never lose the customer's request.
    console.error("[requests] could not queue notifications", error);
    return;
  }
  after(async () => {
    try { await deliverNotifications(ids); } catch (error) { console.error("[requests] immediate delivery failed; cron will retry", error); }
  });
}

export async function cancelServiceRequest(user: User, reference: string, reason: string) {
  const [request] = await db.select().from(serviceRequests).where(and(eq(serviceRequests.reference, reference), eq(serviceRequests.userId, user.id))).limit(1);
  if (!request) throw new PublicError("Request not found.", 404, { code: "not_found" });
  if (request.status === "cancelled") return { status: "cancelled" as const, alreadyCancelled: true };
  if (!CUSTOMER_CANCELLABLE.includes(request.status as RequestStatus)) {
    throw new PublicError(`This request is “${statusLabel(request.status)}” and can’t be cancelled online. Please call or WhatsApp the service desk.`, 409, { code: "not_cancellable" });
  }
  const [updated] = await db.update(serviceRequests).set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(serviceRequests.id, request.id), inArray(serviceRequests.status, CUSTOMER_CANCELLABLE))).returning({ id: serviceRequests.id });
  if (!updated) throw new PublicError("The status of this request just changed. Reload the page and try again.", 409, { code: "stale_status" });
  await recordEvent("service", request.id, user.id, request.status, "cancelled", reason ? `Customer: ${reason}` : "Cancelled by customer");
  try {
    const id = await queueNotification(user.id, "staff_alert", { email: staffAlertEmail(), subject: `Request ${reference} cancelled by customer`, lines: [`Customer: ${user.name} <${user.email}>`, `Service: ${request.serviceName}`, reason ? `Reason: ${reason}` : "No reason given."] });
    after(async () => { try { await deliverNotifications([id]); } catch (error) { console.error("[requests] cancel alert failed", error); } });
  } catch (error) { console.error("[requests] could not queue cancel alert", error); }
  return { status: "cancelled" as const, alreadyCancelled: false };
}
