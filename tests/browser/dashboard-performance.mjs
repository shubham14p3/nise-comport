// Local component smoke checks with synthetic API responses. Never uses account cookies or a DB.
// Requires Playwright and its Chromium browser; NISE_PLAYWRIGHT_MODULE may point to a supplied install.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { build } from "esbuild";
const { chromium } = await import(process.env.NISE_DOM_TEST_MODULES ? "./dom-adapter.mjs" : process.env.NISE_PLAYWRIGHT_MODULE || "playwright");
const keep = new Set(["admin-dashboard", "admin-pager", "contacts-panel", "records-panel", "customer-management-panel", "chats-panel", "inbox-panel", "portal", "icons"]);
const result = await build({
  stdin: { contents: `
    import React from "react"; import {createRoot} from "react-dom/client";
    import Admin from "@/components/admin-dashboard";
    import Contacts from "@/components/contacts-panel";
    import Records from "@/components/records-panel";
    import Customers from "@/components/customer-management-panel";
    import Chats from "@/components/chats-panel";
    const root=createRoot(document.getElementById("root")); let version=0;
    const components={admin:Admin,contacts:Contacts,records:Records,customers:Customers,chats:Chats};
    window.show=(view,hash="")=>{window.location.hash=hash;const C=components[view];root.render(<C key={++version} me={{id:"owner",name:"Owner",role:"admin",permissions:[]}} services={[]}/>);};
  `, resolveDir: process.cwd(), loader: "tsx" },
  bundle: true, write: false, platform: "browser", format: "iife", logLevel: "silent", loader: { ".css": "empty" },
  plugins: [{ name: "synthetic-ui-boundaries", setup(builder) {
    builder.onResolve({ filter: /^@\/lib\/secure-api-client$/ }, args => ({ path: args.path, namespace: "mock-api" }));
    builder.onLoad({ filter: /.*/, namespace: "mock-api" }, () => ({ contents: `export const secureApi=(op,input={})=>window.api(op,input); export const secureUpload=secureApi; export const secureFile=secureApi; export class SecureApiError extends Error {}` }));
    builder.onResolve({ filter: /^next\/(navigation|link|dynamic)$/ }, args => ({ path: args.path, namespace: "mock-next" }));
    builder.onLoad({ filter: /.*/, namespace: "mock-next" }, args => ({ contents: args.path.endsWith("navigation") ? 'export const useRouter=()=>({push:()=>{},refresh:()=>{}});' : args.path.endsWith("link") ? 'import React from "react"; export default function Link({children,...props}) { return React.createElement("a",props,children); }' : 'import React from "react"; export default function dynamic(load,options={}) {const C=React.lazy(load); return props=>React.createElement(React.Suspense,{fallback:options.loading?.()},React.createElement(C,props));}' , resolveDir: process.cwd() }));
    builder.onResolve({ filter: /^@\/components\// }, args => {
      const name=args.path.split("/").at(-1); return keep.has(name) ? null : { path: name, namespace: "mock-panel" };
    });
    builder.onLoad({ filter: /.*/, namespace: "mock-panel" }, args => {
      const op = {"mail-client":"Q3x8M5wT2kB7","team-panel":"K8d3N6wQ1zT4","site-team-panel":"T9q4M2xV7bL3"}[args.path];
      return { contents: `import React from "react"; export default function Panel(props) { React.useEffect(()=>{${op ? `window.api("${op}",${args.path === "mail-client" ? '{view:"meta"}' : '{}'}).then(r=>props.onUnread?.(r.unread));` : ''}},[]);return React.createElement("div",{"data-stub":${JSON.stringify(args.path)}});}`, resolveDir: process.cwd() };
    });
  } }],
});
const script=result.outputFiles[0].text;
const server=createServer((req,res)=>{res.setHeader("content-type",req.url==="/test.js"?"text/javascript":"text/html");res.end(req.url==="/test.js"?script:'<!doctype html><html><body><div id="root"></div><script src="/test.js"></script></body></html>');});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
const errors=[];page.on("pageerror",error=>errors.push(error.message));
await page.addInitScript(()=>{
  const now="2026-10-30T12:00:00.000Z";
  const contact=name=>({id:name,name,phone:"+919876543210",locale:"en",area:null,services:[],consent:"unknown",lastMessagedAt:null,source:null});
  const person=name=>({key:name,name,mobile:"+919876543210",whatsapp:null,altMobiles:[],email:null,address:null,total:1,services:[],lastDate:null,nextRenewal:null});
  const customer=name=>({id:name,name,email:"test@example.test",phone:"+919876543210",role:"customer",emailVerified:false,phoneVerified:false,createdAt:now,updatedAt:now,disabled:false,archived:false});
  window.listing=(op,name,input={})=>op==="D4q8M2wS7kF1"?{contacts:[contact(name)],totals:{unknown:55},matched:55}:op==="W8r2T5yN1cF6"?{people:[person(name)],totals:{people:55,records:55,repeat:0},byService:[],services:{}}:{users:[customer(name)],total:55,page:input.page??0,pageSize:input.pageSize??20};
  window.calls=[];window.pending=[];window.defer=null;
  window.api=(op,input)=>{
    const call={op,input};window.calls.push(call);
    if(window.defer===op)return new Promise((resolve,reject)=>window.pending.push({call,resolve,reject}));
    if(["D4q8M2wS7kF1","W8r2T5yN1cF6","C2m7R4vN9kP6"].includes(op))return Promise.resolve(window.listing(op,"Initial customer",input));
    if(op==="U3j7P1xH5nQ9")return Promise.resolve(input.phone?{messages:[{id:input.phone,body:"Messages for "+input.phone,direction:"in",sender:"Customer",createdAt:now}]}:{configured:true,conversations:[{phone:"111",name:"Alpha",last:"Hello",at:now,direction:"in",needsHuman:false},{phone:"222",name:"Beta",last:"Hello",at:now,direction:"in",needsHuman:false}]});
    if(op==="I5x2N8kQ3wT6")return Promise.resolve({items:[],unread:3,seenAt:now,pending:[],callbacks:null,summary:{unread:3,waiting:4,callbacks:2}});
    return Promise.resolve({unread:2});
  };
});
async function show(name,hash="") {await page.evaluate(({name,hash})=>{window.defer=null;window.calls=[];window.pending=[];window.show(name,hash);},{name,hash});}
async function pending(n) {await page.waitForFunction(n=>window.pending.length>=n,n);}
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(()=>typeof window.show==="function");
  await show("admin","team");
  await page.getByText("Staff & owner login accounts",{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>window.calls.length),0,"closed Team sections must not request data");
  await page.getByText("Staff & owner login accounts",{exact:true}).click();
  await page.locator('[data-stub="team-panel"]').waitFor();
  await page.waitForFunction(()=>window.calls.some(c=>c.op==="K8d3N6wQ1zT4"));
  assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.op==="K8d3N6wQ1zT4").length),1);
  await page.getByText("Staff & owner login accounts",{exact:true}).click();
  await page.getByText("Staff & owner login accounts",{exact:true}).click();
  await page.locator('[data-stub="team-panel"]').waitFor();
  assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.op==="K8d3N6wQ1zT4").length),1,"closing/reopening must preserve the mounted form and avoid refetching");
  await show("admin","mail");await page.locator('[data-stub="mail-client"]').waitFor();
  await page.waitForFunction(()=>window.calls.length>0);
  assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.op==="Q3x8M5wT2kB7").length),1,"MailClient must be the only metadata owner");
  await show("admin","inbox");await page.getByText("Requests waiting",{exact:true}).waitFor();
  assert.deepEqual(Array.from(await page.evaluate(()=>window.calls.filter(c=>c.op==="I5x2N8kQ3wT6").map(c=>Boolean(c.input.count)))),[false],"Inbox summary comes from the full response");

  for(const [view,op] of [["contacts","D4q8M2wS7kF1"],["records","W8r2T5yN1cF6"],["customers","C2m7R4vN9kP6"]]) {
    await show(view);await page.getByText("Initial customer",{exact:true}).waitFor();
    await page.evaluate(op=>{window.defer=op;},op);
    await page.getByRole("button",{name:"Next",exact:true}).first().click();await pending(1);
    // Customer controls remain busy during a page request; resolving it also verifies page forwarding.
    if(view==="customers") {
      const input=await page.evaluate(()=>window.pending[0].call.input);assert.equal(input.page,1);
      await page.evaluate(op=>{const p=window.pending[0];p.resolve(window.listing(op,"Next customer",p.call.input));},op);
      await page.getByText("Next customer",{exact:true}).waitFor();
      await page.getByRole("button",{name:"Last page"}).first().click();await pending(2);
      await page.evaluate(()=>window.pending[1].resolve({users:[],total:20,page:2,pageSize:20}));
      await pending(3);
      assert.equal(await page.evaluate(()=>window.pending[2].call.input.page),0,"empty final page must step back");
      await page.evaluate(op=>{const p=window.pending[2];p.resolve(window.listing(op,"Remaining customer",p.call.input));},op);
      await page.getByText("Remaining customer",{exact:true}).waitFor();
    } else {
      await page.getByRole("button",{name:"Last page"}).first().click();await pending(2);
      await page.evaluate(op=>{const p=window.pending[1];p.resolve(window.listing(op,"Newest customer",p.call.input));},op);
      await page.getByText("Newest customer",{exact:true}).waitFor();
      await page.evaluate(op=>{const p=window.pending[0];p.resolve(window.listing(op,"Stale customer",p.call.input));},op);
      await page.waitForFunction(()=>!document.body.textContent.includes("Stale customer"));
      assert.equal(await page.getByText("Newest customer",{exact:true}).count(),1);
    }
  }

  await show("chats");await page.getByText("Messages for 111",{exact:true}).waitFor();
  await page.evaluate(()=>{window.defer="U3j7P1xH5nQ9";});
  await page.getByRole("button",{name:/Beta/}).click();await pending(1);
  await page.getByRole("button",{name:/Alpha/}).click();await pending(2);
  await page.evaluate(()=>window.pending[1].resolve({messages:[{id:"new",body:"Current Alpha",sender:"Customer",direction:"in",createdAt:"2026-10-30T12:00:00Z"}]}));
  await page.getByText("Current Alpha",{exact:true}).waitFor();
  await page.evaluate(()=>window.pending[0].resolve({messages:[{id:"old",body:"Stale Beta",sender:"Customer",direction:"in",createdAt:"2026-10-30T12:00:00Z"}]}));
  assert.equal(await page.getByText("Stale Beta",{exact:true}).count(),0);
  assert.equal(await page.getByText("Current Alpha",{exact:true}).count(),1);
  // A failed send for Alpha must not show up on Beta after switching.
  await page.evaluate(()=>{window.defer="C5t9W2yM6kD8";window.pending=[];});
  await page.getByRole("textbox",{name:"Message",exact:true}).fill("Test reply");
  await page.getByRole("button",{name:"Send",exact:true}).click();await pending(1);
  await page.getByRole("button",{name:/Beta/}).click();
  await page.getByText("Messages for 222",{exact:true}).waitFor();
  await page.evaluate(()=>window.pending[0].reject(new Error("Old Alpha send failed")));
  assert.equal(await page.getByRole("alert").count(),0);
  assert.deepEqual(errors,[]);
  console.log(`PASS (${process.env.NISE_DOM_TEST_MODULES ? "simulated DOM" : "Chromium"}): Team lazy mounting, single Mail/Inbox request ownership, customer pagination/empty-page recovery, out-of-order Contacts/Records/WhatsApp responses and send errors, no component exceptions.`);
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
