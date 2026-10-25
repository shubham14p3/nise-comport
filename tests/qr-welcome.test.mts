import assert from "node:assert/strict";
import { test } from "node:test";
import { qrWelcomeMessage, qrWelcomeMessages } from "../src/lib/site.ts";

test("QR welcome brochure shows all core services and confirmed shop details", () => {
  const message = qrWelcomeMessage();
  const replies = qrWelcomeMessages();
  assert.equal(replies.length, 2);
  assert.match(replies[0], /Our Services Related/);
  assert.match(replies[1], /Visit us/);
  for (const snippet of [
    "आपके इस प्रेम के लिए धन्यवाद", "Nise-Comport", "Bank of BARODA CSP",
    "PAN / Voter ID / Passport", "Aadhaar Correction", "Insurance", "Ayushman",
    "Food License", "Land Rent / Mutation", "0657-2917622", "+919771219893",
    "+919835552756", "V P Singh Building", "9:00 AM", "4:30 PM",
    "maps.app.goo.gl/8RKNgZBJutYiunRx9", "*Email:*", "*Website:*",
  ]) assert.ok(message.includes(snippet), snippet);
  assert.ok(message.length < 3500, "fits within the WhatsApp message limit including the bot menu");
});
