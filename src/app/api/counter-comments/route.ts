import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { apiError, readJson } from '@/lib/http';
import { listCounterComments, postCounterComment } from '@/lib/counter-comments';
import { enforceRate, identity, RATE_RULES } from '@/lib/rate-limit';
export const dynamic='force-dynamic';
const headers={'cache-control':'private, no-store'};
export async function GET(request:NextRequest){try{
 const actor=await requireUser();const params=request.nextUrl.searchParams;
 const input=z.object({visitId:z.uuid(),before:z.uuid().optional()}).parse({visitId:params.get('visitId'),before:params.get('before')||undefined});
 return NextResponse.json(await listCounterComments(actor,input.visitId,input.before),{headers});
}catch(error){return apiError(error);}}
export async function POST(request:NextRequest){try{
 const actor=await requireUser();
 const input=z.object({visitId:z.uuid(),body:z.string().trim().min(1).max(2000),clientKey:z.uuid()}).parse(await readJson(request,12*1024));
 await enforceRate(RATE_RULES.counterCommentPerUserMinute,identity('counter-comment',actor.id),'Please wait a moment before sending another update.');
 return NextResponse.json(await postCounterComment(actor,input),{headers});
}catch(error){return apiError(error);}}
