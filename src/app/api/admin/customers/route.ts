import { NextRequest,NextResponse,after } from "next/server";
import { and,desc,eq,ilike,isNull,or } from "drizzle-orm";
import { z } from "zod";
import { activityLog,sessions,users } from "@/db/schema";
import { requireStaff,openWorkCount } from "@/lib/auth";
import { db } from "@/lib/db";
import { cleanName,looksLikeEmail,normalizeEmail,normalizePhone } from "@/lib/validation";
import { profileChanges,formatAuditChange } from "@/lib/customer-audit";
import { PublicError } from "@/lib/errors";
import { apiError,readJson } from "@/lib/http";
import { sendEmailChangedNotice,sendAdminAccountArchivedEmail } from "@/lib/email";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const editSchema=z.object({
  id:z.uuid(),
  action:z.enum(["edit","disable","enable","archive"]),
  name:z.string().max(100).optional(),
  email:z.string().max(254).optional(),
  phone:z.string().max(30).nullable().optional(),
  reason:z.string().trim().min(5).max(300),
  confirm:z.string().optional(),
});
async function owner() {return requireStaff("admin");}
function publicCustomer(u:typeof users.$inferSelect){
  return {id:u.id,name:u.name,email:u.email,phone:u.phone,
    emailVerified:Boolean(u.emailVerifiedAt),phoneVerified:Boolean(u.phoneVerifiedAt),
    createdAt:u.createdAt.toISOString(),updatedAt:u.updatedAt.toISOString(),
    disabled:Boolean(u.disabledAt),archived:Boolean(u.deletedAt)};
}
function auditRow(actorId:string,id:string,title:string,detail:string){
  return {kind:"staff" as const,permission:"team",category:"customer-profile",title:title.slice(0,200),
    detail:detail.slice(0,500),refType:"customer-profile",refId:id,actorId};
}

export async function GET(request:NextRequest){
  try{
    await owner();
    const id=request.nextUrl.searchParams.get("id");
    if(id){
      if(!z.uuid().safeParse(id).success)throw new PublicError("Invalid customer ID.",400);
      const [user]=await db.select().from(users).where(and(eq(users.id,id),eq(users.role,"customer"))).limit(1);
      if(!user)throw new PublicError("Customer not found.",404);
      const history=await db.select({
        id:activityLog.id,when:activityLog.createdAt,title:activityLog.title,
        detail:activityLog.detail,actorId:activityLog.actorId,actorName:users.name,
      }).from(activityLog).leftJoin(users,eq(users.id,activityLog.actorId))
        .where(and(eq(activityLog.refType,"customer-profile"),eq(activityLog.refId,id),
          eq(activityLog.permission,"team")))
        .orderBy(desc(activityLog.createdAt)).limit(150);
      return NextResponse.json({user:publicCustomer(user),history},{headers:{"cache-control":"private, no-store"}});
    }
    const q=(request.nextUrl.searchParams.get("q")??"").trim().slice(0,80);
    const includeArchived=request.nextUrl.searchParams.get("archived")==="1";
    const pattern="%"+q.replace(/[\\%_]/g,"\\$&")+"%";
    const filter=q?or(ilike(users.name,pattern),ilike(users.email,pattern),ilike(users.phone,pattern)):undefined;
    const rows=await db.select().from(users).where(and(
      eq(users.role,"customer"),includeArchived?undefined:isNull(users.deletedAt),filter
    )).orderBy(desc(users.createdAt)).limit(50);
    return NextResponse.json({users:rows.map(publicCustomer)},{headers:{"cache-control":"private, no-store"}});
  }catch(error){return apiError(error);}
}

export async function PATCH(request:NextRequest){
  try{
    const actor=await owner();
    const input=editSchema.parse(await readJson(request));
    const [user]=await db.select().from(users).where(and(eq(users.id,input.id),eq(users.role,"customer"))).limit(1);
    if(!user)throw new PublicError("Customer not found.",404);
    if(user.deletedAt)throw new PublicError("Archived accounts are read-only.",409);
    if(input.action==="edit"){
      const name=input.name!==undefined?cleanName(input.name):user.name;
      const email=input.email!==undefined?normalizeEmail(input.email):user.email;
      const phone=input.phone!==undefined?(input.phone?normalizePhone(input.phone):null):user.phone;
      if(name.length<2||name.length>100)throw new PublicError("Enter a name from 2 to 100 characters.",400);
      if(!looksLikeEmail(email))throw new PublicError("Enter a valid email address.",400);
      if(input.phone&& !phone)throw new PublicError("Enter a valid mobile number.",400);
      if(email!==user.email){
        const [used]=await db.select({id:users.id}).from(users).where(eq(users.email,email)).limit(1);
        if(used)throw new PublicError("This email address is already registered.",409);
      }
      if(phone&&phone!==user.phone){
        const [used]=await db.select({id:users.id}).from(users).where(and(eq(users.phone,phone),isNull(users.deletedAt))).limit(1);
        if(used)throw new PublicError("This mobile number is already registered.",409);
      }
      if(input.action==="enable" && !user.disabledAt)throw new PublicError("This account is already active.",409);
    if(input.action==="disable" && user.disabledAt)throw new PublicError("This account is already disabled.",409);
    const result=await db.transaction(async tx=>{
        const [fresh]=await tx.select().from(users).where(eq(users.id,user.id)).limit(1);
        if(!fresh || fresh.updatedAt.getTime()!==user.updatedAt.getTime())throw new PublicError("This customer was edited elsewhere. Refresh and retry.",409);
        const [saved]=await tx.update(users).set({
          name,email,phone,emailVerifiedAt:email===fresh.email?fresh.emailVerifiedAt:null,
          phoneVerifiedAt:phone===fresh.phone?fresh.phoneVerifiedAt:null,updatedAt:new Date(),
        }).where(eq(users.id,user.id)).returning();
        const changes=profileChanges(fresh,saved);
        if(changes.length)await tx.insert(activityLog).values(changes.map(change=>
          auditRow(actor.id,user.id,`${actor.name} corrected ${change.label}`,
            `${formatAuditChange(change)} · Reason: ${input.reason}`)
        ));
        return saved;
      });
      if(email!==user.email) {
        await db.delete(sessions).where(eq(sessions.userId,user.id));
        after(async()=>{await sendEmailChangedNotice(user.email,user.name,email).catch(error=>console.error("[customers] notice failed",error instanceof Error?error.message:"unknown"));});
      }
      return NextResponse.json({user:publicCustomer(result),message:"Customer details updated. Changed email/phone must be verified again."});
    }
    if(input.action==="archive"&&input.confirm!=="ARCHIVE")
      throw new PublicError("Type ARCHIVE to confirm permanent account closure.",400);
    if(input.action==="archive"){
      if(await openWorkCount(user.id))throw new PublicError("This customer has active requests. Close or transfer them before archiving the account.",409);
    }
    const result=await db.transaction(async tx=>{
      const [fresh]=await tx.select().from(users).where(eq(users.id,user.id)).limit(1);
      if(!fresh || fresh.updatedAt.getTime()!==user.updatedAt.getTime())throw new PublicError("Customer was updated elsewhere. Refresh and retry.",409);
      const now=new Date();
      const fields=input.action==="disable"?{disabledAt:now}:
        input.action==="enable"?{disabledAt:null}:
        {disabledAt:now,deletedAt:now,
          name:"Archived customer",email:`archived+${user.id}@removed.invalid`,
          phone:null,whatsapp:null,profileSummary:null,city:null,state:null,postalCode:null,
          emailVerifiedAt:null,phoneVerifiedAt:null};
      const [saved]=await tx.update(users).set({...fields,updatedAt:now}).where(eq(users.id,user.id)).returning();
      await tx.insert(activityLog).values(auditRow(actor.id,user.id,`${actor.name} ${input.action==="archive"?"archived":input.action==="enable"?"enabled":"disabled"} customer account`,`Reason: ${input.reason}`));
      await tx.delete(sessions).where(eq(sessions.userId,user.id));
      return saved;
    });
    if(input.action==="archive")after(async()=>{await sendAdminAccountArchivedEmail(user.email,user.name).catch(error=>console.error("[customers] archive notice failed",error instanceof Error?error.message:"unknown"));});
    return NextResponse.json({user:publicCustomer(result),message:input.action==="archive"?
      "Account archived and sign-in disabled; legally required service records retained.":
      "Customer access updated."});
  }catch(error){return apiError(error);}
}
