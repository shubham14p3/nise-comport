import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { requestEvents, serviceRequests, users } from "@/db/schema";
import { statusLabel } from "@/lib/requests";
import { apiError } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("requests");
    const id = (request.nextUrl.searchParams.get("id") ?? "").slice(0, 80);
    if (!/^[a-f0-9-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const [row] = await db.select({
      request: serviceRequests,
      customer: { name: users.name, email: users.email, phone: users.phone, whatsapp: users.whatsapp, preferredContact: users.preferredContact },
    }).from(serviceRequests).innerJoin(users, eq(serviceRequests.userId, users.id)).where(eq(serviceRequests.id, id)).limit(1);
    if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const events = await db.select({
      fromStatus: requestEvents.fromStatus, toStatus: requestEvents.toStatus, note: requestEvents.note,
      createdAt: requestEvents.createdAt, actor: users.name,
    }).from(requestEvents).leftJoin(users, eq(requestEvents.actorId, users.id))
      .where(and(eq(requestEvents.requestKind, "service"), eq(requestEvents.requestId, row.request.id))).orderBy(asc(requestEvents.createdAt));
    return NextResponse.json({
      request: {
        id: row.request.id, reference: row.request.reference, serviceName: row.request.serviceName, status: row.request.status,
        statusLabel: statusLabel(row.request.status), details: row.request.details, createdAt: row.request.createdAt.toISOString(),
      },
      customer: row.customer,
      events: events.map((event) => ({ ...event, fromLabel: event.fromStatus ? statusLabel(event.fromStatus) : null, toLabel: statusLabel(event.toStatus), createdAt: event.createdAt.toISOString() })),
    }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
