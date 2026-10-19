import { revalidateTag, unstable_cache } from "next/cache";
import { servicePrices } from "@/db/schema";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { publishedServiceDetails } from "@/lib/services";

/** Our service charge per service, edited in Admin → Prices. A service with no amount shows no price anywhere. */
export type ServicePrice = { slug: string; amount: number | null; kind: "fixed" | "from"; note: string | null };

const load = unstable_cache(async (): Promise<ServicePrice[]> => {
  try {
    const rows = await db.select().from(servicePrices);
    return rows.map((row) => ({ slug: row.serviceSlug, amount: row.amount, kind: row.kind === "from" ? "from" : "fixed", note: row.note }));
  } catch (error) { console.error("[prices] service_prices unavailable (run npm run db:migrate)", error); return []; }
}, ["service-prices"], { revalidate: 300, tags: ["service-prices"] });

export function allServicePrices() { return load(); }

/** Only services that have an amount, ready to show. */
export async function publicPrices() { return (await load()).filter((price) => price.amount && price.amount > 0); }
export async function priceFor(slug: string) { return (await publicPrices()).find((price) => price.slug === slug) ?? null; }

export function priceLabel(price: ServicePrice) { return `${price.kind === "from" ? "from " : ""}₹${price.amount}`; }

export async function saveServicePrice(input: { slug: string; amount: number | null; kind: string; note?: string | null }, actorId: string) {
  if (!publishedServiceDetails.some((service) => service.slug === input.slug)) throw new PublicError("Unknown service.", 400);
  if (input.amount !== null && (!Number.isInteger(input.amount) || input.amount < 0 || input.amount > 100000)) throw new PublicError("Enter a whole-rupee amount, or leave it empty.", 400);
  const values = { amount: input.amount && input.amount > 0 ? input.amount : null, kind: input.kind === "from" ? "from" : "fixed", note: input.note?.replace(/\s+/g, " ").trim().slice(0, 160) || null, updatedBy: actorId, updatedAt: new Date() };
  await db.insert(servicePrices).values({ serviceSlug: input.slug, ...values }).onConflictDoUpdate({ target: servicePrices.serviceSlug, set: values });
  revalidateTag("service-prices", { expire: 0 });
}
