import { and, eq, inArray, isNull, like, sql } from "drizzle-orm";
import { revalidateTag, unstable_cache } from "next/cache";
import { loyaltySettings, printJobs, serviceRequests, users, walletEntries } from "@/db/schema";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { DEFAULT_LOYALTY, loyaltyReference, loyaltyReward, sanitizeLoyalty, type LoyaltySettings } from "@/lib/loyalty-core";

const load = unstable_cache(async (): Promise<LoyaltySettings> => {
  try {
    const [row] = await db.select().from(loyaltySettings).where(eq(loyaltySettings.id, "main")).limit(1);
    return row ? sanitizeLoyalty(row.settings) : DEFAULT_LOYALTY;
  } catch (error) { console.error("[loyalty] loyalty_settings unavailable (run npm run db:migrate)", error); return DEFAULT_LOYALTY; }
}, ["loyalty-settings"], { revalidate: 120, tags: ["loyalty-settings"] });

export function getLoyaltySettings() { return load(); }

export async function saveLoyaltySettings(input: unknown, actorId: string) {
  const settings = sanitizeLoyalty(input);
  if (!settings.rules.length) throw new PublicError("Keep at least one rule, or switch the credit off.", 400);
  await db.insert(loyaltySettings).values({ id: "main", settings, updatedBy: actorId, updatedAt: new Date() })
    .onConflictDoUpdate({ target: loyaltySettings.id, set: { settings, updatedBy: actorId, updatedAt: new Date() } });
  revalidateTag("loyalty-settings", { expire: 0 });
  return settings;
}

type Order = { kind: "service" | "print"; userId: string; reference: string; text: string; total: number; who: string };

async function completedOrders(): Promise<Order[]> {
  const services = await db.select({ userId: serviceRequests.userId, reference: serviceRequests.reference, slug: serviceRequests.serviceSlug, name: serviceRequests.serviceName, fee: serviceRequests.serviceFee, who: users.name })
    .from(serviceRequests).innerJoin(users, eq(users.id, serviceRequests.userId)).where(and(eq(serviceRequests.status, "completed"), sql`coalesce(${serviceRequests.details}->>'source', '') <> 'counter'`, isNull(users.deletedAt)));
  const prints = await db.select({ userId: printJobs.userId, reference: printJobs.reference, file: printJobs.fileName, total: printJobs.total, who: users.name })
    .from(printJobs).innerJoin(users, eq(users.id, printJobs.userId)).where(and(eq(printJobs.status, "completed"), isNull(users.deletedAt)));
  return [
    ...services.map((row): Order => ({ kind: "service", userId: row.userId, reference: row.reference, text: `${row.slug} ${row.name}`, total: Number(row.fee), who: row.who })),
    ...prints.map((row): Order => ({ kind: "print", userId: row.userId, reference: row.reference, text: `print ${row.file}`, total: Number(row.total), who: row.who })),
  ];
}

async function alreadyRewarded(references: string[]) {
  const done = new Set<string>();
  for (let i = 0; i < references.length; i += 500) {
    const rows = await db.select({ reference: walletEntries.reference }).from(walletEntries).where(inArray(walletEntries.reference, references.slice(i, i + 500)));
    for (const row of rows) if (row.reference) done.add(row.reference);
  }
  return done;
}

/** Gives the thank-you credit when an order is marked completed. Each order is rewarded once. */
export async function awardLoyalty(kind: "service" | "print", id: string) {
  const settings = await getLoyaltySettings();
  if (!settings.enabled) return null;
  const order: Order | undefined = kind === "print"
    ? (await db.select({ userId: printJobs.userId, reference: printJobs.reference, file: printJobs.fileName, total: printJobs.total }).from(printJobs).where(eq(printJobs.id, id)).limit(1)).map((row): Order => ({ kind, userId: row.userId, reference: row.reference, text: `print ${row.file}`, total: Number(row.total), who: "" }))[0]
    : (await db.select({ userId: serviceRequests.userId, reference: serviceRequests.reference, slug: serviceRequests.serviceSlug, name: serviceRequests.serviceName, fee: serviceRequests.serviceFee }).from(serviceRequests).where(and(eq(serviceRequests.id, id), sql`coalesce(${serviceRequests.details}->>'source', '') <> 'counter'`)).limit(1)).map((row): Order => ({ kind, userId: row.userId, reference: row.reference, text: `${row.slug} ${row.name}`, total: Number(row.fee), who: "" }))[0];
  if (!order) return null;
  const reward = loyaltyReward(settings, order.text, order.total);
  if (!reward) return null;
  const reference = loyaltyReference(kind, order.reference);
  if ((await alreadyRewarded([reference])).size) return null;
  await db.insert(walletEntries).values({ userId: order.userId, amount: reward.amount.toFixed(2), kind: "credit", description: `Thank-you credit: ${reward.label} (${order.reference})`, reference });
  return reward;
}

/** The "Sync up" button: finds finished orders that have not been rewarded yet. apply=false only reports. */
export async function syncLoyalty(apply: boolean) {
  const settings = await getLoyaltySettings();
  const orders = await completedOrders();
  const done = await alreadyRewarded(orders.map((order) => loyaltyReference(order.kind, order.reference)));
  const fresh = orders.flatMap((order) => {
    const reference = loyaltyReference(order.kind, order.reference);
    if (done.has(reference)) return [];
    const reward = loyaltyReward(settings, order.text, order.total);
    return reward ? [{ order, reward, reference }] : [];
  });
  if (apply && settings.enabled) {
    for (let i = 0; i < fresh.length; i += 200) {
      await db.insert(walletEntries).values(fresh.slice(i, i + 200).map(({ order, reward, reference }) => ({ userId: order.userId, amount: reward.amount.toFixed(2), kind: "credit", description: `Thank-you credit: ${reward.label} (${order.reference})`, reference })));
    }
  }
  const total = fresh.reduce((sum, item) => sum + item.reward.amount, 0);
  return {
    enabled: settings.enabled, applied: apply && settings.enabled,
    credits: fresh.length, customers: new Set(fresh.map((item) => item.order.userId)).size, total: Math.round(total * 100) / 100, alreadyRewarded: done.size,
    sample: fresh.slice(0, 15).map(({ order, reward }) => ({ who: order.who, reference: order.reference, label: reward.label, amount: reward.amount })),
  };
}

export async function loyaltyHistory() {
  const rows = await db.select({ amount: walletEntries.amount, description: walletEntries.description, createdAt: walletEntries.createdAt }).from(walletEntries).where(like(walletEntries.reference, "loyalty:%"));
  return { count: rows.length, total: Math.round(rows.reduce((sum, row) => sum + Number(row.amount), 0) * 100) / 100 };
}
