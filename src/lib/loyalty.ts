import { and, eq } from "drizzle-orm";
import { printJobs, serviceRequests, walletEntries } from "@/db/schema";
import { db } from "@/lib/db";
import { loyaltyKindForText, loyaltyReference, loyaltyReward } from "@/lib/loyalty-core";

/** Gives the thank-you credit when an order is marked completed. Safe to call again: each order is rewarded once. */
export async function awardLoyalty(kind: "service" | "print", id: string) {
  const order = kind === "print"
    ? (await db.select({ userId: printJobs.userId, reference: printJobs.reference, total: printJobs.total }).from(printJobs).where(eq(printJobs.id, id)).limit(1))[0]
    : (await db.select({ userId: serviceRequests.userId, reference: serviceRequests.reference, slug: serviceRequests.serviceSlug, name: serviceRequests.serviceName }).from(serviceRequests).where(eq(serviceRequests.id, id)).limit(1))[0];
  if (!order) return null;
  const reward = kind === "print" ? loyaltyReward("print", Number((order as { total: string }).total)) : loyaltyReward(loyaltyKindForText(`${(order as { slug: string }).slug} ${(order as { name: string }).name}`));
  if (!reward) return null;
  const reference = loyaltyReference(kind, order.reference);
  const existing = await db.select({ id: walletEntries.id }).from(walletEntries).where(and(eq(walletEntries.userId, order.userId), eq(walletEntries.reference, reference))).limit(1);
  if (existing.length) return null;
  await db.insert(walletEntries).values({ userId: order.userId, amount: reward.amount.toFixed(2), kind: "credit", description: `Thank-you credit for ${reward.label} (${order.reference})`, reference });
  return reward;
}
