import assert from "node:assert/strict";
import {createServer} from "node:http";
import {build} from "esbuild";
const {chromium}=await import(process.env.NISE_DOM_TEST_MODULES?"./dom-adapter.mjs":process.env.NISE_PLAYWRIGHT_MODULE||"playwright");
const bundle=await build({stdin:{loader:"tsx",resolveDir:process.cwd(),contents:`import React from "react";import {createRoot} from "react-dom/client";import Preview from "@/components/customer-preview-workspace";const root=createRoot(document.getElementById("root"));let key=0;window.showPreview=()=>root.render(<Preview key={++key}/>);window.showPreview();`},bundle:true,platform:"browser",format:"iife",write:false,logLevel:"silent",loader:{".css":"empty"},plugins:[{name:"preview-boundaries",setup(b){
 b.onResolve({filter:/^next\/navigation$/},()=>({path:"router",namespace:"stub"}));b.onResolve({filter:/^@\/lib\/secure-api-client$/},()=>({path:"api",namespace:"stub"}));
 b.onLoad({filter:/.*/,namespace:"stub"},args=>({contents:args.path==="router"?'export const useRouter=()=>window.router;':'export const secureApi=(op,input)=>window.api(op,input);'}));
}}]});
const server=createServer((req,res)=>{res.setHeader("content-type",req.url==="/test.js"?"text/javascript":"text/html");res.end(req.url==="/test.js"?bundle.outputFiles[0].text:'<!doctype html><html><body><div id="root"></div><script src="/test.js"></script></body></html>');});await new Promise(r=>server.listen(0,"127.0.0.1",r));
const browser=await chromium.launch({headless:true}),page=await browser.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
await page.addInitScript(()=>{window.actions=[];window.routes=[];window.router={replace:path=>window.routes.push(path),refresh:()=>{}};window.preview={user:{id:"customer-id",name:"Test Customer",email:"test@example.test",phone:null,role:"customer",emailVerified:false,phoneVerified:false,city:null,state:null,postalCode:null},requests:[{reference:"NC-TEST",name:"Test service",status:"submitted",createdAt:new Date().toISOString()}],jobs:[],visits:[],wallet:[],addresses:[],expiresAt:Date.now()+15*60_000};window.api=async(op,input)=>{if(op!=="V2a9N6sK4rD8")throw new Error("Unexpected preview API");window.actions.push(input.action);return input.action==="state"?window.preview:input.action==="section"?{status:"none",records:[],vouchers:[],sessions:[],tickets:[]}:{ok:true};};});
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.getByText("Viewing as Test Customer",{exact:true}).waitFor();
 const timer=await page.evaluate(()=>document.querySelector(".customer-preview__timer").textContent.trim());assert.ok(Number(timer.split(":")[0])<=15,"countdown starts at current time rather than Unix epoch");
 assert.equal(await page.getByRole("textbox").count(),0,"preview has no customer edit inputs");
 await page.getByRole("button",{name:"My requests",exact:true}).click();await page.getByText("Test service",{exact:true}).waitFor();
 for(const name of ["Counter visits","Print orders","Wallet","Saved addresses"]){await page.getByRole("button",{name,exact:true}).click();}
 assert.equal(await page.evaluate(()=>window.actions.length),1,"switching preview sections reuses its snapshot");
 for(const name of ["My records","Request history","Vouchers & offers","Profile details","Sign-in & privacy","Get help","Messages"]){await page.getByRole("button",{name,exact:true}).click();await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,30)));}
 assert.equal(await page.getByRole("textbox").count(),0,"all preview sections remain read only");
 await page.getByRole("button",{name:"Extend",exact:true}).click();await page.waitForFunction(()=>window.actions.includes("extend")&&window.actions.filter(a=>a==="state").length===2);
 await page.getByRole("button",{name:"Return to Admin",exact:true}).click();await page.waitForFunction(()=>window.routes.includes("/desk#customers"));
 assert.equal(await page.evaluate(()=>window.actions.at(-1)),"end");
 await page.evaluate(()=>{window.routes=[];window.preview.expiresAt=Date.now()-1000;window.showPreview();});
 await page.waitForFunction(()=>window.routes.includes("/desk#customers"));assert.equal(await page.locator(".customer-preview__account").count(),0);
 assert.deepEqual(errors,[]);console.log(`PASS (${process.env.NISE_DOM_TEST_MODULES?"simulated DOM":"Chromium"}): read-only sections, accurate initial countdown, snapshot reuse, Extend, Return to Admin and expiry exit.`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
