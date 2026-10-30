import { otpChannels } from "@/lib/sms";
import { NextResponse } from "next/server";
import { and, desc, eq, inArray, isNull, like, ne } from "drizzle-orm";
import { requireUser, activeSessionCount, openWorkCount } from "@/lib/auth";
import { db } from "@/lib/db";
import { counterVisits, printJobs, serviceRequests, users, walletEntries } from "@/db/schema";
import { apiError } from "@/lib/http";
import { isPlaceholderEmail } from "@/lib/mobile-login-core";
import { customerVouchers } from "@/lib/promotions";

export const dynamic = "force-dynamic";

/**
 * Counter visits are linked by account ID. The only legacy exception is a
 * counter-created placeholder for the same VERIFIED phone number. Never expose
 * another account's visits from a mere unverified profile phone field.
 */
async function customerCounterHistory(user: { id: string; phone: string | null; phoneVerifiedAt: Date | null }) {
  const accountIds = [user.id];
  if (user.phone && user.phoneVerifiedAt) {
    const aliases = await db.select({ id: users.id }).from(users).where(and(
      eq(users.phone, user.phone),
      like(users.email, "counter-%@counter.invalid"),
      isNull(users.phoneVerifiedAt),
      isNull(users.deletedAt),
      isNull(users.disabledAt),
      ne(users.id, user.id),
    )).limit(10);
    accountIds.push(...aliases.map((row) => row.id));
  }
  const visits = await db.select({
    id: counterVisits.id, serviceName: counterVisits.serviceName,
    billPaise: counterVisits.billPaise, discountPaise: counterVisits.discountPaise,
    collectPaise: counterVisits.collectPaise, createdAt: counterVisits.createdAt,
  }).from(counterVisits).where(inArray(counterVisits.userId, accountIds))
    .orderBy(desc(counterVisits.createdAt)).limit(100);
  return visits.map((visit) => ({ ...visit, createdAt: visit.createdAt.toISOString() }));
}

export async function GET() {
  try {
    const user = await requireUser();
    const [requests, jobs, wallet, counterHistory, activeCoupons, activeSessions, openWork] = await Promise.all([
      db.select({ reference: serviceRequests.reference, serviceSlug: serviceRequests.serviceSlug, serviceName: serviceRequests.serviceName, status: serviceRequests.status, details: serviceRequests.details, createdAt: serviceRequests.createdAt, officialReference: serviceRequests.officialReference, officialReferenceLabel: serviceRequests.officialReferenceLabel })
        .from(serviceRequests).where(eq(serviceRequests.userId, user.id)).orderBy(desc(serviceRequests.createdAt)).limit(50),
      db.select({ reference: printJobs.reference, status: printJobs.status, total: printJobs.total, fulfillment: printJobs.fulfillment, createdAt: printJobs.createdAt })
        .from(printJobs).where(eq(printJobs.userId, user.id)).orderBy(desc(printJobs.createdAt)).limit(50),
      db.select({ amount: walletEntries.amount, kind: walletEntries.kind, description: walletEntries.description, reference: walletEntries.reference, createdAt: walletEntries.createdAt })
        .from(walletEntries).where(eq(walletEntries.userId, user.id)).orderBy(desc(walletEntries.createdAt)),
      customerCounterHistory(user),
      customerVouchers(user.id),
      activeSessionCount(user.id),
      openWorkCount(user.id),
    ]);
    return NextResponse.json({
      user: {
        name: user.name, email: isPlaceholderEmail(user.email) ? "" : user.email, phone: user.phone, whatsapp: user.whatsapp ?? null, emailVerified: Boolean(user.emailVerifiedAt), phoneVerified: Boolean(user.phone && user.phoneVerifiedAt), smsEnabled: otpChannels().includes("sms"), whatsappEnabled: otpChannels().includes("whatsapp"),
        city: user.city ?? "", state: user.state ?? "", postalCode: user.postalCode ?? "", profileSummary: user.profileSummary ?? "",
        preferredContact: user.preferredContact === "phone" || user.preferredContact === "whatsapp" ? user.preferredContact : "email",
        updatedAt: user.updatedAt.toISOString(),
      },
      requests: requests.map(({ details, ...request }) => ({
        ...request,
        description: typeof details === "object" && details !== null && "description" in details && typeof details.description === "string" ? details.description : "",
        createdAt: request.createdAt.toISOString(),
      })),
      jobs: jobs.map((job) => ({ ...job, createdAt: job.createdAt.toISOString() })),
      wallet: wallet.map((entry) => ({ ...entry, createdAt: entry.createdAt.toISOString() })),
      counterHistory,
      coupons: activeCoupons,
      activeSessions,
      openWork,
    }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
