import { NextRequest, NextResponse, after } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { scopeOf } from "@/lib/permissions";
import { serviceRequests, users, payments } from "@/db/schema";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { logActivity } from "@/lib/activity";
import { recordEvent, statusLabel } from "@/lib/requests";
import { nextReviewStatus, reviewPrompt, workflowOf } from "@/lib/review-workflow";
import { deliverNotifications, queueNotification } from "@/lib/notifications";
import { sendStatusWhatsApp } from "@/lib/whatsapp-alerts";

const schema=z.object({
  id:z.uuid(), expectedStatus:z.string().min(2).max(40),
  action:z.enum(["start","changes","approve"]),
  note:z.string().trim().max(500).optional(),
});
/** Admin and staff with requests permission: review, request more info and approve. */
export async function POST(request:NextRequest) {
  try {
    const actor=await requirePermission("requests");
    const input=schema.parse(await readJson(request));
    const [row]=await db.select().from(serviceRequests).where(eq(serviceRequests.id,input.id)).limit(1);
    if(!row) throw new PublicError("Request not found.",404);
    const scope=scopeOf(actor);
    if(scope && !scope.includes(row.serviceSlug)) throw new PublicError("Request not found.",404);
    if(row.status!==input.expectedStatus) throw new PublicError("This request was changed by someone else. Reload first.",409);
    const status=nextReviewStatus(input.action,row.status);
    if(!status) throw new PublicError("This action is not available at this stage.",409);
    if(input.action==="changes" && (!input.note || input.note.trim().length<5)) throw new PublicError("Describe the missing details or documents for the customer.",400);
    if(input.action==="approve" && !input.note?.trim() && workflowOf(row.details).waitingFor) throw new PublicError("Confirm that the requested information was checked before approving.",400);
    const [unpaid]=await db.select({id:payments.id}).from(payments).where(and(eq(payments.requestId,row.id),eq(payments.status,"due"))).limit(1);
    if(unpaid) throw new PublicError("A payment request already exists. Use Payments to manage it.",409);
    const now=new Date();
    const details=row.details && typeof row.details==="object" ? row.details as Record<string,unknown> : {};
    const old=workflowOf(details);
    const next={
      ...old,
      ...(input.action==="approve" ? {approvedAt:now.toISOString(),waitingFor:undefined,waitingSince:undefined} : {approvedAt:undefined}),
      ...(input.action==="changes" ? {waitingFor:input.note,waitingSince:now.toISOString()} : {}),
      ...(input.action==="start" ? {waitingFor:undefined,waitingSince:undefined} : {}),
    };
    const [updated]=await db.update(serviceRequests).set({status,details:{...details,workflow:next},updatedAt:now})
      .where(and(eq(serviceRequests.id,row.id),eq(serviceRequests.status,row.status))).returning({id:serviceRequests.id});
    if(!updated)throw new PublicError("This request just changed; reload before continuing.",409);
    const actionName=reviewPrompt(input.action);
    await recordEvent("service",row.id,actor.id,row.status,status,[actionName,input.note].filter(Boolean).join(" — ").slice(0,500));
    await logActivity({kind:"status",permission:"requests",title:actionName,detail:row.reference,refType:"request",refId:row.reference,actorId:actor.id});
    const [customer]=await db.select({name:users.name,email:users.email,phone:users.phone,whatsapp:users.whatsapp}).from(users).where(eq(users.id,row.userId)).limit(1);
    if(customer){
      try {
        const id=await queueNotification(row.userId,"status_update",{
          name:customer.name,email:customer.email,reference:row.reference,label:row.serviceName,
          status:input.action==="changes" ? `Information needed: ${input.note}. Open your account → My requests → Reply to review.`
            : input.action==="approve" ? "Information approved. We are preparing your payment quotation." : statusLabel(status),
        });
        after(async()=>{await deliverNotifications([id]).catch(error=>console.error("[review] email retry queued",error));});
      } catch(error) { console.error("[review] notification queue failed",error); }
      sendStatusWhatsApp({name:customer.name,phone:customer.whatsapp??customer.phone,reference:row.reference,service:row.serviceName,status:input.action==="changes"?"More information required":input.action==="approve"?"Details approved; payment quotation coming":statusLabel(status)});
    }
    return NextResponse.json({ok:true,status,approved:input.action==="approve"});
  } catch(error){return apiError(error);}
}
