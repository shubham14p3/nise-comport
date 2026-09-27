import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { notifications, printJobs, serviceRequests, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({ kind: z.enum(["print", "service"]), status: z.enum(["submitted", "reviewing", "waiting_for_customer", "ready_for_pickup", "out_for_delivery", "completed", "cancelled"]) });
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentUser();
  if (!staff || !["admin", "staff"].includes(staff.role)) return NextResponse.json({ error: "Staff access is required." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid status." }, { status: 400 });
  const { id } = await params;
  const now = new Date();
  if (parsed.data.kind === "print") {
    const [job] = await db.select({ id: printJobs.id, reference: printJobs.reference, userId: printJobs.userId }).from(printJobs).where(eq(printJobs.id, id)).limit(1);
    if (!job) return NextResponse.json({ error: "Print order not found." }, { status: 404 });
    await db.update(printJobs).set({ status: parsed.data.status, updatedAt: now }).where(eq(printJobs.id, id));
    const [customer] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, job.userId)).limit(1);
    if (customer) await db.insert(notifications).values({ userId: job.userId, channel: "email", kind: "status_update", status: "queued", payload: { name: customer.name, email: customer.email, reference: job.reference, label: "print order", status: parsed.data.status.replaceAll("_", " ") } });
  } else {
    const [service] = await db.select({ id: serviceRequests.id, reference: serviceRequests.reference, serviceName: serviceRequests.serviceName, userId: serviceRequests.userId }).from(serviceRequests).where(eq(serviceRequests.id, id)).limit(1);
    if (!service) return NextResponse.json({ error: "Service request not found." }, { status: 404 });
    await db.update(serviceRequests).set({ status: parsed.data.status, updatedAt: now }).where(eq(serviceRequests.id, id));
    const [customer] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, service.userId)).limit(1);
    if (customer) await db.insert(notifications).values({ userId: service.userId, channel: "email", kind: "status_update", status: "queued", payload: { name: customer.name, email: customer.email, reference: service.reference, label: service.serviceName, status: parsed.data.status.replaceAll("_", " ") } });
  }
  return NextResponse.json({ ok: true });
}
