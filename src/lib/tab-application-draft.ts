"use client";

/**
 * Short-lived tab-scoped restoration through authentication.
 * AES-GCM keeps sensitive data out of plain-text browser storage, but this is
 * NOT a defence against same-origin XSS: the encryption key is also in this tab.
 * Never use cookies, persistent localStorage, URLs or analytics for applicant data.
 * Files are deliberately excluded. Clear records on submission and expiry.
 */
const PREFIX="nise:application-preview:v1:";
const KEY=PREFIX+"tab-key";
export const APPLICATION_DRAFT_LIFETIME=45*60*1000;
const MAX_BYTES=32*1024;
const encoder=new TextEncoder();
const decoder=new TextDecoder();
type Sealed={version:1;expiresAt:number;nonce:string;data:string};
const queues=new Map<string,Promise<boolean>>();

function b64(bytes:Uint8Array):string {
  let out="";
  for(let i=0;i<bytes.length;i+=8192)out+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(out);
}
function fromB64(raw:string):Uint8Array {
  const text=atob(raw);
  return Uint8Array.from(text,c=>c.charCodeAt(0));
}
function ab(bytes:Uint8Array):ArrayBuffer {
  const copy=new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}
async function tabKey(create:boolean) {
  if(typeof window==="undefined"||!window.crypto?.subtle)return null;
  let raw=sessionStorage.getItem(KEY);
  if(!raw&&create) {
    raw=b64(crypto.getRandomValues(new Uint8Array(32)));
    sessionStorage.setItem(KEY,raw);
  }
  if(!raw)return null;
  return crypto.subtle.importKey("raw",ab(fromB64(raw)),{name:"AES-GCM"},false,["encrypt","decrypt"]);
}
function draftKey(name:string) { return PREFIX+name; }
async function saveNow(name:string,value:unknown):Promise<boolean>{
  try{
    const key=await tabKey(true);
    if(!key)return false;
    const raw=encoder.encode(JSON.stringify(value));
    if(raw.length>MAX_BYTES)return false;
    const nonce=crypto.getRandomValues(new Uint8Array(12));
    const encrypted=await crypto.subtle.encrypt({name:"AES-GCM",iv:ab(nonce)},key,raw);
    const record:Sealed={version:1,expiresAt:Date.now()+APPLICATION_DRAFT_LIFETIME,
      nonce:b64(nonce),data:b64(new Uint8Array(encrypted))};
    sessionStorage.setItem(draftKey(name),JSON.stringify(record));
    return true;
  }catch{return false;}
}
/** Writes for each form are sequential, including the last save before redirect. */
export function saveApplicationDraft(name:string,value:unknown):Promise<boolean> {
  const previous=queues.get(name)??Promise.resolve(true);
  const next=previous.catch(()=>false).then(()=>saveNow(name,value));
  queues.set(name,next);
  void next.finally(()=>{if(queues.get(name)===next)queues.delete(name);});
  return next;
}
export async function readApplicationDraft<T>(name:string):Promise<T|null>{
  try{
    const raw=sessionStorage.getItem(draftKey(name));
    if(!raw)return null;
    const envelope=JSON.parse(raw) as Sealed;
    if(envelope.version!==1||envelope.expiresAt<Date.now()){
      sessionStorage.removeItem(draftKey(name));return null;
    }
    const key=await tabKey(false);
    if(!key)return null;
    const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:ab(fromB64(envelope.nonce))},key,ab(fromB64(envelope.data)));
    return JSON.parse(decoder.decode(plain)) as T;
  }catch{
    try{sessionStorage.removeItem(draftKey(name));}catch{}
    return null;
  }
}
export function clearApplicationDraft(name:string){
  try{sessionStorage.removeItem(draftKey(name));}catch{}
}
