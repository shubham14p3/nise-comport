import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireUser, activeSessionCount, openWorkCount } from "@/lib/auth";
import { db } from "@/lib/db";
import { printJobs, serviceRequests, walletEntries } from "@/db/schema";
import { apiError } from "@/lib/http";
import { customerVouchers } from "@/lib/promotions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const [requests, jobs, wallet, activeCoupons, activeSessions, openWork] = await Promise.all([
      db.select({ reference: serviceRequests.reference, serviceSlug: serviceRequests.serviceSlug, serviceName: serviceRequests.serviceName, status: serviceRequests.status, details: serviceRequests.details, createdAt: serviceRequests.createdAt })
        .from(serviceRequests).where(eq(serviceRequests.userId, user.id)).orderBy(desc(serviceRequests.createdAt)).limit(50),
      db.select({ reference: printJobs.reference, status: printJobs.status, total: printJobs.total, fulfillment: printJobs.fulfillment, createdAt: printJobs.createdAt })
        .from(printJobs).where(eq(printJobs.userId, user.id)).orderBy(desc(printJobs.createdAt)).limit(50),
      db.select({ amount: walletEntries.amount, kind: walletEntries.kind, description: walletEntries.description, reference: walletEntries.reference, createdAt: walletEntries.createdAt })
        .from(walletEntries).where(eq(walletEntries.userId, user.id)).orderBy(desc(walletEntries.createdAt)),
      customerVouchers(user.id),
      activeSessionCount(user.id),
      openWorkCount(user.id),
    ]);
    return NextResponse.json({
      user: {
        name: user.name, email: user.email, phone: user.phone, emailVerified: Boolean(user.emailVerifiedAt),
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
      coupons: activeCoupons,
      activeSessions,
      openWork,
    }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
