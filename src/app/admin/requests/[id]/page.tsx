import type { Metadata } from "next";
import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { serviceRequests } from "@/db/schema";
import PanSavedDetails from "@/components/pan-saved-details";
export const metadata:Metadata={title:"Staff request details",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{id:string}>}){const user=await getCurrentUser();if(!user)redirect("/login?next=/admin");if(!["admin","staff"].includes(user.role))notFound();const {id}=await params;if(!/^[a-f0-9-]{36}$/i.test(id))notFound();const [request]=await db.select().from(serviceRequests).where(eq(serviceRequests.id,id)).limit(1);if(!request)notFound();const details=request.details as Record<string,unknown>;return <main className="container pan-page"><Link href="/admin">← Staff dashboard</Link><h1>{request.serviceName}</h1><p>{request.reference} · {request.status}</p><PanSavedDetails details={details}/><section className="pan-card"><h2>Customer note</h2><p>{typeof details.description==="string"?details.description:"No note provided."}</p><p>Review this information with the customer before proceeding. Update the NISE request status from the staff dashboard.</p></section></main>;}
