import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { requestEvents, serviceRequests, serviceReviews, users } from "@/db/schema";
import { statusLabel } from "@/lib/requests";
import { apiError } from "@/lib/http";
import { revealRequestDetails } from "@/lib/detailed-intake-server";

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
    const [review] = await db.select({ rating: serviceReviews.rating, feedback: serviceReviews.feedback, postedGoogleReview: serviceReviews.postedGoogleReview, createdAt: serviceReviews.createdAt })
      .from(serviceReviews).where(eq(serviceReviews.requestId, row.request.id)).limit(1);
    const events = await db.select({
      fromStatus: requestEvents.fromStatus, toStatus: requestEvents.toStatus, note: requestEvents.note,
      createdAt: requestEvents.createdAt, actor: users.name,
    }).from(requestEvents).leftJoin(users, eq(requestEvents.actorId, users.id))
      .where(and(eq(requestEvents.requestKind, "service"), eq(requestEvents.requestId, row.request.id))).orderBy(asc(requestEvents.createdAt));
    return NextResponse.json({
      request: {
        id: row.request.id, reference: row.request.reference, serviceName: row.request.serviceName, status: row.request.status,
        statusLabel: statusLabel(row.request.status), details: revealRequestDetails(row.request.details as Record<string, unknown>), createdAt: row.request.createdAt.toISOString(),
        officialReference: row.request.officialReference, officialReferenceLabel: row.request.officialReferenceLabel,
        officialReferenceSetAt: row.request.officialReferenceSetAt?.toISOString() ?? null,
      },
      customer: row.customer,
      review: review ? { ...review, createdAt: review.createdAt.toISOString() } : null,
      events: events.map((event) => ({ ...event, fromLabel: event.fromStatus ? statusLabel(event.fromStatus) : null, toLabel: statusLabel(event.toStatus), createdAt: event.createdAt.toISOString() })),
    }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
