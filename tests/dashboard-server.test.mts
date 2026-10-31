import assert from "node:assert/strict";
import { test } from "node:test";
import { getTableName } from "drizzle-orm";
import { loadServerModule } from "./helpers/load-server-module.mjs";

const customer = {id:"00000000-0000-4000-8000-000000000002",name:"Test Customer",email:"test@example.test",phone:"+919876543210",role:"customer",emailVerifiedAt:new Date(0),phoneVerifiedAt:null,createdAt:new Date(0),updatedAt:new Date(0),disabledAt:null,deletedAt:null};
const queries: Array<{table:string;columns:string[];limit?:number;offset?:number}> = [];
let transactions=0, active=0, maxActive=0, duplicates=false;
const fixture = {
  requireStaff(role:string) { assert.equal(role,"admin"); return {id:"owner",role:"admin"}; },
  db: {
    transaction() { transactions++; throw new Error("A counter read must not start a transaction"); },
    select(columns?:Record<string,unknown>) {
      const query={table:"",columns:Object.keys(columns??{}),limit:undefined as number|undefined,offset:undefined as number|undefined};
      const chain={
        from(table:Parameters<typeof getTableName>[0]) { query.table=getTableName(table); return chain; },
        where() { return chain; },orderBy() { return chain; },leftJoin() { return chain; },
        limit(n:number) { query.limit=n; return chain; },offset(n:number) { query.offset=n; return chain; },
        then(resolve:(value:unknown[])=>void,reject:(error:unknown)=>void) {
          queries.push(query); active++; maxActive=Math.max(maxActive,active);
          return new Promise<unknown[]>(done=>setTimeout(()=>{
            active--;
            if(query.columns.includes("balance"))done([{balance:"12.34"}]);
            else if(query.columns.includes("total"))done([{total:55}]);
            else if(query.table==="users") { const rows=duplicates?[customer,{...customer,id:"second",email:"counter-9876543210@counter.invalid"}]:[customer]; done(rows.map(row=>query.columns.length?Object.fromEntries(query.columns.map(key=>[key,row[key as keyof typeof row]])):row)); }
            else done([]);
          },0)).then(resolve,reject);
        },
      };return chain;
    },
  },
};
(globalThis as unknown as {__niseTest:typeof fixture}).__niseTest=fixture;
const counter=await loadServerModule(process.env.NISE_COUNTER_TEST_SOURCE??"src/lib/counter.ts");
const customers=await loadServerModule("src/app/api/admin/customers/route.ts");
function reset(){queries.length=0;transactions=0;maxActive=0;active=0;duplicates=false;}

test("counter reads use four selects, no transaction, and parallel independent details",async()=>{
  reset();
  const result=await counter.lookupCustomer("9876543210",2);
  assert.equal(result.balancePaise,1234);
  assert.deepEqual(result.customer,{id:customer.id,name:customer.name});
  assert.deepEqual(result.contact,{email:customer.email,emailVerified:true,phone:customer.phone,phoneVerified:false});
  assert.equal(result.visitsTotal,55);assert.equal(result.page,2);
  assert.equal(transactions,0);assert.equal(queries.length,4);assert.equal(maxActive,3);
  assert.equal(queries.find(q=>q.table==="counter_visits"&&!q.columns.includes("total"))?.offset,10);
});

test("email and selected-account lookups keep the same contact/balance shape",async()=>{
  reset();
  for(const result of [await counter.lookupCustomerByEmail(customer.email),await counter.lookupCounterAccount(customer.id,"9876543210")]) {
    assert.equal(result.balancePaise,1234);assert.equal(result.phone,customer.phone);assert.equal(result.contact.emailVerified,true);
  }
  assert.equal(transactions,0);assert.equal(queries.length,8);
});

test("shared-phone lookup returns only candidate identities and no financial reads",async()=>{
  reset();duplicates=true;
  const result=await counter.lookupCustomer("9876543210");
  assert.equal(result.ambiguous,true);assert.equal(queries.length,1);
  assert.deepEqual(Object.keys(result.candidates[0]).sort(),["email","id","name","role"]);
  assert.equal(result.candidates[1].email,null);
});

test("customer list bounds SQL rows and excludes credential columns",async()=>{
  reset();
  const response=await customers.GET({nextUrl:new URL("http://test/api/admin/customers?page=2&pageSize=10")});
  const result=await response.json();
  assert.equal(response.status,200);assert.equal(result.total,55);assert.equal(result.page,2);assert.equal(result.pageSize,10);
  const query=queries.find(q=>q.table==="users"&&!q.columns.includes("total"))!;
  assert.equal(query.limit,10);assert.equal(query.offset,20);
  assert.ok(query.columns.includes("emailVerifiedAt"));
  assert.ok(!query.columns.includes("passwordHash"));assert.ok(!query.columns.includes("loginPinHash"));
  assert.equal(result.users[0].passwordHash,undefined);
  assert.equal(maxActive,2);
});

test("customer list still enforces owner authorization before querying",async()=>{
  reset();const allowed=fixture.requireStaff;
  fixture.requireStaff=()=>{throw new Error("owner-only test denial");};
  const original=console.error;console.error=()=>{};
  try {
    const response=await customers.GET({nextUrl:new URL("http://test/api/admin/customers")});
    assert.equal(response.status,500);assert.equal(queries.length,0);
  }finally{fixture.requireStaff=allowed;console.error=original;}
});
