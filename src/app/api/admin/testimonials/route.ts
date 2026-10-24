import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { hasPermission } from "@/lib/permissions";
import { adminTestimonials, createTestimonial, deleteTestimonial, updateTestimonial } from "@/lib/testimonials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function editor() {
  const user = await getCurrentUser();
  return user && hasPermission(user, "content") ? user : null;
}

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    authorName: z.string().trim().min(1).max(120),
    rating: z.number().int().min(1).max(5),
    body: z.string().trim().min(1).max(1000),
    category: z.string().trim().max(60).default("general"),
    serviceSlug: z.string().trim().max(80).nullable().optional(),
    source: z.string().trim().max(40).default("google"),
    reviewedOn: z.string().trim().max(10).nullable().optional(),
    featured: z.boolean().optional().default(false),
    visible: z.boolean().optional().default(true),
  }),
  z.object({
    action: z.literal("update"),
    id: z.string().uuid(),
    authorName: z.string().trim().min(1).max(120).optional(),
    rating: z.number().int().min(1).max(5).optional(),
    body: z.string().trim().min(1).max(1000).optional(),
    category: z.string().trim().max(60).optional(),
    serviceSlug: z.string().trim().max(80).nullable().optional(),
    source: z.string().trim().max(40).optional(),
    reviewedOn: z.string().trim().max(10).nullable().optional(),
    featured: z.boolean().optional(),
    visible: z.boolean().optional(),
  }),
  z.object({ action: z.literal("delete"), id: z.string().uuid() }),
]);

/** Every testimonial (including hidden) for Admin → Testimonials. */
export async function GET() {
  try {
    if (!(await editor())) return NextResponse.json({ error: "Site content access is required." }, { status: 403 });
    return NextResponse.json({ testimonials: await adminTestimonials() }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await editor();
    if (!user) return NextResponse.json({ error: "Site content access is required." }, { status: 403 });
    const input = schema.parse(await readJson(request));
    if (input.action === "create") {
      const row = await createTestimonial({
        authorName: input.authorName, rating: input.rating, body: input.body, category: input.category || "general",
        serviceSlug: input.serviceSlug || null, source: input.source || "google", reviewedOn: input.reviewedOn || null,
        featured: input.featured, visible: input.visible,
      }, user.id);
      return NextResponse.json({ ok: true, testimonial: row });
    }
    if (input.action === "delete") { await deleteTestimonial(input.id); return NextResponse.json({ ok: true }); }
    const { id } = input;
    const cleanPatch = Object.fromEntries(Object.entries(input).filter(([key, value]) => key !== "action" && key !== "id" && value !== undefined));
    const row = await updateTestimonial(id, cleanPatch as Parameters<typeof updateTestimonial>[1]);
    if (!row) return NextResponse.json({ error: "Testimonial not found." }, { status: 404 });
    return NextResponse.json({ ok: true, testimonial: row });
  } catch (error) { return apiError(error); }
}
