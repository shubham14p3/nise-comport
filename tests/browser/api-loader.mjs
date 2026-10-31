// Real activity store/component with synthetic requests; no live network or account.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {build} from "esbuild";
const {chromium}=await import(process.env.NISE_DOM_TEST_MODULES?"./dom-adapter.mjs":process.env.NISE_PLAYWRIGHT_MODULE||"playwright");
const bundle=await build({stdin:{loader:"tsx",resolveDir:process.cwd(),contents:`
 import React from "react";import {createRoot} from "react-dom/client";
 import Indicator from "@/components/api-activity-indicator";
 import {trackApiActivity} from "@/lib/api-activity";
 import {LOADER_CHANGED} from "@/lib/loader-config";
 const root=createRoot(document.getElementById("root"));
 window.pending=[];window.start=()=>{const index=window.pending.length;trackApiActivity(new Promise(resolve=>window.pending.push(resolve)));return index;};
 window.finish=index=>window.pending[index]();window.setLogo=src=>window.dispatchEvent(new CustomEvent(LOADER_CHANGED,{detail:{src}}));
 root.render(<Indicator/>);
`},bundle:true,format:"iife",platform:"browser",write:false,logLevel:"silent"});
const server=createServer((req,res)=>{res.setHeader("content-type",req.url==="/test.js"?"text/javascript":"text/html");res.end(req.url==="/test.js"?bundle.outputFiles[0].text:'<!doctype html><html><body><div id="root"></div><script src="/test.js"></script></body></html>');});
await new Promise(r=>server.listen(0,"127.0.0.1",r));const browser=await chromium.launch({headless:true});const page=await browser.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
await page.addInitScript(()=>{window.fetchCalls=0;window.fetch=async()=>{window.fetchCalls++;return {ok:true};};});
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>typeof window.start==="function");
 await page.evaluate(()=>window.start());
 assert.equal(await page.getByRole("status").count(),0,"each busy episode starts without a flash");
 await page.getByRole("status").waitFor();
 await page.waitForFunction(()=>document.querySelector(".api-activity__logo")?.getAttribute("src")==="/images/logo/logo-footer.png");
 await page.evaluate(()=>window.start());await page.evaluate(()=>window.finish(0));
 assert.equal(await page.getByRole("status").count(),1,"one remaining concurrent request keeps the loader visible");
 await page.evaluate(()=>window.finish(1));await page.waitForFunction(()=>!document.querySelector(".api-activity"));
 await page.evaluate(()=>window.start());
 assert.equal(await page.getByRole("status").count(),0,"a second busy episode must reset the delay");
 await page.getByRole("status").waitFor();
 const custom="/branding/loader/8f16c321-4423-4b70-9e18-cf3c04ce8320.webp";
 await page.evaluate(src=>window.setLogo(src),custom);
 await page.waitForFunction(src=>document.querySelector(".api-activity__logo")?.getAttribute("src")===src,custom);
 await page.evaluate(()=>document.querySelector(".api-activity__logo").dispatchEvent(new Event("error")));
 await page.waitForFunction(()=>document.querySelector(".api-activity__logo")?.getAttribute("src")==="/images/logo/logo-footer.png");
 assert.equal(await page.evaluate(()=>window.fetchCalls),0,"showing the loader must not fetch settings");
 await page.evaluate(()=>window.finish(2));await page.waitForFunction(()=>!document.querySelector(".api-activity"));
 assert.deepEqual(errors,[]);console.log(`PASS (${process.env.NISE_DOM_TEST_MODULES?"simulated DOM":"Chromium"}): site/custom logo, new-episode delay, concurrent completion, broken-asset fallback and no per-call settings requests.`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
