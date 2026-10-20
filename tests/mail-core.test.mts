import test from "node:test";
import assert from "node:assert/strict";
import { allowedAttachmentType, findReferences, looksAutomated, makeTicketKey, parseTicketTag, safeFileName, stripQuotedReply, subjectWithTag, ticketTag } from "../src/lib/mail-core.ts";

test("ticket tags round trip and are found in replies", () => {
  const tag = ticketTag(1042, "K7Q2");
  assert.equal(tag, "[NC-T1042-K7Q2]");
  assert.deepEqual(parseTicketTag(`Re: Print help ${tag}`), { number: 1042, key: "K7Q2" });
  assert.deepEqual(parseTicketTag("re: nc-t7-ab12"), { number: 7, key: "AB12" });
  assert.equal(parseTicketTag("no tag here"), null);
});
test("subject keeps one Re: and one tag", () => {
  assert.equal(subjectWithTag("Re: RE: Hello [NC-T5-AAAA]", 5, "AAAA"), "Re: Hello [NC-T5-AAAA]");
  assert.equal(subjectWithTag("", 9, "ZZZZ"), "Re: Your message [NC-T9-ZZZZ]");
});
test("keys use only clear characters", () => {
  const key = makeTicketKey((max) => Math.floor(Math.random() * max));
  assert.match(key, /^[A-HJ-NP-Z2-9]{4}$/);
});
test("references are found, tickets are not mistaken for jobs", () => {
  assert.deepEqual(findReferences("please check nc-abc123 and PR-77KX9 also NC-T1042-K7Q2"), ["NC-ABC123", "PR-77KX9"]);
  assert.deepEqual(findReferences("nothing"), []);
});
test("quoted replies are cut off", () => {
  assert.equal(stripQuotedReply("Thanks, got it.\n\nOn Mon, 5 Oct 2026 at 10:00, NISE COMPORT <info@x.com> wrote:\n> old text"), "Thanks, got it.");
  assert.equal(stripQuotedReply("Here is my PAN photo.\n\n-#-#- Please reply above this line -#-#-\nWe have received your message"), "Here is my PAN photo.");
  assert.equal(stripQuotedReply("Yes\n> quoted\n> more"), "Yes");
  assert.equal(stripQuotedReply("Line one\nLine two"), "Line one\nLine two");
});
test("only safe attachment types pass, judged by file name", () => {
  assert.equal(allowedAttachmentType("photo.JPG", "image/jpeg"), "image/jpeg");
  assert.equal(allowedAttachmentType("form.pdf", "application/octet-stream"), "application/pdf");
  assert.equal(allowedAttachmentType("run.exe", "application/pdf"), null);
  assert.equal(allowedAttachmentType("page.html", "text/html"), null);
  assert.equal(allowedAttachmentType("a.pdf", "image/png"), null);
  assert.equal(allowedAttachmentType("noext", ""), null);
});
test("file names are made safe", () => {
  assert.equal(safeFileName("../../etc/passwd"), ".._.._etc_passwd");
  assert.equal(safeFileName("  "), "file");
});
test("machine mail is recognised", () => {
  const h = (o: Record<string, string>) => ({ get: (n: string) => o[n.toLowerCase()] });
  assert.equal(looksAutomated(h({}), "Raj <raj@gmail.com>"), false);
  assert.equal(looksAutomated(h({}), "MAILER-DAEMON@x.com"), true);
  assert.equal(looksAutomated(h({ "auto-submitted": "auto-replied" }), "a@b.com"), true);
  assert.equal(looksAutomated(h({ precedence: "bulk" }), "a@b.com"), true);
});

import { buildZip, crc32, htmlToText, snippet, uniqueNames } from "../src/lib/mail-core.ts";
test("crc32 matches the standard check value", () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
});
test("zip archive is well formed", () => {
  const zip = buildZip([{ name: "a.txt", data: new TextEncoder().encode("hello") }, { name: "b/c.txt", data: new TextEncoder().encode("world!") }]);
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  assert.equal(view.getUint32(0, true), 0x04034b50);
  const endAt = zip.length - 22;
  assert.equal(view.getUint32(endAt, true), 0x06054b50);
  assert.equal(view.getUint16(endAt + 10, true), 2);
  const centralAt = view.getUint32(endAt + 16, true);
  assert.equal(view.getUint32(centralAt, true), 0x02014b50);
  assert.equal(new TextDecoder().decode(zip.subarray(30 + 5, 30 + 5 + 0)), "");
});
test("zip is readable by a real unzip when available", async () => {
  const { execFileSync } = await import("node:child_process");
  const { writeFileSync, mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "zt-"));
  writeFileSync(join(dir, "t.zip"), buildZip([{ name: "Ticket/a.txt", data: new TextEncoder().encode("hello") }]));
  try { assert.match(execFileSync("unzip", ["-p", join(dir, "t.zip"), "Ticket/a.txt"]).toString(), /hello/); } catch (e) { if ((e as { code?: string }).code !== "ENOENT") throw e; }
});
test("duplicate names get numbers", () => { assert.deepEqual(uniqueNames(["a.pdf", "A.pdf", "b", "a.pdf"]), ["a.pdf", "A (2).pdf", "b", "a (3).pdf"]); });
test("html mail becomes text", () => { assert.equal(htmlToText("<p>Hi&nbsp;there &amp; <b>team</b></p><script>x()</script><p>Bye</p>"), "Hi there & team\nBye"); });
test("snippet shortens", () => { assert.equal(snippet("a  b\n c"), "a b c"); assert.ok(snippet("x".repeat(300)).length <= 110); });

import { validSignature } from "../src/lib/mail-core.ts";
test("file signatures", () => {
  assert.equal(validSignature("application/pdf", new TextEncoder().encode("%PDF-1.7 ...")), true);
  assert.equal(validSignature("application/pdf", new TextEncoder().encode("MZ\u0090\u0000")), false);
  assert.equal(validSignature("image/png", Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d])), true);
  assert.equal(validSignature("image/jpeg", Uint8Array.from([1, 2, 3])), false);
  assert.equal(validSignature("text/plain", Uint8Array.from([104, 105, 0])), false);
});
