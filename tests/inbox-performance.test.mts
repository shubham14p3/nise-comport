import assert from "node:assert/strict";
import { test } from "node:test";
import { getTableName } from "drizzle-orm";
import { loadServerModule } from "./helpers/load-server-module.mjs";
const calls:string[]=[];
const fixture={claims:2,db:{select(columns:Record<string,unknown>){
  let table="";
  const chain={from(t:Parameters<typeof getTableName>[0]){table=getTableName(t);return chain;},where(){return chain;},leftJoin(){return chain;},orderBy(){return chain;},limit(){return chain;},groupBy(){return chain;},
    then(resolve:(value:unknown[])=>void,reject:(error:unknown)=>void){
      calls.push(table);
      const rows=table==="service_requests"?[{slug:"pan-card",name:"PAN",total:4}]:"total" in columns?[{total:table==="print_jobs"?5:table==="leads"?2:3}]:[];
      return Promise.resolve(rows).then(resolve,reject);
    }};return chain;
}}};
(globalThis as unknown as {__niseTest:typeof fixture}).__niseTest=fixture;
const {inbox}=await loadServerModule("src/lib/activity.ts");

test("full Inbox includes dashboard counters without a second summary request",async()=>{
  calls.length=0;const seen=new Date("2026-10-30T12:00:00Z");
  const result=await inbox({id:"owner",role:"admin",permissions:[],inboxSeenAt:seen});
  assert.deepEqual(result.summary,{unread:5,waiting:9,callbacks:2,claims:2});
  assert.equal(result.unread,3);assert.equal(result.seenAt,seen);
  assert.equal(result.pending.reduce((n:number,item:{total:number})=>n+item.total,0),9);
  assert.equal(calls.includes("users"),false,"already authenticated seen timestamp is reused");
  assert.equal(calls.filter(t=>t==="activity_log").length,2);
});

test("staff without Requests permission does not query request/print/callback counters",async()=>{
  calls.length=0;
  const result=await inbox({id:"staff",role:"staff",permissions:["records"],inboxSeenAt:null});
  assert.deepEqual(result.summary,{unread:5,waiting:0,callbacks:0,claims:2});
  assert.deepEqual(result.pending,[]);
  assert.ok(!calls.some(t=>["service_requests","print_jobs","leads"].includes(t)));
});
