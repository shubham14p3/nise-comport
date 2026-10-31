import assert from "node:assert/strict";
import { test } from "node:test";
import { mailboxSyncKey, chooseImapConnection } from "../src/lib/mail-config.ts";

test("complete server IMAP credentials take priority over the UI vault", () => {
  const chosen = chooseImapConnection({
    MAIL_IMAP_HOST: "imap.myhost.test", MAIL_IMAP_USER: "help@aitapri.com", MAIL_IMAP_PASSWORD: "secret", MAIL_IMAP_PORT: "993",
  }, { imapHost: "other.host", imapUser: "another@example.com", imapPassword: "different" });
  assert.equal(chosen?.source, "environment");
  assert.equal(chosen?.user, "help@aitapri.com");
  assert.equal(chosen?.host, "imap.myhost.test");
});

test("uses saved IMAP only when no environment IMAP override exists", () => {
  const chosen = chooseImapConnection({}, {
    imapHost: "imap.vault.test", imapUser: "support@example.com", imapPassword: "secret", imapPort: "993",
  });
  assert.equal(chosen?.source, "vault");
  assert.equal(chosen?.secure, true);
});

test("SMTP-only settings do not falsely report IMAP connection", () => {
  assert.equal(chooseImapConnection({ SMTP_HOST: "smtp.test", SMTP_USER: "help@aitapri.com", SMTP_PASSWORD: "secret" }), null);
  assert.equal(chooseImapConnection({}, { host: "smtp.test", user: "help@aitapri.com", password: "secret" }), null);
});

test("partial accounts or invalid ports never become connected", () => {
  assert.equal(chooseImapConnection({ MAIL_IMAP_USER: "x@test", MAIL_IMAP_PASSWORD: "secret" }), null);
  assert.equal(chooseImapConnection({ MAIL_IMAP_HOST: "host", MAIL_IMAP_USER: "u", MAIL_IMAP_PASSWORD: "pass", MAIL_IMAP_PORT: "999999" }), null);
});


test("partial IMAP override cannot silently reconnect the previous saved mailbox", () => {
 assert.equal(chooseImapConnection({MAIL_IMAP_USER: 'info@nisecomport.com'}, {imapHost:'imap.test',imapUser:'help@aitapri.com',imapPassword:'secret'}), null);
});


test("mailbox-specific cursors cannot carry AI Tapri's last UID into NiSE's inbox", () => {
 const config={host:'imap.host.test',port:993,user:'info@nisecomport.com',folder:'INBOX'};
 assert.notEqual(mailboxSyncKey(config),mailboxSyncKey({...config,user:'help@aitapri.com'}));
 assert.notEqual(mailboxSyncKey(config),mailboxSyncKey({...config,folder:'Archive'}));
 assert.equal(mailboxSyncKey(config),mailboxSyncKey({...config,user:'INFO@NISECOMPORT.COM'}));
});
