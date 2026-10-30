import assert from "node:assert/strict";
import { test } from "node:test";
import { loaderSettings, loaderAssetId, DEFAULT_LOADER_SRC } from "../src/lib/loader-config.ts";

test("loader defaults to the site logo and only accepts immutable local branding assets",()=>{
  const id="8f16c321-4423-4b70-9e18-cf3c04ce8320";
  assert.ok(DEFAULT_LOADER_SRC.startsWith("/images/logo/"));
  assert.deepEqual(loaderSettings({src:`/branding/loader/${id}.webp`}),{src:`/branding/loader/${id}.webp`});
  for(const src of ["https://evil.test/logo.svg","//evil.test/x","javascript:alert(1)","/branding/loader/../../secret","/api/auth/session",null])assert.deepEqual(loaderSettings({src}),{src:null});
  assert.equal(loaderAssetId(`${id}.webp`),id);
  assert.equal(loaderAssetId("../../secrets.webp"),null);
});
