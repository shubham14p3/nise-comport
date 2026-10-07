import { revalidateTag, unstable_cache } from "next/cache";
import { asc, desc, eq } from "drizzle-orm";
import { customServices, siteBanners } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { isPosterUrl } from "@/lib/poster-library";
import { findService, publishedServiceDetails, serviceCatalog, type ServiceDetail } from "@/lib/services";

/**
 * Content the owner manages from Admin → Site content instead of code:
 *  - banners (top strip, home page, service pages), with dates and optional poster;
 *  - extra services (full service pages) and hiding built-in services.
 * Public pages read it through short caches; saving clears them immediately.
 */

type Text3 = { en: string; hi: string; bn: string };
export const BANNER_PLACEMENTS = ["strip", "home", "services", "service-page"] as const;
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];
export type Banner = {
  id: string; placement: BannerPlacement; title: Text3; text: Text3 | null; cta: Text3 | null; href: string | null;
  image: string | null; tone: string; categories: string[]; startsOn: string | null; endsOn: string | null; active: boolean; sortOrder: number;
};

const istToday = () => new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);
const TONES = ["blue", "violet", "pink", "green", "saffron", "cyan", "night"];

function bannerFromRow(row: typeof siteBanners.$inferSelect): Banner {
  return {
    id: row.id, placement: (BANNER_PLACEMENTS as readonly string[]).includes(row.placement) ? row.placement as BannerPlacement : "home",
    title: row.title, text: row.text ?? null, cta: row.cta ?? null, href: row.href ?? null, image: row.image ?? null, tone: row.tone,
    categories: row.categories ?? [], startsOn: row.startsOn ?? null, endsOn: row.endsOn ?? null, active: row.active, sortOrder: row.sortOrder,
  };
}

const cachedBanners = unstable_cache(async () => {
  try { return (await db.select().from(siteBanners).where(eq(siteBanners.active, true)).orderBy(asc(siteBanners.sortOrder), desc(siteBanners.createdAt)).limit(100)).map(bannerFromRow); }
  catch (error) { console.error("[content] banners unavailable", error); return []; }
}, ["site-banners"], { revalidate: 300, tags: ["site-content"] });

/** Live banners for a place on the site (and, for service pages, a category). */
export async function liveBanners(placement: BannerPlacement, category?: string | null) {
  const today = istToday();
  return (await cachedBanners()).filter((banner) => banner.placement === placement
    && (!banner.startsOn || banner.startsOn <= today) && (!banner.endsOn || today <= banner.endsOn)
    && (placement !== "service-page" || !banner.categories.length || (category && banner.categories.includes(category))));
}

// ------------------------------------------------------------------ services

export type CustomService = ServiceDetail & { id?: string; published: boolean; hidden?: boolean };

const cachedServices = unstable_cache(async () => {
  try {
    const rows = await db.select().from(customServices).orderBy(asc(customServices.sortOrder), asc(customServices.title));
    return rows.map((row) => ({ ...row.data, slug: row.slug, categorySlug: row.categorySlug, title: row.title, published: row.published, hidden: row.kind === "hide" }));
  } catch (error) { console.error("[content] services unavailable", error); return [] as CustomService[]; }
}, ["custom-services"], { revalidate: 300, tags: ["site-content"] });

/** Every service shown on the site: built-in ones (minus hidden) plus services added in the admin area. */
export async function allServices(): Promise<ServiceDetail[]> {
  const extra = await cachedServices();
  const hidden = new Set(extra.filter((item) => item.hidden).map((item) => item.slug));
  const added = extra.filter((item) => !item.hidden && item.published);
  return [...publishedServiceDetails.filter((service) => !hidden.has(service.slug)), ...added];
}

/** A service or category by slug, including admin-added services; null when missing or hidden. */
export async function resolveService(slug: string) {
  const extra = await cachedServices();
  if (extra.some((item) => item.hidden && item.slug === slug)) return null;
  const builtIn = findService(slug);
  if (builtIn) return builtIn;
  return extra.find((item) => !item.hidden && item.published && item.slug === slug) ?? null;
}

export async function servicesInCategoryAll(category: string) {
  return (await allServices()).filter((service) => service.categorySlug === category);
}

// ------------------------------------------------------------------ admin

const clean = (value: unknown, max: number) => typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
const text3 = (value: unknown, max: number, required = false): Text3 | null => {
  const raw = (value ?? {}) as Partial<Text3>;
  const en = clean(raw.en, max);
  if (!en) { if (required) throw new PublicError("Add the English text.", 400, { fields: { title: "Required." } }); return null; }
  return { en, hi: clean(raw.hi, max) || en, bn: clean(raw.bn, max) || en };
};
/** Banner links: pages on this site, or https links (e.g. a WhatsApp chat). */
function cleanHref(value: unknown) {
  const href = clean(value, 300);
  if (!href) return null;
  if (/^\/(?!\/)[\w\-/?=&#.%]*$/.test(href) || /^https:\/\/(wa\.me|api\.whatsapp\.com|www\.nisecomport\.com|nisecomport\.com)\//.test(href) || /^tel:\+?\d{6,15}$/.test(href)) return href;
  throw new PublicError("Links must be a page on this site (starting with /), a WhatsApp link, or tel:.", 400, { fields: { href: "Check the link." } });
}
const cleanDay = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;

export async function adminBanners() {
  return (await db.select().from(siteBanners).orderBy(asc(siteBanners.placement), asc(siteBanners.sortOrder), desc(siteBanners.createdAt))).map(bannerFromRow);
}

export async function saveBanner(input: Record<string, unknown>, actor: { id: string; name: string }) {
  const placement = (BANNER_PLACEMENTS as readonly string[]).includes(String(input.placement)) ? String(input.placement) : null;
  if (!placement) throw new PublicError("Choose where the banner shows.", 400, { fields: { placement: "Choose a place." } });
  const image = clean(input.image, 200) || null;
  if (image && !isPosterUrl(image)) throw new PublicError("Choose the image from the poster library or upload one.", 400, { fields: { image: "Invalid image." } });
  const categories = Array.isArray(input.categories) ? input.categories.filter((item): item is string => typeof item === "string" && serviceCatalog.some((group) => group.slug === item)) : [];
  const values = {
    placement, title: text3(input.title, 120, true)!, text: text3(input.text, 260), cta: text3(input.cta, 40), href: cleanHref(input.href), image,
    tone: TONES.includes(String(input.tone)) ? String(input.tone) : "blue", categories, startsOn: cleanDay(input.startsOn), endsOn: cleanDay(input.endsOn),
    active: input.active !== false, sortOrder: Math.max(0, Math.min(999, Number(input.sortOrder) || 0)), updatedAt: new Date(),
  };
  if (values.startsOn && values.endsOn && values.endsOn < values.startsOn) throw new PublicError("The end date must be after the start date.", 400, { fields: { endsOn: "Check the dates." } });
  const id = typeof input.id === "string" ? input.id : null;
  const [row] = id
    ? await db.update(siteBanners).set(values).where(eq(siteBanners.id, id)).returning()
    : await db.insert(siteBanners).values({ ...values, createdBy: actor.id }).returning();
  if (!row) throw new PublicError("Banner not found.", 404);
  revalidateTag("site-content", { expire: 0 });
  await logActivity({ kind: "promotion", permission: "content", category: "content", title: `${actor.name} ${id ? "updated" : "added"} the ${placement} banner “${values.title.en}”`, refType: "banner", refId: row.id, actorId: actor.id });
  return bannerFromRow(row);
}

export async function deleteBanner(id: string, actor: { id: string; name: string }) {
  const [row] = await db.delete(siteBanners).where(eq(siteBanners.id, id)).returning();
  if (!row) throw new PublicError("Banner not found.", 404);
  revalidateTag("site-content", { expire: 0 });
  await logActivity({ kind: "promotion", permission: "content", category: "content", title: `${actor.name} deleted the banner “${row.title.en}”`, actorId: actor.id });
}

export async function adminServices() {
  const extra = await db.select().from(customServices).orderBy(asc(customServices.sortOrder), asc(customServices.title));
  const hidden = new Set(extra.filter((row) => row.kind === "hide").map((row) => row.slug));
  return {
    builtIn: publishedServiceDetails.map((service) => ({ slug: service.slug, title: service.title, categorySlug: service.categorySlug, hidden: hidden.has(service.slug) })),
    custom: extra.filter((row) => row.kind === "service").map((row) => ({ id: row.id, ...row.data, slug: row.slug, title: row.title, categorySlug: row.categorySlug, published: row.published, sortOrder: row.sortOrder })),
    categories: serviceCatalog.map((group) => ({ slug: group.slug, title: group.title })),
  };
}

const list = (value: unknown, max: number, each = 240) => Array.isArray(value) ? value.map((item) => clean(item, each)).filter(Boolean).slice(0, max) : [];

/** Adds or edits a service page. Slugs are unique across built-in and added services. */
export async function saveService(input: Record<string, unknown>, actor: { id: string; name: string }) {
  const title = clean(input.title, 90);
  if (title.length < 4) throw new PublicError("Give the service a title.", 400, { fields: { title: "Add a title." } });
  const slug = (clean(input.slug, 80) || title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
  if (slug.length < 3) throw new PublicError("Use a web address with letters and numbers.", 400, { fields: { slug: "Check it." } });
  const categorySlug = clean(input.categorySlug, 60);
  if (!serviceCatalog.some((group) => group.slug === categorySlug)) throw new PublicError("Choose a category.", 400, { fields: { categorySlug: "Choose one." } });
  const id = typeof input.id === "string" ? input.id : null;
  if (!id && findService(slug)) throw new PublicError("A built-in service already uses that web address. Choose another.", 409, { fields: { slug: "Taken." } });
  const description = clean(input.description, 300);
  if (description.length < 20) throw new PublicError("Write a short description (at least 20 characters).", 400, { fields: { description: "Too short." } });
  const faqs = Array.isArray(input.faqs) ? input.faqs.map((item) => ({ question: clean((item as { question?: string }).question, 200), answer: clean((item as { answer?: string }).answer, 600) })).filter((item) => item.question && item.answer).slice(0, 12) : [];
  const data: ServiceDetail = {
    slug, categorySlug, title, description, keywords: list(input.keywords, 12, 80),
    highlights: list(input.highlights, 10), documents: list(input.documents, 20), steps: list(input.steps, 10), faqs,
    seoTitle: clean(input.seoTitle, 60) || undefined, seoDescription: clean(input.seoDescription, 160) || undefined,
  };
  if (!data.documents.length || !data.steps.length) throw new PublicError("Add at least one document and one step.", 400, { fields: { documents: "Add documents." } });
  const values = { kind: "service", slug, categorySlug, title, data, published: input.published !== false, sortOrder: Math.max(0, Math.min(999, Number(input.sortOrder) || 0)), updatedAt: new Date() };
  try {
    const [row] = id ? await db.update(customServices).set(values).where(eq(customServices.id, id)).returning()
      : await db.insert(customServices).values({ ...values, createdBy: actor.id }).returning();
    if (!row) throw new PublicError("Service not found.", 404);
    revalidateTag("site-content", { expire: 0 });
    await logActivity({ kind: "promotion", permission: "content", category: "content", title: `${actor.name} ${id ? "updated" : "added"} the service “${title}”`, detail: `/services/${slug}`, refType: "service", refId: row.id, actorId: actor.id });
    return row;
  } catch (error) {
    if ((error as { code?: string }).code === "23505" || String((error as Error).message).includes("duplicate")) throw new PublicError("That web address is already used. Choose another.", 409, { fields: { slug: "Taken." } });
    throw error;
  }
}

/** Hides or shows a built-in service everywhere (pages, lists, request flow). */
export async function setBuiltInHidden(slug: string, hidden: boolean, actor: { id: string; name: string }) {
  const service = findService(slug);
  if (!service || !("categorySlug" in service)) throw new PublicError("Unknown service.", 404);
  if (hidden) await db.insert(customServices).values({ kind: "hide", slug, categorySlug: service.categorySlug, title: service.title, data: { slug } as never, published: false, createdBy: actor.id }).onConflictDoNothing();
  else await db.delete(customServices).where(eq(customServices.slug, slug));
  revalidateTag("site-content", { expire: 0 });
  await logActivity({ kind: "promotion", permission: "content", category: "content", title: `${actor.name} ${hidden ? "hid" : "showed again"} the service “${service.title}”`, actorId: actor.id });
}

export async function deleteService(id: string, actor: { id: string; name: string }) {
  const [row] = await db.delete(customServices).where(eq(customServices.id, id)).returning();
  if (!row) throw new PublicError("Service not found.", 404);
  revalidateTag("site-content", { expire: 0 });
  await logActivity({ kind: "promotion", permission: "content", category: "content", title: `${actor.name} deleted the service “${row.title}”`, actorId: actor.id });
}
