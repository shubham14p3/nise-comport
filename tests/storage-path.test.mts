import assert from "node:assert/strict";
import {test} from "node:test";
import {resolve,parse} from "node:path";
import {tmpdir} from "node:os";
import {privateStoragePath} from "../src/lib/storage.ts";
test("private upload paths support native filesystem roots and reject sibling escapes",()=>{
 const old=process.env.PRIVATE_UPLOAD_DIR;
 try{
  const root=resolve(tmpdir(),"nise-storage-test");process.env.PRIVATE_UPLOAD_DIR=root;
  assert.equal(privateStoragePath("branding/logo.webp"),resolve(root,"branding/logo.webp"));
  assert.throws(()=>privateStoragePath("../outside/logo.webp"),/Invalid private file key/);
  assert.throws(()=>privateStoragePath(root+"-sibling/logo.webp"),/Invalid private file key/);
  process.env.PRIVATE_UPLOAD_DIR=parse(root).root;
  assert.equal(privateStoragePath("branding/logo.webp"),resolve(parse(root).root,"branding/logo.webp"));
 }finally{if(old===undefined)delete process.env.PRIVATE_UPLOAD_DIR;else process.env.PRIVATE_UPLOAD_DIR=old;}
});
