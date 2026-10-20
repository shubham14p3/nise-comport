import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { aadhaarFrom, cellText, dateFrom, maskAadhaar, maskPan, mobileFrom, parseWorkbook } from "../src/lib/record-import.ts";
import { findGuide, findVariant, HELP_GUIDES } from "../src/lib/help-docs.ts";
import { blindIndex, open, seal } from "../src/lib/vault.ts";

test("cells, mobiles, dates and ID numbers are read the way registers write them", () => {
  assert.equal(cellText(9876543210.0), "9876543210");
  assert.equal(cellText(new Date("2025-03-04T00:00:00Z")), "2025-03-04");
  assert.equal(cellText({ result: "Ravi" }), "Ravi");
  assert.equal(cellText("#VALUE!"), "");
  assert.equal(mobileFrom("98765 43210"), "+919876543210");
  assert.equal(mobileFrom("+91-98765-43210"), "+919876543210");
  assert.equal(mobileFrom("09876543210/9123456789"), "+919876543210");
  assert.equal(mobileFrom("12345"), null);
  assert.equal(dateFrom("27-5-17"), "2017-05-27");
  assert.equal(dateFrom("31/02/2024"), null);
  assert.equal(aadhaarFrom("2345 6789 0123"), "234567890123");
  assert.equal(maskPan("ABCDE1234F"), "ABXXXXX34F");
  assert.equal(maskAadhaar("234567890123"), "XXXX XXXX 0123");
});

test("every sheet is read: header found, service worked out, passwords dropped, accounts skipped", () => {
  const result = parseWorkbook("pancard", [
    { name: "rates", rows: [["PHOTOS", 40], ["cab", 875]] },
    { name: "PAN DETAIL", rows: [["Coupon No.", "Name", "DOB", "MOB", "PAN"], ["C1", "ASHOK KUMAR", "1990-01-02", 9876543210, "abcde1234f"], ["C2", "", "", 9876543211, ""], ["C3", "Rina Devi", "", "", ""]] },
    { name: "Passport", rows: [["sl", "Name", "Mobile", "User Id", "Pass"], [1, "Amit Kumar", "9123456780", "amit_web", "Secret@1"]] },
  ]);
  assert.deepEqual(result.sheets.map((sheet) => [sheet.sheet, sheet.service, sheet.records, sheet.skipped]), [["rates", null, 0, 0], ["PAN DETAIL", "pan", 1, 2], ["Passport", "passport", 1, 0]]);
  const [pan, passport] = result.records;
  assert.equal(pan.name, "Ashok Kumar");
  assert.equal(pan.pan, "ABCDE1234F");
  assert.equal(pan.mobile, "+919876543210");
  assert.deepEqual(result.sheets[2].droppedColumns, ["User Id", "Pass"]);
  assert.ok(!JSON.stringify(passport.fields).includes("Secret@1"), "portal passwords are never kept");
  assert.ok(!JSON.stringify(passport.fields).includes("amit_web"));
});

test("insurance renewals, unlabelled name columns and in-file duplicates", () => {
  const result = parseWorkbook("Insurance", [
    { name: "Digit", rows: [["comp", "type", "date", "mob", "name", "regn no"], ["Digit", "TP", "2025-10-20", 9876500001, "Sunil Das", "JH05AB1234"], ["Digit", "TP", "2025-10-20", 9876500001, "Sunil Das", "JH05AB1234"]] },
    { name: "income", rows: [["Sl.", "rcpt", "DOS", "Mobile No", "", "Status"], [1, "ic001", "2024-01-05", "9876500002", "Vimala Devi", "Delivered"], [2, "ic002", "2024-01-06", "9876500003", "Ram Prasad", "Delivered"], [3, "ic003", "2024-01-07", "9876500004", "Sita Kumari", "Delivered"]] },
  ]);
  assert.equal(result.records.filter((record) => record.service === "insurance").length, 1, "the repeated row is counted once");
  assert.equal(result.records[0].renewalOn, "2026-10-20", "renewal is a year after the policy date");
  const income = result.records.filter((record) => record.service === "income-certificate");
  assert.deepEqual(income.map((record) => record.name), ["Vimala Devi", "Ram Prasad", "Sita Kumari"]);
});

test("records are sealed with AES-GCM and indexed without the raw values", () => {
  process.env.RECORDS_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  const sealed = seal({ mobile: "+919876543210" });
  assert.ok(!sealed.includes("9876543210"));
  assert.deepEqual(open(sealed), { mobile: "+919876543210" });
  assert.equal(blindIndex("mobile", "+919876543210"), blindIndex("mobile", "+919876543210"));
  assert.notEqual(blindIndex("mobile", "+919876543210"), blindIndex("pan", "+919876543210"));
  const tampered = sealed.slice(0, -2) + (sealed.endsWith("A") ? "BB" : "AA");
  assert.throws(() => open(tampered));
});

test("help chat finds the right document checklist and never sends people to other websites", () => {
  assert.equal(findGuide("voter id address change documents")?.id, "voter");
  assert.equal(findVariant(findGuide("voter id address change")!, "voter id address change").id, "address");
  assert.equal(findGuide("what documents for bank account opening")?.id, "bank");
  assert.equal(findGuide("मुझे आयुष्मान कार्ड बनवाना है")?.id, "ayushman");
  assert.equal(findGuide("bike insurance claim")?.id, "insurance");
  assert.equal(findVariant(findGuide("bike insurance claim")!, "bike insurance claim").id, "claim");
  assert.equal(findGuide("where is your location"), null, "location questions go to the visit topic");
  const text = JSON.stringify(HELP_GUIDES);
  assert.doesNotMatch(text, /https?:|www\.|\.gov|\.in\b|portal/i);
});

test("migration 0008 adds leads, the activity log and encrypted customer records", () => {
  const sql = readFileSync(new URL("../drizzle/0008_records_inbox_leads.sql", import.meta.url), "utf8");
  for (const table of ["leads", "activity_log", "record_imports", "customer_records"]) assert.match(sql, new RegExp(`CREATE TABLE "${table}"`));
  assert.match(sql, /CREATE UNIQUE INDEX "customer_records_row_hash_unique"/);
  assert.doesNotMatch(sql, /"pan" text|"aadhaar" text|"mobile" text/, "no plain ID columns");
  const journal = JSON.parse(readFileSync(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8")) as { entries: { tag: string }[] };
  assert.ok(journal.entries.some((entry) => entry.tag === "0008_records_inbox_leads"));
});

test("contact details: WhatsApp, other mobiles, email and address are picked up", () => {
  const result = parseWorkbook("Customers", [{ name: "PAN DETAIL", rows: [
    ["Name", "Mob", "L.Mob", "WhatsApp", "Email", "Locality", "PAN"],
    ["Rina Devi", "9876500021", "9876500022", "9876500023", "Rina@Example.com", "Kharangajhar", "ABCDE1234F"],
    ["Mohan Lal", "9876500031", "", "9876500031", "", "", ""],
  ] }]);
  const [rina, mohan] = result.records;
  assert.equal(rina.mobile, "+919876500021");
  assert.deepEqual(rina.altMobiles, ["+919876500022"]);
  assert.equal(rina.whatsapp, "+919876500023");
  assert.equal(rina.email, "rina@example.com");
  assert.equal(rina.address, "Kharangajhar");
  assert.equal(mohan.whatsapp, null, "a WhatsApp number equal to the mobile isn't repeated");
});

test("rows with empty cells (holes, as Excel readers return them) don't crash the parser", () => {
  const header: unknown[] = []; header[1] = "Name"; header[3] = "Mobile"; // cells 0 and 2 are holes
  const row: unknown[] = []; row[1] = "Ravi Kumar"; row[3] = "9876543210";
  const result = parseWorkbook("Ayushman Card", [{ name: "Sheet1", rows: [header, row] }]);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].name, "Ravi Kumar");
});

test("TP premium picks the vehicle with the closest standard premium", async () => {
  const { nearestTpVehicle } = await import("../src/lib/record-import.ts");
  for (const [amount, vehicle] of [[538, "bike"], [714, "bike"], [1000, "bike"], [1366, "bike"], [1400, "bike"], [1700, "bike"], [2094, "car"], [2500, "bike"], [2804, "bike"], [3100, "bike"], [3200, "car"], [3416, "car"], [7897, "car"]] as const) assert.equal(nearestTpVehicle(amount), vehicle, String(amount));
});

test("vehicle from model name and cc, never from the insurer", async () => {
  const { vehicleFrom, vehicleFromCc } = await import("../src/lib/record-import.ts");
  assert.equal(vehicleFrom({ Model: "Hero Splendor Plus" }), "bike");
  assert.equal(vehicleFrom({ Model: "Maruti Swift Dzire" }), "car");
  assert.equal(vehicleFrom({ Vehicle: "Royal Enfield Classic 350" }), "bike");
  assert.equal(vehicleFrom({ Make: "Tata Nexon" }), "car");
  assert.equal(vehicleFrom({ Company: "Tata AIG", Insurer: "Bajaj Allianz" }), null);
  assert.equal(vehicleFromCc({ CC: "1197" }), "car");
  assert.equal(vehicleFromCc({ Engine: "110" }), "bike");
  assert.equal(vehicleFromCc({ Model: "Pulsar 150cc" }), "bike");
  assert.equal(vehicleFromCc({ CC: "550" }), null);
  assert.equal(vehicleFrom({ CC: "796", "TP": "538" }), "car");
});

test("TP below 1,000 is a bike and 1,000 to 1,400 is left open", async () => {
  const { vehicleFromTp } = await import("../src/lib/record-import.ts");
  for (const amount of ["538", "714", "999"]) assert.equal(vehicleFromTp({ TP: amount }), "bike", amount);
  for (const amount of ["1000", "1200", "1366", "1400"]) assert.equal(vehicleFromTp({ TP: amount }), null, amount);
  assert.equal(vehicleFromTp({ TP: "2094" }), "car"); assert.equal(vehicleFromTp({ TP: "2804" }), "bike");
});
