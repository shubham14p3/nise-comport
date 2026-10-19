import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { testimonials } from "@/db/schema";

export type Testimonial = {
  id: string; authorName: string; rating: number; body: string; category: string;
  serviceSlug: string | null; source: string; sourceId: string | null; reviewedOn: string | null; featured: boolean; visible: boolean;
  createdAt: string; updatedAt: string;
};

function serialize(row: typeof testimonials.$inferSelect): Testimonial {
  return {
    id: row.id, authorName: row.authorName, rating: row.rating, body: row.body, category: row.category,
    serviceSlug: row.serviceSlug, source: row.source, sourceId: row.sourceId, reviewedOn: row.reviewedOn,
    featured: row.featured, visible: row.visible,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

/** Every testimonial (shown or hidden) for Admin → Testimonials. */
export async function adminTestimonials() {
  const rows = await db.select().from(testimonials).orderBy(desc(testimonials.featured), desc(testimonials.createdAt));
  return rows.map(serialize);
}

/**
 * Visible testimonials for the public site. Pass a service slug to get that service's reviews
 * plus the general ones, mixed in with featured ones first — or omit it for the homepage mix.
 */
export async function publicTestimonials(options: { serviceSlug?: string; limit?: number } = {}) {
  const limit = options.limit ?? 12;
  const where = options.serviceSlug
    ? and(eq(testimonials.visible, true), or(eq(testimonials.serviceSlug, options.serviceSlug), eq(testimonials.category, "general")))
    : eq(testimonials.visible, true);
  try {
    const rows = await db.select().from(testimonials).where(where).orderBy(desc(testimonials.featured), desc(testimonials.reviewedOn), desc(testimonials.createdAt)).limit(limit);
    return rows.map(serialize);
  } catch (error) {
    // Reviews are a nice extra; a database hiccup must not take the whole page down.
    console.error("[testimonials] unavailable", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function createTestimonial(input: { authorName: string; rating: number; body: string; category: string; serviceSlug: string | null; source: string; reviewedOn: string | null; featured: boolean; visible: boolean }, actorId: string) {
  const [row] = await db.insert(testimonials).values({ ...input, createdBy: actorId }).returning();
  return serialize(row);
}

export async function updateTestimonial(id: string, patch: Partial<{ authorName: string; rating: number; body: string; category: string; serviceSlug: string | null; source: string; reviewedOn: string | null; featured: boolean; visible: boolean }>) {
  const [row] = await db.update(testimonials).set({ ...patch, updatedAt: new Date() }).where(eq(testimonials.id, id)).returning();
  return row ? serialize(row) : null;
}

export async function deleteTestimonial(id: string) {
  await db.delete(testimonials).where(eq(testimonials.id, id));
}

/**
 * Used by both the one-off bulk seed (scripts/seed-testimonials.mjs) and the automated Google
 * Business Profile sync (src/lib/google-business-reviews.ts): insert a review keyed by its
 * (source, sourceId) pair, or update it in place if it's already been imported — so re-running
 * either path is always safe and never creates a duplicate.
 */
export async function upsertTestimonialFromSource(input: { authorName: string; rating: number; body: string; category: string; serviceSlug: string | null; source: string; sourceId: string; reviewedOn: string | null; featured?: boolean; visible?: boolean }) {
  const [row] = await db.insert(testimonials).values({
    authorName: input.authorName, rating: input.rating, body: input.body, category: input.category,
    serviceSlug: input.serviceSlug, source: input.source, sourceId: input.sourceId, reviewedOn: input.reviewedOn,
    featured: input.featured ?? false, visible: input.visible ?? input.rating >= 4,
  }).onConflictDoUpdate({
    target: [testimonials.source, testimonials.sourceId],
    set: { authorName: input.authorName, rating: input.rating, body: input.body, reviewedOn: input.reviewedOn, updatedAt: new Date() },
  }).returning();
  return serialize(row);
}
