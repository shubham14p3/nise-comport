import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { serviceRequests, payments, couponRedemptions } from "@/db/schema";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { resolveCoupon, scopeContext } from "@/lib/promotions";
import { workflowOf } from "@/lib/review-workflow";
import { logActivity } from "@/lib/activity";

const schema=z.object({reference:z.string().trim().min(4).max(80),code:z.string().trim().min(3).max(40)});
/** Apply a verified discount to OUR service charge only, before checkout begins.
 * Existing quote remains original in service_requests; payment stores amount after discount.
 */
export async function POST(request:NextRequest){
  try {
    const user=await requireUser(),input=schema.parse(await readJson(request));
    const [item]=await db.select().from(serviceRequests).where(and(eq(serviceRequests.reference,input.reference),eq(serviceRequests.userId,user.id))).limit(1);
    if(!item)throw new PublicError("Request not found.",404);
    if(item.status!=="awaiting_payment")throw new PublicError("The payment quote is not ready.",409);
    const details=item.details&&typeof item.details==="object"?item.details as Record<string,unknown>:{};
    if(details.coupon||workflowOf(details).paymentCoupon)throw new PublicError("This request already has a coupon. Only one discount can be used.",409);
    const serviceFeePaise=Math.round(Number(item.serviceFee)*100);
    const externalFeePaise=Math.round(Number(item.externalFee)*100);
    if(!Number.isSafeInteger(serviceFeePaise)||serviceFeePaise<100)
      throw new PublicError("No service fee is eligible for a coupon on this request.",409);
    const {coupon,discount}=await resolveCoupon({code:input.code,userId:user.id,amount:serviceFeePaise/100,
      context:scopeContext(item.serviceSlug.startsWith("pan")?"pan":item.serviceSlug)});
    const discountPaise=Math.min(serviceFeePaise,Math.round((discount??0)*100));
    if(!discountPaise)throw new PublicError("This code has no discount for the quoted amount.",400);
    const [existing]=await db.select().from(payments).where(and(eq(payments.requestId,item.id),eq(payments.status,"due"))).limit(1);
    if(!existing||existing.providerOrderId)throw new PublicError("A payment is already being processed. Contact support to change the amount.",409);
    const expected=serviceFeePaise+externalFeePaise;
    if(existing.amountPaise!==expected)throw new PublicError("This quote was modified. Refresh the page.",409);
    const total=expected-discountPaise;
    if(total<100)throw new PublicError("Your discount covers almost the entire fee. Contact our team to settle this application.",409);
    await db.transaction(async(tx)=>{
      const [changed]=await tx.update(payments).set({amountPaise:total,updatedAt:new Date()})
        .where(and(eq(payments.id,existing.id),eq(payments.status,"due"),isNull(payments.providerOrderId),eq(payments.amountPaise,expected)))
        .returning({id:payments.id});
      if(!changed)throw new PublicError("Payment checkout has started. Refresh before applying a coupon.",409);
      await tx.insert(couponRedemptions).values({
        couponId:coupon.id,userId:user.id,requestKind:"service",requestId:item.id,amount:(discountPaise/100).toFixed(2),
      });
      const previous=workflowOf(details);
      const [updated]=await tx.update(serviceRequests).set({
        details:{...details,workflow:{...previous,paymentCoupon:{code:coupon.code,discountPaise}}},updatedAt:new Date(),
      }).where(and(eq(serviceRequests.id,item.id),eq(serviceRequests.status,"awaiting_payment"),eq(serviceRequests.updatedAt,item.updatedAt)))
        .returning({id:serviceRequests.id});
      if(!updated)throw new PublicError("Application changed while applying the code. Refresh.",409);
    });
    await logActivity({kind:"request",permission:"requests",title:`Coupon ${coupon.code} applied: ₹${(discountPaise/100).toFixed(2)} off service charge`,
      detail:item.reference,refType:"payment",refId:existing.id,actorId:user.id});
    return NextResponse.json({ok:true,code:coupon.code,discountPaise,amountPaise:total});
  }catch(error){return apiError(error);}
}
