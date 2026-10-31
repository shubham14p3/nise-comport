import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { loaderImage, MAX_LOADER_BYTES } from "../src/lib/loader-image.ts";

test("SVG logos become raster images rather than active XML",async()=>{
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><script>alert(1)</script><rect width="32" height="32" fill="red"/></svg>';
 const bytes=await loaderImage(new File([svg],"logo.svg",{type:"image/svg+xml"}));
 assert.equal((await sharp(bytes).metadata()).format,"webp");assert.equal(bytes.includes(Buffer.from("<script>")),false);
});
test("GIF animation is preserved in the normalized loader",async()=>{
 const gif=Buffer.from("R0lGODlhAgACAIEAAP8AAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQACgAAACwAAAAAAgACAAAIBgABCAQQEAAh+QQBCgABACwAAAAAAgACAIEAAP8AAAAAAAAAAAAIBgABCAQQEAA7","base64");
 const bytes=await loaderImage(new File([gif],"loader.gif",{type:"image/gif"}));
 const info=await sharp(bytes,{animated:true}).metadata();assert.equal(info.format,"webp");assert.equal(info.pages,2);
});
test("invalid, oversized and spoofed image inputs are rejected",async()=>{
 await assert.rejects(loaderImage(new File(["not a png"],"logo.png",{type:"image/png"})),/Could not read/);
 await assert.rejects(loaderImage(new File([new Uint8Array(MAX_LOADER_BYTES+1)],"logo.gif",{type:"image/gif"})),/under 2 MB/);
 await assert.rejects(loaderImage(new File(["<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"4\" height=\"4\"/>"],"fake.png",{type:"image/png"})),/Could not read/);
 await assert.rejects(loaderImage(new File(["x"],"bad.html",{type:"text/html"})),/Choose a/);
});
