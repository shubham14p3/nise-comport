import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { printJobs, serviceRequests, storedFiles, users } from "@/db/schema";
import AdminDashboard from "@/components/admin-dashboard";
import { REQUEST_STATUSES } from "@/lib/requests";

export const metadata: Metadata = { title: "Staff dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!(["admin", "staff"].includes(user.role))) redirect("/profile");
  const params = await searchParams;
  const status = REQUEST_STATUSES.includes(params.status as never) ? params.status! : "";
  const q = (params.q ?? "").trim().slice(0, 80);
  const like = q ? `%${q.replace(/[\\%_]/g, "\\$&")}%` : "";

  const printFilters: SQL[] = [];
  const requestFilters: SQL[] = [];
  if (status) { printFilters.push(eq(printJobs.status, status)); requestFilters.push(eq(serviceRequests.status, status)); }
  if (like) {
    printFilters.push(or(ilike(printJobs.reference, like), ilike(users.email, like), ilike(users.name, like), ilike(users.phone, like))!);
    requestFilters.push(or(ilike(serviceRequests.reference, like), ilike(users.email, like), ilike(users.name, like), ilike(users.phone, like), ilike(serviceRequests.serviceName, like))!);
  }

  const [jobs, requests] = await Promise.all([
    db.select({ id: printJobs.id, reference: printJobs.reference, name: users.name, email: users.email, phone: users.phone, fileName: printJobs.fileName, pageCount: printJobs.pageCount, total: printJobs.total, fulfillment: printJobs.fulfillment, status: printJobs.status, createdAt: printJobs.createdAt, scheduledAt: printJobs.scheduledAt })
      .from(printJobs).innerJoin(users, eq(printJobs.userId, users.id)).where(printFilters.length ? and(...printFilters) : undefined).orderBy(desc(printJobs.createdAt)).limit(100),
    db.select({ id: serviceRequests.id, reference: serviceRequests.reference, name: users.name, email: users.email, phone: users.phone, serviceName: serviceRequests.serviceName, status: serviceRequests.status, createdAt: serviceRequests.createdAt, fileName: storedFiles.originalName })
      .from(serviceRequests).innerJoin(users, eq(serviceRequests.userId, users.id)).leftJoin(storedFiles, eq(storedFiles.requestId, serviceRequests.id)).where(requestFilters.length ? and(...requestFilters) : undefined).orderBy(desc(serviceRequests.createdAt)).limit(100),
  ]);
  return <AdminDashboard
    jobs={jobs.map(item => ({ ...item, createdAt: item.createdAt.toISOString(), scheduledAt: item.scheduledAt?.toISOString() ?? null }))}
    requests={requests.map(item => ({ ...item, createdAt: item.createdAt.toISOString() }))}
    canImport={user.role === "admin"} filters={{ status, q }}/>;
}
