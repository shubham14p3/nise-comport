import { NextRequest, NextResponse, after } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { printJobs, serviceRequests, users } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { deliverNotifications, queueNotification } from "@/lib/notifications";
import { releaseRedemptions } from "@/lib/promotions";
import { recordEvent, REQUEST_STATUSES, statusLabel } from "@/lib/requests";

const schema = z.object({
  kind: z.enum(["print", "service"]),
  status: z.enum(REQUEST_STATUSES),
  /** The status the staff member saw. If someone else changed it meanwhile, the update is refused. */
  expectedStatus: z.string().max(40).optional(),
  note: z.string().trim().max(500).optional(),
  notifyCustomer: z.boolean().optional().default(true),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();
    const input = schema.parse(await readJson(request));
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new PublicError("Not found.", 404);
    const [current] = input.kind === "print"
      ? await db.select({ id: printJobs.id, reference: printJobs.reference, userId: printJobs.userId, status: printJobs.status, label: printJobs.fileName }).from(printJobs).where(eq(printJobs.id, id)).limit(1)
      : await db.select({ id: serviceRequests.id, reference: serviceRequests.reference, userId: serviceRequests.userId, status: serviceRequests.status, label: serviceRequests.serviceName }).from(serviceRequests).where(eq(serviceRequests.id, id)).limit(1);
    if (!current) throw new PublicError(input.kind === "print" ? "Print order not found." : "Service request not found.", 404);
    if (input.expectedStatus && input.expectedStatus !== current.status) {
      throw new PublicError(`Someone else changed this to “${statusLabel(current.status)}”. Refresh the queue before updating.`, 409, { code: "stale_status" });
    }
    if (current.status === input.status && !input.note) return NextResponse.json({ ok: true, status: current.status, unchanged: true });

    const now = new Date();
    const [updated] = input.kind === "print"
      ? await db.update(printJobs).set({ status: input.status, updatedAt: now }).where(and(eq(printJobs.id, id), eq(printJobs.status, current.status))).returning({ id: printJobs.id })
      : await db.update(serviceRequests).set({ status: input.status, updatedAt: now }).where(and(eq(serviceRequests.id, id), eq(serviceRequests.status, current.status))).returning({ id: serviceRequests.id });
    if (!updated) throw new PublicError("This item changed while you were updating it. Refresh and try again.", 409, { code: "stale_status" });
    await recordEvent(input.kind, id, staff.id, current.status, input.status, input.note);
    // A cancelled order gives its coupon back so the customer can use it again.
    if (input.status === "cancelled") await releaseRedemptions(input.kind, id);

    if (input.notifyCustomer && current.status !== input.status) {
      const [customer] = await db.select({ name: users.name, email: users.email, deletedAt: users.deletedAt }).from(users).where(eq(users.id, current.userId)).limit(1);
      if (customer && !customer.deletedAt) {
        try {
          const notificationId = await queueNotification(current.userId, "status_update", {
            name: customer.name, email: customer.email, reference: current.reference,
            label: input.kind === "print" ? "print order" : current.label, status: statusLabel(input.status),
          });
          after(async () => { try { await deliverNotifications([notificationId]); } catch (error) { console.error("[admin] status email failed; cron will retry", error); } });
        } catch (error) { console.error("[admin] could not queue status email", error); }
      }
    }
    return NextResponse.json({ ok: true, status: input.status });
  } catch (error) { return apiError(error); }
}
