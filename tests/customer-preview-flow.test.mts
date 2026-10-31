import assert from "node:assert/strict";
import {test} from "node:test";
import {getTableName} from "drizzle-orm";
import {PgDialect} from "drizzle-orm/pg-core";
import {loadServerModule} from "./helpers/load-server-module.mjs";
import {createPreviewGrant,readPreviewGrant,PREVIEW_COOKIE,PREVIEW_MS,MAX_PREVIEW_MS} from "../src/lib/customer-preview-session.ts";
const actor={id:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",name:"Owner",role:"admin",email:"shubham14p3@gmail.com"};
const target={id:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",name:"Customer",role:"customer",email:"customer@example.test",phone:"+919876543210",emailVerifiedAt:null,phoneVerifiedAt:null,city:null,state:null,postalCode:null,deletedAt:null,disabledAt:null,passwordHash:"NEVER-SERIALIZE",loginPinHash:"NEVER-SERIALIZE-PIN"};
const created:Record<string,unknown>[]=[];
const jar=new Map<string,string>();const audits:Record<string,unknown>[]=[];const reads:Array<{table:string;columns:string[];params:unknown[]}>=[];
let currentActor={...actor};let currentTarget={...target};let failAudit=false;
const dialect=new PgDialect();
const fixture={requireStaff(role:string){assert.equal(role,"admin");if(currentActor.role!=="admin")throw new Error("staff denied before data access");return currentActor;},cookies:{get:(key:string)=>jar.has(key)?{value:jar.get(key)}:undefined,set:(value:{name:string;value:string;maxAge:number})=>{if(value.maxAge===0)jar.delete(value.name);else jar.set(value.name,value.value);}},db:{
 select(columns?:Record<string,unknown>){const read={table:"",columns:Object.keys(columns??{}),params:[] as unknown[]};const q={from(t:Parameters<typeof getTableName>[0]){read.table=getTableName(t);return q;},where(sql:Parameters<typeof dialect.sqlToQuery>[0]){read.params=dialect.sqlToQuery(sql).params;return q;},orderBy(){return q;},limit(){return q;},then(resolve:(value:unknown[])=>void,reject:(e:unknown)=>void){reads.push(read);return Promise.resolve(read.table==="users"?[currentTarget,...created.map(row=>({...target,...row,role:"customer"}))].filter(row=>read.params.includes(row.id)||read.params.includes(row.phone)||read.params.includes(row.email)):[]).then(resolve,reject);}};return q;},
 insert(table:Parameters<typeof getTableName>[0]){return{values(value:Record<string,unknown>){
   if(getTableName(table)==="users")return{returning:async()=>{const row={...value,id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc"};created.push(row);return[{id:row.id}];}};
   if(failAudit)throw new Error("audit unavailable");audits.push(value);return Promise.resolve();
 }};},
 async transaction<T>(work:(tx:unknown)=>Promise<T>){const rows=created.length,logs=audits.length;try{return await work(fixture.db);}catch(error){created.length=rows;audits.length=logs;throw error;}},
}};
(globalThis as unknown as {__niseTest:typeof fixture}).__niseTest=fixture;
const {POST}=await loadServerModule("src/app/api/admin/customer-preview/route.ts");
const request=(body:unknown)=>new Request("http://test/api/admin/customer-preview",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
const previousToken=process.env.INTERNAL_API_TOKEN;process.env.INTERNAL_API_TOKEN="preview-flow-test-only-token-at-least-32-characters";
function reset(){currentActor={...actor};currentTarget={...target};jar.clear();audits.length=0;reads.length=0;created.length=0;failAudit=false;}
const quiet=async(work:()=>Promise<void>)=>{const original=console.error;console.error=()=>{};try{await work();}finally{console.error=original;}};

test("start/state/end retain admin login and expose only the selected account data",async()=>{
 reset();jar.set("nc_7x9k","original-admin-session");
 assert.equal((await POST(request({action:"start",userId:target.id}))).status,200);
 assert.equal(readPreviewGrant(jar.get(PREVIEW_COOKIE),actor.id)?.target,target.id);
 const response=await POST(request({action:"state"}));assert.equal(response.status,200);const json=await response.json();
 assert.equal(json.user.id,target.id);assert.ok(!JSON.stringify(json).includes("NEVER-SERIALIZE"));
 assert.ok(reads.every(read=>read.params.includes(target.id)),"each data query is scoped to the selected account");
 assert.ok(reads.filter(read=>read.table==="users").every(read=>read.columns.length>0&&!read.columns.includes("passwordHash")&&!read.columns.includes("loginPinHash")),"preview reads must select public fields only");
 assert.equal((await POST(request({action:"end"}))).status,200);assert.equal(jar.has(PREVIEW_COOKIE),false);assert.equal(jar.get("nc_7x9k"),"original-admin-session");
 assert.deepEqual(audits.map(row=>row.actorId),[actor.id,actor.id]);
});

test("extension response and signed grant use the same capped expiry",async()=>{
 reset();const started=Date.now()-29*60_000;jar.set(PREVIEW_COOKIE,createPreviewGrant(actor.id,target.id,Date.now(),started,started+MAX_PREVIEW_MS));
 const response=await POST(request({action:"extend"}));assert.equal(response.status,200);const body=await response.json();
 assert.equal(body.expiresAt,started+MAX_PREVIEW_MS);assert.equal(readPreviewGrant(jar.get(PREVIEW_COOKIE),actor.id)?.until,body.expiresAt);
});

test("expired or tampered grants cannot read customer data",async()=>{
 for(const token of [createPreviewGrant(actor.id,target.id,Date.now()-PREVIEW_MS-1000),"tampered.invalid"]){reset();jar.set(PREVIEW_COOKIE,token);assert.equal((await POST(request({action:"state"}))).status,401);assert.equal(reads.length,0);}
});

test("non-admin cannot begin preview; own/other-owner targets are rejected",async()=>{
 reset();currentActor.role="staff";await quiet(async()=>{assert.notEqual((await POST(request({action:"start",userId:target.id}))).status,200);});assert.equal(reads.length,0);
 reset();currentTarget.id=actor.id;assert.equal((await POST(request({action:"start",userId:actor.id}))).status,400);
 reset();currentActor.email="another-admin@example.test";currentTarget.role="admin";assert.equal((await POST(request({action:"start",userId:target.id}))).status,403);
});

test("a failed start audit does not issue a preview cookie",async()=>{
 reset();failAudit=true;await quiet(async()=>{assert.equal((await POST(request({action:"start",userId:target.id}))).status,500);});assert.equal(jar.has(PREVIEW_COOKIE),false);
});

test("creating a preview-only account records the action without replacing login or duplicating an existing number",async()=>{
 reset();jar.set("nc_7x9k","original-admin-session");
 const duplicate=await POST(request({action:"create",phone:"9876543210",name:"Existing Customer"}));assert.equal(duplicate.status,409);assert.equal(created.length,0);
 const response=await POST(request({action:"create",phone:"9123456789",name:"New Customer"}));assert.equal(response.status,200);const body=await response.json();
 assert.equal(created.length,1);assert.equal(created[0].phone,"+919123456789");assert.equal(created[0].phoneVerifiedAt,undefined);assert.ok(String(created[0].passwordHash).length>20);
 assert.equal(audits[0].refId,body.userId);assert.equal(jar.get("nc_7x9k"),"original-admin-session");assert.equal(jar.has(PREVIEW_COOKIE),false);
 assert.equal((await POST(request({action:"start",userId:body.userId}))).status,200);
 const state=await (await POST(request({action:"state"}))).json();assert.equal(state.user.id,body.userId);
});

test("failed account provisioning audit rolls back the new account",async()=>{
 reset();failAudit=true;await quiet(async()=>{assert.equal((await POST(request({action:"create",phone:"9123456789",name:"New Customer"}))).status,500);});
 assert.equal(created.length,0);assert.equal(jar.has(PREVIEW_COOKIE),false);
});

test.after(()=>{if(previousToken===undefined)delete process.env.INTERNAL_API_TOKEN;else process.env.INTERNAL_API_TOKEN=previousToken;});
