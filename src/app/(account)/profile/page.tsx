import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import ProfileDashboard from "@/components/profile-dashboard";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { printJobs, serviceRequests } from "@/db/schema";
export const metadata: Metadata = { title:"Customer profile", robots:{index:false,follow:false} };
export default async function ProfilePage(){const user=await getCurrentUser();if(!user)redirect("/login?next=/profile");const [requests,jobs]=await Promise.all([db.select({id:serviceRequests.id,reference:serviceRequests.reference,serviceName:serviceRequests.serviceName,status:serviceRequests.status,createdAt:serviceRequests.createdAt}).from(serviceRequests).where(eq(serviceRequests.userId,user.id)).orderBy(desc(serviceRequests.createdAt)).limit(50),db.select({id:printJobs.id,reference:printJobs.reference,status:printJobs.status,total:printJobs.total,fulfillment:printJobs.fulfillment,createdAt:printJobs.createdAt}).from(printJobs).where(eq(printJobs.userId,user.id)).orderBy(desc(printJobs.createdAt)).limit(50)]);return <ProfileDashboard user={{id:user.id,name:user.name,email:user.email,phone:user.phone}} initialRequests={requests.map(request=>({...request,createdAt:request.createdAt.toISOString()}))} initialJobs={jobs.map(job=>({...job,createdAt:job.createdAt.toISOString()}))}/>}
