import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { serviceRequests } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { panIntakeSchema, panServiceLabels } from "@/lib/pan-validation";
import { storeDetailedIntake } from "@/lib/detailed-intake-server";
import { recordEvent } from "@/lib/requests";

/** Owner-only correction of an unprocessed NISE 49A assistance request.
 * This never edits a government PAN record. Locked once payment/processing starts. */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.emailVerifiedAt) throw new PublicError("Please verify your email.",403);
    const body = await readJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new PublicError("Invalid application.",400);
    const input = body as Record<string,unknown>;
    const reference = typeof input.reference==="string"?input.reference:"";
    if (!/^PAN-[A-Z0-9-]{4,70}$/i.test(reference)) throw new PublicError("Invalid request reference.",400);

    const parsed = panIntakeSchema.safeParse(input);
    if (!parsed.success) {
      const fields:Record<string,string>={};
      for (const issue of parsed.error.issues) {
        const key=String(issue.path[0]||"form");
        if(!fields[key]) fields[key]=issue.message;
      }
      throw new PublicError("Please correct the highlighted form fields.",400,{fields});
    }
    const pan = parsed.data;
    if (pan.applicant!=="individual" || pan.citizenship!=="indian" || !["new","minor"].includes(pan.service)
        || pan.detailedIntake?.kind!=="pan49a") throw new PublicError("Only individual Form 49A worksheets can be edited here.",400);
    if (pan.fileId) throw new PublicError("Please attach documents through the service desk.",400);

    const [row] = await db.select().from(serviceRequests).where(and(
      eq(serviceRequests.reference,reference),eq(serviceRequests.userId,user.id),
    )).limit(1);
    if (!row || row.serviceSlug!=="pan-card") throw new PublicError("Request not found.",404);
    const saved = row.details && typeof row.details==="object" && !Array.isArray(row.details) ? row.details as Record<string,unknown> : {};
    const intake = saved.intake;
    if (!intake || typeof intake!=="object" || (intake as {kind?:string}).kind!=="pan49a") {
      throw new PublicError("This request is not a Form 49A worksheet.",400);
    }
    if (!["submitted","reviewing","waiting_for_customer"].includes(row.status) || row.officialReference) {
      throw new PublicError("This request is already being processed. Please contact the service desk to request corrections.",409);
    }
    const panFields = {...pan};
    delete panFields.fileId;
    delete panFields.detailedIntake;
    const secured = storeDetailedIntake(pan.detailedIntake);
    const [updated] = await db.update(serviceRequests).set({
      details:{...saved,kind:"pan",description:pan.notes||panServiceLabels[pan.service],pan:panFields,intake:secured},
      serviceName:panServiceLabels[pan.service],updatedAt:new Date(),
    }).where(and(
      eq(serviceRequests.id,row.id),eq(serviceRequests.userId,user.id),
      eq(serviceRequests.status,row.status),eq(serviceRequests.updatedAt,row.updatedAt)
    )).returning({reference:serviceRequests.reference});
    if (!updated) throw new PublicError("The request changed while you were editing. Refresh and try again.",409);
    await recordEvent("service",row.id,user.id,row.status,row.status,"Customer updated and re-verified Form 49A assistance details");
    return NextResponse.json({reference:updated.reference,updated:true},{headers:{"cache-control":"private, no-store"}});
  } catch(error) {return apiError(error);}
}
