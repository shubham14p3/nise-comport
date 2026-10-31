import { and, count, desc, eq, gt, inArray, notInArray, sql } from "drizzle-orm";
import { activityLog, leads, printJobs, serviceRequests, users } from "@/db/schema";
import { CLOSED_STATUSES } from "@/lib/auth";
import { db } from "@/lib/db";
import { pendingClaimCount } from "@/lib/claims";
import { permissionsOf, type Permission, type StaffLike } from "@/lib/permissions";
import { findService } from "@/lib/services";

/** "team" entries (staff changes) are for the owner only. */
type Audience = Permission | "team";
export type ActivityEntry = {
  kind: "lead" | "signup" | "claim" | "flag" | "request" | "print" | "status" | "import" | "record_view" | "staff" | "campaign" | "promotion";
  permission: Audience; title: string; detail?: string | null; category?: string | null;
  refType?: string | null; refId?: string | null; actorId?: string | null;
};

/** Records an event for the admin inbox. Never throws: activity is a side note, not the work itself. */
export async function logActivity(entry: ActivityEntry) {
  try {
    await db.insert(activityLog).values({
      kind: entry.kind, permission: entry.permission, title: entry.title.slice(0, 200), detail: entry.detail?.slice(0, 500) || null,
      category: entry.category ?? null, refType: entry.refType ?? null, refId: entry.refId ?? null, actorId: entry.actorId ?? null,
    });
  } catch (error) { console.error("[activity] could not record", error); }
}

export function audiences(user: StaffLike) {
  const list: Audience[] = [...permissionsOf(user)];
  if (user.role === "admin") list.push("team");
  return list;
}

type Inboxer = StaffLike & { id: string; inboxSeenAt?: Date | null };

/** The inbox: recent activity the person may see, what is waiting per service, and new leads. */
export async function inbox(user: Inboxer, options: { category?: string; limit?: number } = {}) {
  const visible = audiences(user);
  const seenAt = user.inboxSeenAt ?? new Date(0);
  const filters = [inArray(activityLog.permission, visible)];
  if (options.category) filters.push(eq(activityLog.category, options.category));
  const canRequests = visible.includes("requests");
  const [rows, [unread], open, prints, calls, claims] = await Promise.all([
    db.select({
      id: activityLog.id, kind: activityLog.kind, category: activityLog.category, title: activityLog.title, detail: activityLog.detail,
      refType: activityLog.refType, refId: activityLog.refId, createdAt: activityLog.createdAt, actor: users.name,
    }).from(activityLog).leftJoin(users, eq(users.id, activityLog.actorId)).where(and(...filters)).orderBy(desc(activityLog.createdAt)).limit(Math.min(options.limit ?? 60, 200)),
    db.select({ total: count() }).from(activityLog).where(and(inArray(activityLog.permission, visible), gt(activityLog.createdAt, seenAt))),
    canRequests ? db.select({ slug: serviceRequests.serviceSlug, name: serviceRequests.serviceName, total: count() }).from(serviceRequests)
      .where(notInArray(serviceRequests.status, [...CLOSED_STATUSES])).groupBy(serviceRequests.serviceSlug, serviceRequests.serviceName) : Promise.resolve([]),
    canRequests ? db.select({ total: count() }).from(printJobs).where(notInArray(printJobs.status, [...CLOSED_STATUSES])) : Promise.resolve([]),
    canRequests ? db.select({ total: count() }).from(leads).where(eq(leads.status, "new")) : Promise.resolve([]),
    visible.includes("records") ? pendingClaimCount().catch(() => 0) : Promise.resolve(0),
  ]);

  let pending: { category: string; label: string; total: number }[] = [];
  if (canRequests) {
    const byCategory = new Map<string, { label: string; total: number }>();
    for (const row of open) {
      const service = findService(row.slug);
      const category = service && "categorySlug" in service ? service.categorySlug : row.slug.startsWith("pan") ? "government-services" : "other";
      const key = row.slug.startsWith("pan") ? "pan" : category;
      const label = key === "pan" ? "PAN" : findService(category)?.title ?? "Other";
      const entry = byCategory.get(key) ?? { label, total: 0 };
      entry.total += row.total; byCategory.set(key, entry);
    }
    if (prints[0]?.total) byCategory.set("print", { label: "Print orders", total: prints[0].total });
    pending = [...byCategory.entries()].map(([category, value]) => ({ category, ...value })).sort((a, b) => b.total - a.total);
  }
  // Callbacks are loaded separately (listCallbackPage in leads.ts), one paged tab at a time.
  return { items: rows, unread: unread.total, seenAt, pending,
    summary: { unread: unread.total + claims, waiting: open.reduce((total, item) => total + item.total, 0) + (prints[0]?.total ?? 0), callbacks: calls[0]?.total ?? 0, claims },
  };
}

/** Numbers for the dashboard cards: unread activity, open requests and people waiting for a call. */
export async function inboxSummary(user: Inboxer) {
  const visible = audiences(user);
  const [me] = await db.select({ seen: users.inboxSeenAt }).from(users).where(eq(users.id, user.id)).limit(1);
  const [row] = await db.select({ total: count() }).from(activityLog).where(and(inArray(activityLog.permission, visible), gt(activityLog.createdAt, me?.seen ?? new Date(0))));
  let waiting = 0; let callbacks = 0;
  // Record requests and "this isn't me" reports waiting for the owner count toward the badge.
  const claims = visible.includes("records") ? await pendingClaimCount().catch(() => 0) : 0;
  if (visible.includes("requests")) {
    const [open] = await db.select({ total: count() }).from(serviceRequests).where(notInArray(serviceRequests.status, [...CLOSED_STATUSES]));
    const [prints] = await db.select({ total: count() }).from(printJobs).where(notInArray(printJobs.status, [...CLOSED_STATUSES]));
    const [calls] = await db.select({ total: count() }).from(leads).where(eq(leads.status, "new"));
    waiting = open.total + prints.total; callbacks = calls.total;
  }
  return { unread: row.total + claims, waiting, callbacks, claims };
}

export async function markInboxSeen(userId: string) {
  await db.update(users).set({ inboxSeenAt: sql`now()` }).where(eq(users.id, userId));
}
