import { NextRequest, NextResponse, after } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { serviceRequests, storedFiles } from "@/db/schema";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { recordEvent } from "@/lib/requests";
import { workflowOf } from "@/lib/review-workflow";
import { deliverNotifications, queueNotification, staffAlertEmail } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

const schema=z.object({ note:z.string().trim().max(500).default(""), fileId:z.uuid().optional() }).refine(v=>v.note.length>=8||Boolean(v.fileId),{message:"Add a reply or supporting file."});
/** Customer may reply to an existing review. Attached files stay private and linked to this request. */
export async function POST(request:NextRequest,{params}:{params:Promise<{reference:string}>}){
  try {
    const user=await requireUser(),{reference}=await params;
    if(!/^[A-Z0-9-]{4,80}$/i.test(reference)) throw new PublicError("Request not found.",404);
    const body=schema.parse(await readJson(request));
    const [row]=await db.select().from(serviceRequests).where(and(eq(serviceRequests.reference,reference),eq(serviceRequests.userId,user.id))).limit(1);
    if(!row)throw new PublicError("Request not found.",404);
    if(row.status!=="waiting_for_customer")throw new PublicError("This request is not waiting for additional information.",409);
    if(body.fileId){
      const [file]=await db.select({id:storedFiles.id}).from(storedFiles)
        .where(and(eq(storedFiles.id,body.fileId),eq(storedFiles.userId,user.id),isNull(storedFiles.requestId))).limit(1);
      if(!file)throw new PublicError("Your document was not found. Please upload it again.",400);
    }
    const base=row.details&&typeof row.details==="object"?row.details as Record<string,unknown>:{};
    const workflow=workflowOf(base);
    const now=new Date();
    const [changed]=await db.update(serviceRequests).set({status:"reviewing",
      details:{...base,workflow:{...workflow,approvedAt:undefined,waitingFor:undefined,waitingSince:undefined,lastCustomerReplyAt:now.toISOString()}},updatedAt:now})
      .where(and(eq(serviceRequests.id,row.id),eq(serviceRequests.status,"waiting_for_customer"))).returning({id:serviceRequests.id});
    if(!changed)throw new PublicError("The review changed; reload this request.",409);
    if(body.fileId) await db.update(storedFiles).set({requestId:row.id}).where(and(eq(storedFiles.id,body.fileId),eq(storedFiles.userId,user.id),isNull(storedFiles.requestId)));
    await recordEvent("service",row.id,user.id,"waiting_for_customer","reviewing",
      `Customer replied: ${body.note.slice(0,440)}${body.fileId?" · Supporting document attached":""}`);
    await logActivity({kind:"request",permission:"requests",title:`Customer responded to ${reference}`,detail:row.serviceName,refType:"request",refId:reference,actorId:user.id});
    try {
      const id=await queueNotification(user.id,"staff_alert",{email:staffAlertEmail(),subject:`Review response: ${reference}`,
        lines:[`Request: ${reference}`,`Service: ${row.serviceName}`,`Customer: ${user.name}`,"Customer provided additional information; sign in to view the private request.",...(body.fileId?["Supporting document attached."]:[])]});
      after(async()=>{await deliverNotifications([id]).catch(error=>console.error("[followup] notification retry queued",error));});
    } catch(error){console.error("[followup] could not queue staff email",error);}
    return NextResponse.json({ok:true,status:"reviewing"});
  }catch(error){return apiError(error);}
}
