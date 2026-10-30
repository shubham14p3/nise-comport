// Synthetic component regressions; no live account/database/network is used.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { build } from "esbuild";
import { resolve } from "node:path";
const {chromium}=await import(process.env.NISE_DOM_TEST_MODULES?"./dom-adapter.mjs":process.env.NISE_PLAYWRIGHT_MODULE||"playwright");
const result=await build({stdin:{resolveDir:process.cwd(),loader:"tsx",contents:`
 import React from "react";import {createRoot} from "react-dom/client";
 import OffersProvider,{useCode} from "@/components/offers-provider";
 import BirthdayGreeting from "@/components/birthday-greeting";
 import {invalidateSessionCache} from "${resolve('src/lib/session-client.ts')}";
 function Code(){const code=useCode("masked-token",true);return <div data-code>{code.text}</div>;}
 function App(){const [show,setShow]=React.useState(false);window.showCodes=setShow;
  return <OffersProvider promos={[]}><BirthdayGreeting/>{show&&<Code/>}</OffersProvider>;}
 window.changeUser=user=>{window.user=user;invalidateSessionCache();};
 window.navigate=path=>{window.path=path;window.dispatchEvent(new Event("route-test"));};
 createRoot(document.getElementById("root")).render(<App/>);
`},bundle:true,write:false,format:"iife",platform:"browser",logLevel:"silent",loader:{".css":"empty"},plugins:[{name:"public-test-boundaries",setup(b){
 b.onResolve({filter:/^@\/lib\/secure-api-client$/},args=>({path:args.path,namespace:"api"}));
 b.onLoad({filter:/.*/,namespace:"api"},()=>({contents:'export const secureApi=(op,input={})=>window.api(op,input);'}));
 b.onResolve({filter:/^@\/lib\/session-client$/},()=>({path:"session",namespace:"session-wrapper"}));
 b.onLoad({filter:/.*/,namespace:"session-wrapper"},()=>({contents:`import * as session from ${JSON.stringify(resolve('src/lib/session-client.ts'))};export const SESSION_CHANGED=session.SESSION_CHANGED;export function getSessionUser(){window.sessionReads++;return session.getSessionUser();}`,resolveDir:process.cwd()}));
 b.onResolve({filter:/^next\/navigation$/},()=>({path:"navigation",namespace:"next"}));
 b.onResolve({filter:/^next\/link$/},()=>({path:"link",namespace:"next"}));
 b.onLoad({filter:/.*/,namespace:"next"},args=>({contents:args.path==="navigation"?'import {useSyncExternalStore} from "react";export const usePathname=()=>useSyncExternalStore(cb=>{window.addEventListener("route-test",cb);return()=>window.removeEventListener("route-test",cb);},()=>window.path,()=>"/");':'import React from "react";export default function Link({prefetch,...props}){return React.createElement("a",props);}',resolveDir:process.cwd()}));
}}]});
const server=createServer((req,res)=>{res.setHeader("content-type",req.url==="/test.js"?"text/javascript":"text/html");res.end(req.url==="/test.js"?result.outputFiles[0].text:'<!doctype html><html><body><div id="root"></div><script src="/test.js"></script></body></html>');});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const browser=await chromium.launch({headless:true});const page=await browser.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
await page.addInitScript(()=>{window.path="/";window.user=null;window.calls=[];window.sessionReads=0;window.pending=[];window.deferCodes=false;
 window.api=(op,input)=>{window.calls.push({op,input});if(op==="C4w7G2hN6kP9")return Promise.resolve({user:window.user});if(op==="M5q9B2nT7wR3")return Promise.resolve({signedIn:true,greeting:null});if(op==="H3d8Y5qN2sW7"){if(window.deferCodes)return new Promise(resolve=>window.pending.push(resolve));return Promise.resolve({signedIn:true,codes:{"masked-token":"UNLOCKED"}});}throw new Error("Unexpected API "+op);};
});
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.waitForFunction(()=>typeof window.navigate==="function"&&window.sessionReads>=2);
 const reads=await page.evaluate(()=>window.sessionReads);
 await page.evaluate(()=>window.navigate("/services/pan-card"));
 await page.evaluate(()=>window.navigate("/services/bike-insurance"));
 assert.equal(await page.evaluate(()=>window.sessionReads),reads,"ordinary public navigation must not rerun the birthday session check");
 assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.op==="C4w7G2hN6kP9").length),1,"anonymous shell consumers share one request");
 await page.evaluate(()=>window.changeUser({id:"a",name:"A",email:"a@example.test",role:"customer"}));
 await page.waitForFunction(()=>window.calls.some(c=>c.op==="M5q9B2nT7wR3"));
 assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.op==="H3d8Y5qN2sW7").length),0,"no protected code request before a masked-code consumer mounts");
 await page.evaluate(()=>window.showCodes(true));await page.getByText("UNLOCKED",{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.op==="H3d8Y5qN2sW7").length),1);
 await page.evaluate(()=>window.showCodes(false));await page.evaluate(()=>window.navigate("/"));await page.evaluate(()=>window.showCodes(true));await page.getByText("UNLOCKED",{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.calls.filter(c=>c.op==="H3d8Y5qN2sW7").length),1,"remounted consumers reuse the root provider result");
 await page.evaluate(()=>window.changeUser(null));await page.getByText("XXXXXX",{exact:true}).waitFor();
 await page.evaluate(()=>{window.deferCodes=true;window.changeUser({id:"b",name:"B",email:"b@example.test",role:"customer"});});
 await page.waitForFunction(()=>window.pending.length===1);
 await page.evaluate(()=>window.changeUser(null));
 await page.evaluate(()=>window.pending[0]({signedIn:true,codes:{"masked-token":"STALE"}}));
 assert.equal(await page.getByText("STALE",{exact:true}).count(),0);
 assert.equal(await page.getByText("XXXXXX",{exact:true}).count(),1);
 assert.deepEqual(errors,[]);
 console.log(`PASS (${process.env.NISE_DOM_TEST_MODULES?"simulated DOM":"Chromium"}): shared session, route-stable birthday checks, on-demand code loading, repeated navigation/consumers and logout during an in-flight reveal.`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
