import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadServerModule } from './helpers/load-server-module.mjs';
let reads=0;
(globalThis as unknown as {__niseTest:unknown}).__niseTest={actor:{id:'staff',name:'Staff',role:'staff',permissions:['counter']},db:{select(){reads++;throw new Error('Verification must not read or mutate a customer through Counter');}}};
const {POST}=await loadServerModule('src/app/api/admin/counter/route.ts');
test('Counter rejects every legacy verification action even when invoked directly by staff',async()=>{
 const error=console.error;console.error=()=>{};
 try {for(const action of ['confirm','code-send','code-check','verify-request']){
  const response=await POST(new Request('http://test/api/admin/counter',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,userId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',channel:'email',code:'123456'})}));
  assert.equal(response.status,400);
 }}finally{console.error=error;}
 assert.equal(reads,0);
});
