import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { testimonials } from "@/db/schema";

export type Testimonial = {
  id: string; authorName: string; rating: number; body: string; category: string;
  serviceSlug: string | null; source: string; reviewedOn: string | null; featured: boolean; visible: boolean;
  createdAt: string; updatedAt: string;
};

function serialize(row: typeof testimonials.$inferSelect): Testimonial {
  return {
    id: row.id, authorName: row.authorName, rating: row.rating, body: row.body, category: row.category,
    serviceSlug: row.serviceSlug, source: row.source, reviewedOn: row.reviewedOn,
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
  const rows = await db.select().from(testimonials).where(where).orderBy(desc(testimonials.featured), desc(testimonials.reviewedOn), desc(testimonials.createdAt)).limit(limit);
  return rows.map(serialize);
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
