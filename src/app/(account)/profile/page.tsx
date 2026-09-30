import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { and, or, gt, isNull, desc, eq } from "drizzle-orm";
import ProfileDashboard from "@/components/profile-dashboard";
import DemoProfile from "@/components/demo-profile";
import { activeSessionCount, getCurrentUser, openWorkCount } from "@/lib/auth";
import { db } from "@/lib/db";
import { coupons, printJobs, serviceRequests, walletEntries } from "@/db/schema";
export const metadata: Metadata = { title:"Customer profile", robots:{index:false,follow:false} };
export const dynamic = "force-dynamic";
export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ request?: string; section?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");
  if (user.role === "demo") { const {section}=await searchParams; const allowed=["overview","requests","history","prints","wallet","vouchers","addresses","profile","security","help"]; return <DemoProfile section={allowed.includes(section??"") ? section as "profile" : undefined}/>; }
  const [{ request: selectedReference, section: requestedSection }, requests, jobs, wallet] = await Promise.all([
    searchParams,
    db.select({ id: serviceRequests.id, reference: serviceRequests.reference, serviceSlug: serviceRequests.serviceSlug, serviceName: serviceRequests.serviceName, status: serviceRequests.status, details: serviceRequests.details, createdAt: serviceRequests.createdAt }).from(serviceRequests).where(eq(serviceRequests.userId, user.id)).orderBy(desc(serviceRequests.createdAt)).limit(50),
    db.select({ id: printJobs.id, reference: printJobs.reference, status: printJobs.status, total: printJobs.total, fulfillment: printJobs.fulfillment, createdAt: printJobs.createdAt }).from(printJobs).where(eq(printJobs.userId, user.id)).orderBy(desc(printJobs.createdAt)).limit(50),
    db.select({ id: walletEntries.id, amount: walletEntries.amount, kind: walletEntries.kind, description: walletEntries.description, reference: walletEntries.reference, createdAt: walletEntries.createdAt }).from(walletEntries).where(eq(walletEntries.userId, user.id)).orderBy(desc(walletEntries.createdAt)),
  ]);
  const [activeCoupons, activeSessions, openWork] = await Promise.all([
    db.select().from(coupons).where(and(eq(coupons.active, true), or(isNull(coupons.expiresAt), gt(coupons.expiresAt, new Date())))),
    activeSessionCount(user.id),
    openWorkCount(user.id),
  ]);
  const safeRequests = requests.map(({ details, ...request }) => ({ ...request, description: typeof details === "object" && details !== null && "description" in details && typeof details.description === "string" ? details.description : "", createdAt: request.createdAt.toISOString() }));
  const section = ["overview", "requests", "history", "prints", "wallet", "vouchers", "addresses", "profile", "security", "help"].includes(requestedSection ?? "") ? requestedSection as "overview" | "requests" | "history" | "prints" | "wallet" | "vouchers" | "addresses" | "profile" | "security" | "help" : undefined;
  return <ProfileDashboard availableCoupons={activeCoupons.map(c=>({code:c.code,discountType:c.discountType,discountValue:c.discountValue,minimumAmount:c.minimumAmount,expiresAt:c.expiresAt?.toISOString()??null}))} user={{ id: user.id, name: user.name, email: user.email, phone: user.phone, emailVerified: Boolean(user.emailVerifiedAt), city: user.city ?? "", state: user.state ?? "", postalCode: user.postalCode ?? "", profileSummary: user.profileSummary ?? "", preferredContact: (user.preferredContact === "phone" || user.preferredContact === "whatsapp" ? user.preferredContact : "email"), updatedAt: user.updatedAt.toISOString() }} activeSessions={activeSessions} openWork={openWork} initialRequests={safeRequests} initialJobs={jobs.map((job) => ({ ...job, createdAt: job.createdAt.toISOString() }))} initialWallet={wallet.map((entry) => ({ ...entry, createdAt: entry.createdAt.toISOString() }))} selectedReference={selectedReference} initialSection={section}/>;
}
