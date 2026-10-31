import { and, desc, eq, lt, or } from 'drizzle-orm';
import { activityLog, counterComments, counterVisits, users } from '@/db/schema';
import { db } from '@/lib/db';
import { PublicError } from '@/lib/errors';
import { hasPermission, type StaffLike } from '@/lib/permissions';
export type CommentActor = StaffLike & { id: string; name: string };
export function canDiscussCounter(actor: CommentActor, visit: { userId: string; staffId: string }) {
 return actor.id === visit.userId || actor.role === 'admin' || (hasPermission(actor, 'counter') && visit.staffId === actor.id);
}
async function authorize(actor: CommentActor, visitId: string) {
 const [visit] = await db.select().from(counterVisits).where(eq(counterVisits.id, visitId)).limit(1);
 if (!visit || !canDiscussCounter(actor, visit)) throw new PublicError('Counter conversation not found.', 404);
 return visit;
}
export async function listCounterComments(actor: CommentActor, visitId: string, before?: string) {
 await authorize(actor, visitId);
 const conditions = [eq(counterComments.visitId, visitId)];
 if (before) {
  const [cursor] = await db.select().from(counterComments).where(and(eq(counterComments.id, before), eq(counterComments.visitId, visitId))).limit(1);
  if (!cursor) throw new PublicError('Invalid conversation page.', 400);
  conditions.push(or(lt(counterComments.createdAt,cursor.createdAt),and(eq(counterComments.createdAt,cursor.createdAt),lt(counterComments.id,cursor.id)))!);
 }
 const rows=await db.select({id:counterComments.id,body:counterComments.body,createdAt:counterComments.createdAt,author:users.name,authorId:counterComments.authorId})
 .from(counterComments).innerJoin(users,eq(users.id,counterComments.authorId)).where(and(...conditions)).orderBy(desc(counterComments.createdAt),desc(counterComments.id)).limit(21);
 const page=rows.slice(0,20);
 return {messages:page.reverse().map(({authorId,...row})=>({...row,mine:authorId===actor.id})),nextBefore:rows.length>20?rows[19].id:null};
}
export async function postCounterComment(actor: CommentActor, input:{visitId:string;body:string;clientKey:string}) {
 const body=input.body.trim();
 if(!body || body.length>2000)throw new PublicError('Write a comment of 1–2,000 characters.',400);
 await authorize(actor,input.visitId);
 const result=await db.transaction(async tx=>{
  const [row]=await tx.insert(counterComments).values({visitId:input.visitId,authorId:actor.id,body,clientKey:input.clientKey}).onConflictDoNothing({target:counterComments.clientKey}).returning({id:counterComments.id});
  if(row)await tx.insert(activityLog).values({kind:'request',permission:'counter',title:`${actor.name} commented on a counter visit`,detail:`CV-${input.visitId.toUpperCase()}`,refType:'counter',refId:input.visitId,actorId:actor.id});
  return row;
 });
 return {ok:true,duplicate:!result};
}
