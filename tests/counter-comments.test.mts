import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { loadServerModule } from './helpers/load-server-module.mjs';
const dialect=new PgDialect();
const visit={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',userId:'customer',staffId:'staff'};
const customer={id:'customer',name:'Customer',role:'customer',permissions:[]};
let written:Record<string,unknown>[]=[];let audits:unknown[]=[];let failAudit=false;const reads:{table:string;params:unknown[];limit:number}[]=[];
const sample=Array.from({length:21},(_,index)=>({id:`message-${20-index}`,body:`Update ${20-index}`,createdAt:new Date(2026,9,31,12,20-index),author:'Staff',authorId:'staff'}));
const db={select(columns?:Record<string,unknown>){let table='';let params:unknown[]=[];let size=0;const q={from(t:Parameters<typeof getTableName>[0]){table=getTableName(t);return q;},innerJoin(){return q;},where(s:Parameters<typeof dialect.sqlToQuery>[0]){params=dialect.sqlToQuery(s).params;return q;},orderBy(){return q;},limit(n:number){size=n;return q;},then(resolve:(value:unknown[])=>void){reads.push({table,params,limit:size});return Promise.resolve(table==='counter_visits'?[visit]:columns?sample:[]).then(resolve);}};return q;},
 insert(t:Parameters<typeof getTableName>[0]){const table=getTableName(t);return{values(value:Record<string,unknown>){if(table==='activity_log'){if(failAudit)throw new Error('audit failed');audits.push(value);return Promise.resolve();}return{onConflictDoNothing(){return this;},async returning(){if(written.some(row=>row.clientKey===value.clientKey))return[];const row={id:`new-${written.length}`,...value};written.push(row);return[row];}};}};},
 async transaction(work:(tx:unknown)=>Promise<unknown>){const old=structuredClone(written);try{return await work(db);}catch(error){written=old;throw error;}}
};
(globalThis as unknown as {__niseTest:unknown}).__niseTest={db};
const {canDiscussCounter,listCounterComments,postCounterComment}=await loadServerModule('src/lib/counter-comments.ts');
test('counter threads are isolated by account ID and the staff member assigned to the visit',()=>{
 assert.equal(canDiscussCounter(customer,visit),true);
 assert.equal(canDiscussCounter({...customer,id:'family-member-with-same-phone'},visit),false);
 assert.equal(canDiscussCounter({id:'staff',name:'Staff',role:'staff',permissions:['counter']},visit),true);
 assert.equal(canDiscussCounter({id:'other-staff',name:'Other',role:'staff',permissions:['counter']},visit),false);
 assert.equal(canDiscussCounter({id:'owner',name:'Owner',role:'admin',permissions:[]},visit),true);
});
test('opening a thread requests at most 21 rows and returns 20 chronologically with an older cursor',async()=>{
 reads.length=0;const result=await listCounterComments(customer,visit.id);
 assert.equal(result.messages.length,20);assert.equal(result.messages[0].id,'message-1');assert.equal(result.messages[19].id,'message-20');assert.equal(result.nextBefore,'message-1');
 const query=reads.find(row=>row.table==='counter_comments');assert.equal(query?.limit,21);assert.ok(query?.params.includes(visit.id));
 await assert.rejects(()=>listCounterComments({...customer,id:'someone-else'},visit.id));
});
test('posting is bounded, retry-safe, authorized and transactional',async()=>{
 written=[];audits=[];const input={visitId:visit.id,body:'  What is the update?  ',clientKey:'unique-client-key'};
 await postCounterComment(customer,input);await postCounterComment(customer,input);
 assert.equal(written.length,1);assert.equal(written[0].body,'What is the update?');assert.equal(audits.length,1);
 await assert.rejects(()=>postCounterComment({...customer,id:'someone-else'},{...input,clientKey:'other-key'}));assert.equal(written.length,1);
 await assert.rejects(()=>postCounterComment(customer,{...input,body:'x'.repeat(2001)}));
 failAudit=true;await assert.rejects(()=>postCounterComment(customer,{...input,clientKey:'rollback-key'}));failAudit=false;assert.equal(written.length,1);
});
