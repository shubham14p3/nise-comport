import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { printJobs, serviceRequests, storedFiles, users } from "@/db/schema";
import AdminDashboard from "@/components/admin-dashboard";
export const metadata: Metadata = { title: "Staff dashboard", robots: { index: false, follow: false } };
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!(["admin", "staff"].includes(user.role))) redirect("/profile");
  const [jobs, requests] = await Promise.all([
    db.select({ id: printJobs.id, reference: printJobs.reference, name: users.name, email: users.email, fileName: printJobs.fileName, pageCount: printJobs.pageCount, total: printJobs.total, fulfillment: printJobs.fulfillment, status: printJobs.status, createdAt: printJobs.createdAt }).from(printJobs).innerJoin(users, eq(printJobs.userId, users.id)).orderBy(desc(printJobs.createdAt)).limit(100),
    db.select({ id: serviceRequests.id, reference: serviceRequests.reference, name: users.name, email: users.email, serviceName: serviceRequests.serviceName, status: serviceRequests.status, createdAt: serviceRequests.createdAt, fileName: storedFiles.originalName }).from(serviceRequests).innerJoin(users, eq(serviceRequests.userId, users.id)).leftJoin(storedFiles, eq(storedFiles.requestId, serviceRequests.id)).orderBy(desc(serviceRequests.createdAt)).limit(100),
  ]);
  return <AdminDashboard jobs={jobs.map(item => ({ ...item, createdAt: item.createdAt.toISOString() }))} requests={requests.map(item => ({ ...item, createdAt: item.createdAt.toISOString() }))} canImport={user.role === "admin"} />;
}
