import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, ilike, notInArray, or, sql, type SQL } from "drizzle-orm";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { printJobs, serviceRequests, users } from "@/db/schema";
import { REQUEST_STATUSES } from "@/lib/requests";
import { apiError } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission("requests");
    const statusRaw = (request.nextUrl.searchParams.get("status") ?? "").slice(0, 40);
    const status = statusRaw === "history" ? "history" : REQUEST_STATUSES.includes(statusRaw as never) ? statusRaw : "";
    const pageSizeRaw = Number(request.nextUrl.searchParams.get("pageSize") ?? 20);
    const pageSize = [10, 20, 50].includes(pageSizeRaw) ? pageSizeRaw : 20;
    const jobPage = Math.max(0, Math.min(100000, Number(request.nextUrl.searchParams.get("jobPage") ?? 0) || 0));
    const requestPage = Math.max(0, Math.min(100000, Number(request.nextUrl.searchParams.get("requestPage") ?? 0) || 0));
    const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
    const like = q ? `%${q.replace(/[\\%_]/g, "\\$&")}%` : "";
    const printFilters: SQL[] = [];
    const requestFilters: SQL[] = [];
    if (status === "history") { printFilters.push(notInArray(printJobs.status, ["submitted", "reviewing", "waiting_for_customer", "awaiting_payment", "payment_received", "ready_for_pickup", "out_for_delivery"])); requestFilters.push(notInArray(serviceRequests.status, ["submitted", "reviewing", "waiting_for_customer", "awaiting_payment", "payment_received", "ready_for_pickup", "out_for_delivery"])); }
    else if (status) { printFilters.push(eq(printJobs.status, status)); requestFilters.push(eq(serviceRequests.status, status)); }
    else { printFilters.push(notInArray(printJobs.status, ["cancelled", "completed"])); requestFilters.push(notInArray(serviceRequests.status, ["cancelled", "completed"])); }
    if (like) {
      printFilters.push(or(ilike(printJobs.reference, like), ilike(users.email, like), ilike(users.name, like), ilike(users.phone, like))!);
      requestFilters.push(or(ilike(serviceRequests.reference, like), ilike(users.email, like), ilike(users.name, like), ilike(users.phone, like), ilike(serviceRequests.serviceName, like))!);
    }
    const [jobs, requests, [jobCount], [requestCount]] = await Promise.all([
      db.select({ id: printJobs.id, reference: printJobs.reference, name: users.name, email: users.email, phone: users.phone, whatsapp: users.whatsapp, fileName: printJobs.fileName, pageCount: printJobs.pageCount, total: printJobs.total, fulfillment: printJobs.fulfillment, status: printJobs.status, createdAt: printJobs.createdAt, scheduledAt: printJobs.scheduledAt })
        .from(printJobs).innerJoin(users, eq(printJobs.userId, users.id)).where(printFilters.length ? and(...printFilters) : undefined).orderBy(desc(printJobs.createdAt), desc(printJobs.id)).limit(pageSize).offset(jobPage * pageSize),
      db.select({ id: serviceRequests.id, reference: serviceRequests.reference, name: users.name, email: users.email, phone: users.phone, whatsapp: users.whatsapp, serviceName: serviceRequests.serviceName, status: serviceRequests.status, createdAt: serviceRequests.createdAt, fileName: sql<string | null>`(select sf.original_name from stored_files sf where sf.request_id = ${serviceRequests.id} order by sf.created_at desc limit 1)`, officialReference: serviceRequests.officialReference, officialReferenceLabel: serviceRequests.officialReferenceLabel })
        .from(serviceRequests).innerJoin(users, eq(serviceRequests.userId, users.id)).where(requestFilters.length ? and(...requestFilters) : undefined).orderBy(desc(serviceRequests.createdAt), desc(serviceRequests.id)).limit(pageSize).offset(requestPage * pageSize),
      db.select({ total: count() }).from(printJobs).innerJoin(users, eq(printJobs.userId, users.id)).where(printFilters.length ? and(...printFilters) : undefined),
      db.select({ total: count() }).from(serviceRequests).innerJoin(users, eq(serviceRequests.userId, users.id)).where(requestFilters.length ? and(...requestFilters) : undefined),
    ]);
    return NextResponse.json({
      jobs: jobs.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), scheduledAt: item.scheduledAt?.toISOString() ?? null })),
      requests: requests.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
      canImport: hasPermission(user, "pan"),
      counts: { jobs: jobCount.total, requests: requestCount.total },
      filters: { status, q },
    }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
