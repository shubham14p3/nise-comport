import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { requestEvents, serviceRequests, users } from "@/db/schema";
import PanSavedDetails from "@/components/pan-saved-details";
import { statusLabel } from "@/lib/requests";

export const metadata: Metadata = { title: "Staff request details", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!["admin", "staff"].includes(user.role)) notFound();
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const [row] = await db.select({ request: serviceRequests, customer: { name: users.name, email: users.email, phone: users.phone, preferredContact: users.preferredContact } })
    .from(serviceRequests).innerJoin(users, eq(serviceRequests.userId, users.id)).where(eq(serviceRequests.id, id)).limit(1);
  if (!row) notFound();
  const { request, customer } = row;
  const events = await db.select({ id: requestEvents.id, fromStatus: requestEvents.fromStatus, toStatus: requestEvents.toStatus, note: requestEvents.note, createdAt: requestEvents.createdAt, actor: users.name })
    .from(requestEvents).leftJoin(users, eq(requestEvents.actorId, users.id))
    .where(and(eq(requestEvents.requestKind, "service"), eq(requestEvents.requestId, request.id))).orderBy(asc(requestEvents.createdAt));
  const details = (request.details ?? {}) as Record<string, unknown>;
  const when = (value: Date) => value.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
  return <main className="container pan-page">
    <Link href="/admin">← Staff dashboard</Link>
    <h1>{request.serviceName}</h1>
    <p>{request.reference} · {statusLabel(request.status)} · submitted {when(request.createdAt)}</p>
    <section className="pan-card"><h2>Customer</h2><p>{customer.name} · <a href={`mailto:${customer.email}`}>{customer.email}</a>{customer.phone ? <> · <a href={`tel:${customer.phone}`}>{customer.phone}</a></> : null}</p><p>Prefers updates by: {typeof details.preferredContact === "string" ? details.preferredContact : customer.preferredContact}</p></section>
    <PanSavedDetails details={details}/>
    <section className="pan-card"><h2>Customer note</h2><p>{typeof details.description === "string" ? details.description : "No note provided."}</p><p>Review this information with the customer before proceeding. Update the status from the staff dashboard.</p></section>
    <section className="pan-card"><h2>History</h2>{events.length ? <ol className="request-timeline">{events.map((event) => <li key={event.id}><b>{event.fromStatus ? `${statusLabel(event.fromStatus)} → ` : ""}{statusLabel(event.toStatus)}</b> <small>{when(event.createdAt)}{event.actor ? ` · ${event.actor}` : ""}</small>{event.note ? <p>{event.note}</p> : null}</li>)}</ol> : <p>No history recorded yet.</p>}</section>
  </main>;
}
