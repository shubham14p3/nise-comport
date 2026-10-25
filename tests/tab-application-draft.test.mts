import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { APPLICATION_DRAFT_LIFETIME, saveApplicationDraft, readApplicationDraft, clearApplicationDraft } from "../src/lib/tab-application-draft.ts";

function store(){
  const records=new Map<string,string>();
  return {
    records,
    getItem:(key:string)=>records.get(key)??null,
    setItem:(key:string,value:string)=>{records.set(key,value);},
    removeItem:(key:string)=>{records.delete(key);},
  };
}
const session=store();
Object.defineProperty(globalThis,"window",{configurable:true,value:{crypto:webcrypto}});
Object.defineProperty(globalThis,"crypto",{configurable:true,value:webcrypto});
Object.defineProperty(globalThis,"sessionStorage",{configurable:true,value:session});

test("PAN passport and voter data survives tab navigation without plain-text stored answers",async()=>{
  for(const name of ["pan-request","service-request"]){
    const data={name:"Applicant confidential",aadhaar:"123456789012",form:name};
    assert.equal(await saveApplicationDraft(name,data),true);
    const raw=[...session.records.values()].join(" ");
    assert.equal(raw.includes("Applicant confidential"),false);
    assert.equal(raw.includes("123456789012"),false);
    assert.deepEqual(await readApplicationDraft(name),data);
    clearApplicationDraft(name);
    assert.equal(await readApplicationDraft(name),null);
  }
});

test("encrypted applicant draft expires and cannot be restored without tab key",async()=>{
  assert.equal(await saveApplicationDraft("pan-request",{secret:"private"}),true);
  const item=[...session.records.keys()].find(key=>key.endsWith("pan-request"));
  assert.ok(item);
  const data=JSON.parse(session.records.get(item));
  data.expiresAt=Date.now()-1;
  session.setItem(item,JSON.stringify(data));
  assert.equal(await readApplicationDraft("pan-request"),null);
  assert.equal(session.getItem(item),null);
  assert.equal(APPLICATION_DRAFT_LIFETIME,45*60*1000);
  assert.equal(await saveApplicationDraft("pan-request",{secret:"private"}),true);
  const key=[...session.records.keys()].find(k=>k.endsWith("tab-key"));
  assert.ok(key);
  session.removeItem(key);
  assert.equal(await readApplicationDraft("pan-request"),null);
});
