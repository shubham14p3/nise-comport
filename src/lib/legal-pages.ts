import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { legalPages } from "@/db/schema";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { LEGAL_DEFAULTS } from "@/lib/legal-defaults";
import { parseLegal, type LegalValues } from "@/lib/legal-markup";
import { site } from "@/lib/site";

export const LEGAL_SLUGS = ["terms", "privacy", "refund-policy"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];
export const LEGAL_LABELS: Record<LegalSlug, string> = { terms: "Terms and Conditions", privacy: "Privacy Policy", "refund-policy": "Refund & Cancellation Policy" };

type Override = { slug: string; body: string; updatedAt: string };

const loadOverrides = unstable_cache(async (): Promise<Override[]> => {
  try {
    const rows = await db.select().from(legalPages);
    return rows.map((row) => ({ slug: row.slug, body: row.body, updatedAt: row.updatedAt.toISOString() }));
  } catch (error) { console.error("[legal] legal_pages unavailable (run npm run db:migrate)", error); return []; }
}, ["legal-pages"], { revalidate: 300, tags: ["legal-pages"] });

export function monthYear(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(date);
}

export function legalValues(date: Date): LegalValues {
  return { site: site.name, domain: new URL(site.url).host.replace(/^www\./, ""), email: site.email, phone: site.phones.primary.display, address: site.address.oneLine, date: monthYear(date) };
}

export function isLegalSlug(value: string): value is LegalSlug { return (LEGAL_SLUGS as readonly string[]).includes(value); }

/** The page the public sees: admin text if saved, otherwise the built-in text. The effective month is always the latest: this month for built-in text, the month of the last edit for edited text. */
export async function loadLegalPage(slug: LegalSlug) {
  const override = (await loadOverrides()).find((item) => item.slug === slug);
  const effective = override ? new Date(override.updatedAt) : new Date();
  const values = legalValues(effective);
  return { doc: parseLegal(override?.body ?? LEGAL_DEFAULTS[slug], values), updated: values.date, custom: Boolean(override) };
}

export async function legalForAdmin() {
  const overrides = await loadOverrides();
  return LEGAL_SLUGS.map((slug) => {
    const override = overrides.find((item) => item.slug === slug);
    return { slug, label: LEGAL_LABELS[slug], body: override?.body ?? LEGAL_DEFAULTS[slug], custom: Boolean(override), updatedAt: override?.updatedAt ?? null };
  });
}

/** body = null puts the built-in text back. */
export async function saveLegalPage(slug: string, body: string | null, actorId: string) {
  if (!isLegalSlug(slug)) throw new PublicError("Unknown page.", 400);
  if (body === null) await db.delete(legalPages).where(eq(legalPages.slug, slug));
  else {
    const text = body.replace(/\r\n?/g, "\n").trim();
    if (text.length < 200) throw new PublicError("The page is too short. Use “Restore original” to go back to the built-in text.", 400);
    if (text.length > 60000) throw new PublicError("The page is too long (60,000 characters at most).", 400);
    if (!text.includes("## ")) throw new PublicError("Add at least one section heading that starts with “## ”.", 400);
    const values = { body: text, updatedBy: actorId, updatedAt: new Date() };
    await db.insert(legalPages).values({ slug, ...values }).onConflictDoUpdate({ target: legalPages.slug, set: values });
  }
  revalidateTag("legal-pages", { expire: 0 });
  revalidatePath(`/${slug}`);
}
