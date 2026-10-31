// Optional DOM fallback when no browser executable is available. Reports component checks only.
import { createRequire } from "node:module";
import { resolve } from "node:path";
const require = createRequire(resolve(process.env.NISE_DOM_TEST_MODULES, "package.json"));
const { JSDOM, VirtualConsole } = require("jsdom");
const query = require("@testing-library/dom");
const delay=()=>new Promise(resolve=>setTimeout(resolve,5));
async function wait(check){const until=Date.now()+5000;let last;do{try{return await check();}catch(error){last=error;await delay();}}while(Date.now()<until);throw last;}
class Locator {
  constructor(find){this.find=find;}
  first(){return new Locator(()=>this.find().slice(0,1));}
  async waitFor(){await wait(()=>{if(this.find().length!==1)throw new Error(`Expected one element, found ${this.find().length}`);});}
  async click(){await this.waitFor();this.find()[0].click();await delay();}
  async fill(value){await this.waitFor();const element=this.find()[0];const win=element.ownerDocument.defaultView;const setter=Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype,"value").set;setter.call(element,value);element.dispatchEvent(new win.Event("input",{bubbles:true}));await delay();}
  async count(){return this.find().length;}
}
export const chromium={async launch(){
  let dom, init, errors;
  const page={
    async addInitScript(fn){init=fn;},
    on(event,handler){if(event==="pageerror")errors=handler;},
    async goto(url){
      const console=new VirtualConsole();console.on("jsdomError",error=>errors?.(error));
      dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url,pretendToBeVisual:true,runScripts:"outside-only",virtualConsole:console});
      dom.window.eval(`(${init.toString()})()`);
      const script=await fetch(new URL("/test.js",url)).then(r=>r.text());dom.window.eval(script);await delay();
    },
    async evaluate(fn,arg){const result=dom.window.eval(`(${fn.toString()})(${JSON.stringify(arg)??"undefined"})`);await delay();return result;},
    async waitForFunction(fn,arg){return wait(async()=>{const value=await page.evaluate(fn,arg);if(!value)throw new Error("DOM condition timed out: "+fn.toString());return value;});},
    getByText(text,options={}){return new Locator(()=>query.queryAllByText(dom.window.document.body,text,options));},
    getByRole(role,options={}){return new Locator(()=>query.queryAllByRole(dom.window.document.body,role,options));},
    locator(selector){return new Locator(()=>[...dom.window.document.querySelectorAll(selector)]);},
  };
  return {newPage:async()=>page,close:async()=>dom?.window.close()};
}};
