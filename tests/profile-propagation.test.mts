import assert from "node:assert/strict";
import { test } from "node:test";
import { getTableName } from "drizzle-orm";
import { loadServerModule } from "./helpers/load-server-module.mjs";
const original={id:"00000000-0000-4000-8000-000000000002",name:"Old Name",email:"old@example.test",phone:null,whatsapp:null,city:"Old City",state:null,postalCode:null,profileSummary:null,preferredContact:"email",role:"customer",emailVerifiedAt:new Date(0),phoneVerifiedAt:null,updatedAt:new Date(0)};
let account={...original};const audits:Record<string,unknown>[]=[];const deleted:string[]=[];
const database={
 select(){const q={from(){return q;},where(){return q;},limit(){return Promise.resolve([{...account}]);}};return q;},
 update(){const q={set(values:Record<string,unknown>){Object.assign(account,values);return q;},where(){return q;},returning(){return Promise.resolve([{...account}]);}};return q;},
 insert(table:Parameters<typeof getTableName>[0]){assert.equal(getTableName(table),"activity_log");return{values(values:Record<string,unknown>[]){audits.push(...values);return Promise.resolve();}};},
 delete(table:Parameters<typeof getTableName>[0]){deleted.push(getTableName(table));return{where(){return Promise.resolve();}};},
 transaction<T>(work:(tx:unknown)=>Promise<T>){return work(database);},
};
(globalThis as unknown as {__niseTest:unknown}).__niseTest={db:database,requireUser:()=>({...account})};
const profile=await loadServerModule("src/app/api/profile/route.ts");
const counter=await loadServerModule("src/lib/counter.ts");
function reset(){account={...original};audits.length=0;deleted.length=0;}

test("normal profile save updates the account and records actor plus before/after values",async()=>{
 reset();const response=await profile.PATCH(new Request("http://test/api/profile",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({name:"New Name",city:"New City"})}));
 assert.equal(response.status,200);const body=await response.json();assert.equal(body.user.id,original.id);assert.equal(body.user.name,"New Name");assert.equal(account.city,"New City");
 assert.equal(audits.length,2);assert.ok(audits.every(row=>row.refType==="customer-profile"&&row.refId===original.id&&row.actorId===original.id));
 assert.ok(audits.some(row=>String(row.detail).includes('"Old Name" → "New Name"')));
 assert.ok(audits.some(row=>String(row.detail).includes('"Old City" → "New City"')));
});

test("Counter corrections update the same account, audit staff identity and revoke sessions on email change",async()=>{
 reset();const result=await counter.updateCounterCustomer(original.id,"Corrected Name","new@example.test",{id:"staff-id",name:"Staff Member"});
 assert.equal(result.id,original.id);assert.equal(account.name,"Corrected Name");assert.equal(account.email,"new@example.test");assert.equal(account.emailVerifiedAt,null);
 assert.equal(audits.length,2);assert.ok(audits.every(row=>row.actorId==="staff-id"&&row.refId===original.id&&row.permission==="counter"));assert.deepEqual(deleted,["sessions"]);
});

test("Counter cannot edit a team account through customer correction",async()=>{
 reset();account.role="staff";
 await assert.rejects(counter.updateCounterCustomer(original.id,"Changed","",{id:"owner",name:"Owner"}),/Team account/);
 assert.equal(audits.length,0);assert.equal(account.name,original.name);
});
