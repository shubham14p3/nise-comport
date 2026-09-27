import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { serviceRequests, storedFiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, makeReference } from "@/lib/http";
import { serviceCatalog } from "@/lib/services";

const schema = z.object({ serviceSlug: z.string().min(2).max(80), description: z.string().trim().min(8).max(1500), fileId: z.uuid().optional() });
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to submit a request." }, { status: 401 });
  try {
    const input = schema.parse(await request.json());
    const service = serviceCatalog.find((item) => item.slug === input.serviceSlug);
    if (!service) return NextResponse.json({ error: "Choose one of the listed services." }, { status: 400 });
    if (input.fileId) {
      const [file] = await db.select({ id: storedFiles.id, requestId: storedFiles.requestId }).from(storedFiles).where(and(eq(storedFiles.id, input.fileId), eq(storedFiles.userId, user.id))).limit(1);
      if (!file || file.requestId) return NextResponse.json({ error: "Supporting upload is unavailable. Upload it again." }, { status: 400 });
    }
    const [created] = await db.insert(serviceRequests).values({
      reference: makeReference("NC"), userId: user.id, serviceSlug: service.slug, serviceName: service.title,
      details: { description: input.description }, serviceFee: "0.00", externalFee: "0.00",
    }).returning({ id: serviceRequests.id, reference: serviceRequests.reference, status: serviceRequests.status });
    if (input.fileId) await db.update(storedFiles).set({ requestId: created.id }).where(and(eq(storedFiles.id, input.fileId), eq(storedFiles.userId, user.id)));
    return NextResponse.json({ ok: true, request: created }, { status: 201 });
  } catch (error) { return apiError(error); }
}
