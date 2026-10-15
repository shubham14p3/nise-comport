import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { requestEvents, serviceRequests, storedFiles } from "@/db/schema";
import { apiError } from "@/lib/http";
import { CUSTOMER_CANCELLABLE, statusLabel, type RequestStatus } from "@/lib/requests";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const reference = (request.nextUrl.searchParams.get("reference") ?? "").slice(0, 80);
    if (!/^[A-Z0-9-]{4,80}$/i.test(reference)) return NextResponse.json({ error: "Request not found." }, { status: 404 });
    const [item] = await db.select().from(serviceRequests).where(and(eq(serviceRequests.reference, reference), eq(serviceRequests.userId, user.id))).limit(1);
    if (!item) return NextResponse.json({ error: "Request not found." }, { status: 404 });
    const [files, events] = await Promise.all([
      db.select({ name: storedFiles.originalName, createdAt: storedFiles.createdAt }).from(storedFiles).where(and(eq(storedFiles.requestId, item.id), eq(storedFiles.userId, user.id))),
      db.select({ toStatus: requestEvents.toStatus, createdAt: requestEvents.createdAt }).from(requestEvents)
        .where(and(eq(requestEvents.requestKind, "service"), eq(requestEvents.requestId, item.id))).orderBy(asc(requestEvents.createdAt)),
    ]);
    return NextResponse.json({
      request: {
        reference: item.reference, serviceSlug: item.serviceSlug, serviceName: item.serviceName,
        status: item.status, statusLabel: statusLabel(item.status), details: item.details,
        createdAt: item.createdAt.toISOString(), cancellable: CUSTOMER_CANCELLABLE.includes(item.status as RequestStatus),
      },
      files: files.map((file) => ({ name: file.name, createdAt: file.createdAt.toISOString() })),
      events: events.map((event) => ({ toStatus: event.toStatus, label: statusLabel(event.toStatus), createdAt: event.createdAt.toISOString() })),
    }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
