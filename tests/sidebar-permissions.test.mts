import assert from "node:assert/strict";
import { test } from "node:test";
import { canSeeDeskMenu, sanitizedMenu, sidebarPermissionForPath, STAFF_MENU_AREAS } from "../src/lib/sidebar-permissions.ts";

test("a staff selection allows only selected modules", () => {
  const access = ["records", "campaigns", "tab:findcustomer", "tab:contacts"];
  assert.deepEqual(sanitizedMenu(access), ["findcustomer", "contacts"]);
  assert.equal(canSeeDeskMenu("staff", access, "contacts"), true);
  assert.equal(canSeeDeskMenu("staff", access, "campaigns"), false);
  assert.equal(canSeeDeskMenu("staff", access, "customers"), false);
  assert.equal(canSeeDeskMenu("staff", access, "team"), false);
  assert.equal(canSeeDeskMenu("admin", access, "team"), true);
  assert.equal(sidebarPermissionForPath("/api/admin/contacts"), "contacts");
  assert.equal(sidebarPermissionForPath("/api/admin/campaigns/queue"), "campaigns");
});

test("existing staff permissions remain backward compatible; menu includes all desk areas", () => {
  assert.equal(canSeeDeskMenu("staff", ["records"], "records"), true);
  const ids = new Set(STAFF_MENU_AREAS.map(x => x.id));
  assert.equal(ids.has("inbox") && ids.has("mail") && ids.has("chats") && ids.has("counter") && ids.has("payments"), true);
});
