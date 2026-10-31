import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { loadServerModule } from './helpers/load-server-module.mjs';
const dialect = new PgDialect();
const visit = {id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',userId:'customer',staffId:'staff',serviceSlug:'bike-insurance',serviceName:'Bike insurance',billPaise:10000,discountPaise:1000,collectPaise:9000};
let requests:Record<string,unknown>[]=[]; let bills:Record<string,unknown>[]=[]; let audits:unknown[]=[]; let failPayment=false; let locks=0;
let mail=[{id:'message',status:'open'}];
const db={
 select(){let table='';let params:unknown[]=[];const q={from(t:Parameters<typeof getTableName>[0]){table=getTableName(t);return q;},where(s:Parameters<typeof dialect.sqlToQuery>[0]){params=dialect.sqlToQuery(s).params;return q;},limit(){return q;},for(){locks++;return q;},then(resolve:(value:unknown[])=>void){return Promise.resolve(table==='counter_visits'?[visit]:table==='service_requests'?requests.filter(row=>params.includes(row.reference)):[]).then(resolve);}};return q;},
 insert(table:Parameters<typeof getTableName>[0]){const name=getTableName(table);return {values(value:Record<string,unknown>){const execute=()=>{if(name==='payments'&&failPayment)throw new Error('payment write failed');const row={id:`${name}-${requests.length}`,...value};if(name==='service_requests')requests.push(row);else if(name==='payments')bills.push(row);else audits.push(row);return row;};return {async returning(){return [execute()];},then(resolve:(value:unknown)=>void,reject:(error:unknown)=>void){return Promise.resolve().then(execute).then(resolve,reject);}};}};},
 update(){return{set(value:Record<string,unknown>){return{where(){return{async returning(){const changed=mail.filter(row=>row.status!=='deleted');for(const row of changed)Object.assign(row,value);return changed.map(row=>({id:row.id}));}};}};}};},
 async transaction(fn:(tx:unknown)=>Promise<unknown>){const snapshot=structuredClone({requests,bills,audits,mail});try{return await fn(db);}catch(error){({requests,bills,audits,mail}=snapshot);throw error;}}
};
(globalThis as unknown as {__niseTest:unknown}).__niseTest={db};
const {chargeCounterVisit}=await loadServerModule('src/lib/counter-history.ts');
const {saveCounterPolicy}=await loadServerModule('src/lib/counter-settings.ts');
const {trashMail}=await loadServerModule('src/lib/mail-trash.ts');
const owner={id:'owner',role:'admin',permissions:[]};
function reset(){requests=[];bills=[];audits=[];mail=[{id:'message',status:'open'}];failPayment=false;locks=0;}
test('counter payment uses saved collect amount once, linked to its customer and reference',async()=>{
 reset();const result=await chargeCounterVisit(visit.id,owner);
 assert.equal(result.reference,`CV-${visit.id.toUpperCase()}`);assert.equal(bills[0].amountPaise,9000);assert.equal(bills[0].userId,'customer');assert.equal(bills[0].requestId,requests[0].id);assert.ok(locks>0);
 await assert.rejects(()=>chargeCounterVisit(visit.id,owner));assert.equal(bills.length,1);
});
test('counter charging enforces financial permission and transaction rollback',async()=>{
 reset();await assert.rejects(()=>chargeCounterVisit(visit.id,{id:'staff',role:'staff',permissions:['counter']}));assert.equal(locks,0);
 failPayment=true;await assert.rejects(()=>chargeCounterVisit(visit.id,owner));assert.equal(requests.length,0);assert.equal(bills.length,0);assert.equal(audits.length,0);
});
test('mail deletion is owner-only, keeps import IDs, and records an audit',async()=>{
 reset();await assert.rejects(()=>trashMail({user:{id:'staff',role:'staff'},staff:true},['message']));assert.equal(mail[0].status,'open');
 const result=await trashMail({user:owner,staff:true},['message']);assert.equal(result.deleted,1);assert.equal(mail[0].status,'deleted');assert.equal(mail[0].id,'message');assert.equal(audits.length,1);
});


test('wallet rate changes reject non-owners before writing settings', async () => {
 reset(); await assert.rejects(()=>saveCounterPolicy({deductionPercent:20,accumulationPercent:10},{id:'staff',role:'staff'}));
 assert.equal(audits.length,0);
});
