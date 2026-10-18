import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { serviceRequests, serviceReviews } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, readJson } from "@/lib/http";
import { site } from "@/lib/site";
import { statusLabel } from "@/lib/requests";

async function findOwnRequest(reference: string, userId: string) {
  const [row] = await db.select({ id: serviceRequests.id, reference: serviceRequests.reference, serviceName: serviceRequests.serviceName, status: serviceRequests.status })
    .from(serviceRequests).where(and(eq(serviceRequests.reference, reference), eq(serviceRequests.userId, userId))).limit(1);
  return row ?? null;
}

/** What the /review/<reference> page needs: whether rating is open yet, and any existing rating. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const user = await requireUser();
    const { reference } = await params;
    const clean = reference.slice(0, 80);
    if (!/^[A-Z0-9-]{4,80}$/i.test(clean)) return NextResponse.json({ error: "Request not found." }, { status: 404 });
    const item = await findOwnRequest(clean, user.id);
    if (!item) return NextResponse.json({ error: "Request not found." }, { status: 404 });
    const [existing] = await db.select({ rating: serviceReviews.rating, feedback: serviceReviews.feedback, postedGoogleReview: serviceReviews.postedGoogleReview })
      .from(serviceReviews).where(eq(serviceReviews.requestId, item.id)).limit(1);
    return NextResponse.json({
      reference: item.reference, serviceName: item.serviceName, status: item.status, statusLabel: statusLabel(item.status),
      completed: item.status === "completed",
      existing: existing ?? null,
      googleReviewUrl: site.reviewUrl ?? null,
    }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

const schema = z.object({ rating: z.number().int().min(1).max(5), feedback: z.string().trim().max(1000).optional() });

/** Upserts the customer's own rating + feedback for a completed request. One review per request. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const user = await requireUser();
    const { reference } = await params;
    const clean = reference.slice(0, 80);
    if (!/^[A-Z0-9-]{4,80}$/i.test(clean)) return NextResponse.json({ error: "Request not found." }, { status: 404 });
    const item = await findOwnRequest(clean, user.id);
    if (!item) return NextResponse.json({ error: "Request not found." }, { status: 404 });
    if (item.status !== "completed") return NextResponse.json({ error: "This request isn't marked complete yet, so there's nothing to rate." }, { status: 409 });
    const input = schema.parse(await readJson(request));
    const feedback = input.feedback?.trim() || null;
    await db.insert(serviceReviews).values({ requestId: item.id, userId: user.id, rating: input.rating, feedback })
      .onConflictDoUpdate({ target: serviceReviews.requestId, set: { rating: input.rating, feedback, updatedAt: new Date() } });
    return NextResponse.json({ ok: true, rating: input.rating, googleReviewUrl: input.rating >= 4 ? (site.reviewUrl ?? null) : null });
  } catch (error) { return apiError(error); }
}
