import PanSavedDetails from "@/components/pan-saved-details";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock3, FileText, ShieldCheck } from "lucide-react";
import SiteHeader from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { serviceRequests, storedFiles } from "@/db/schema";

export const metadata: Metadata = { title: "Service request details", robots: { index: false, follow: false } };

export default async function CustomerRequestPage({ params }: { params: Promise<{ reference: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");
  if (user.role === "demo") notFound();
  const { reference } = await params;
  const [request] = await db.select().from(serviceRequests).where(and(eq(serviceRequests.reference, reference), eq(serviceRequests.userId, user.id))).limit(1);
  if (!request) notFound();
  const files = await db.select({ id: storedFiles.id, name: storedFiles.originalName, createdAt: storedFiles.createdAt }).from(storedFiles).where(and(eq(storedFiles.requestId, request.id), eq(storedFiles.userId, user.id)));
  const details = typeof request.details === "object" && request.details !== null ? request.details as Record<string, unknown> : {};
  const description = typeof details.description === "string" ? details.description : "No additional note was submitted.";
  const submitted = request.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const status = request.status.replaceAll("_", " ");

  return <main className="content-page"><SiteHeader/><section className="container customer-request-page">
    <Link className="back-small" href="/profile?section=requests"><ArrowLeft size={14}/> Back to profile</Link>
    <header className="customer-request-heading"><span className="eyebrow eyebrow-muted">SERVICE REQUEST · {request.reference}</span><h1>{request.serviceName}</h1><p>Submitted {submitted}</p><span className={`request-status status-${request.status.toLowerCase().replaceAll(" ", "-")}`}><i/>{status}</span></header>
    <PanSavedDetails details={details}/><div className="customer-request-grid"><section className="customer-request-card"><span className="request-icon"><FileText size={18}/></span><div><h2>Information you submitted</h2><p>{description}</p></div></section>
      <section className="customer-request-card"><span className="request-icon"><Clock3 size={18}/></span><div><h2>Request status</h2><p>The service team updates this status as your request moves forward. We will contact you through the available account channels if more information is needed.</p><b className="customer-request-status">Current status: {status}</b></div></section>
      <section className="customer-request-card"><span className="request-icon"><FileText size={18}/></span><div><h2>Supporting documents</h2>{files.length ? <ul>{files.map((file) => <li key={file.id}>{file.name} <small>· uploaded {file.createdAt.toLocaleDateString("en-IN")}</small></li>)}</ul> : <p>No supporting file was attached to this request.</p>}<small>Documents are stored privately with this request and are visible only to you and authorised service staff.</small></div></section>
      <section className="customer-request-card"><span className="request-icon"><ShieldCheck size={18}/></span><div><h2>What happens next</h2><p>NISE COMPORT reviews the request and confirms the next steps and any separate service charge. You remain responsible for checking your information before an application is submitted. Final processing and approval belong to the relevant authority or provider.</p><Link href={`/services/${request.serviceSlug}`}>Open service checklist <ArrowRight size={14}/></Link></div></section>
    </div><p className="profile-footnote"><Check size={14}/> This page shows the details saved with your request. Contact the team if something needs correction before processing begins.</p>
  </section></main>;
}
