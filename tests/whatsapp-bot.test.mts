import assert from "node:assert/strict";
import test from "node:test";
import { detectIntent, documentsReply, matchService, payReply, priceReply } from "../src/lib/whatsapp-bot-core.ts";

const services = [
  { slug: "pan-card", title: "PAN card", keywords: ["pan", "nsdl"], documents: ["Aadhaar", "Photo"] },
  { slug: "voter-id", title: "Voter ID", keywords: ["voter", "epic"], documents: ["Aadhaar"] },
  { slug: "bike-insurance", title: "Bike insurance", keywords: ["two wheeler", "bike"], documents: ["RC"] },
];
test("intents", () => {
  assert.equal(detectIntent("hi"), "menu");
  assert.equal(detectIntent("PAN card price?"), "price");
  assert.equal(detectIntent("documents for voter id"), "documents");
  assert.equal(detectIntent("status NC-1"), "track");
  assert.equal(detectIntent("how to pay"), "pay");
  assert.equal(detectIntent("6"), "human");
  assert.equal(detectIntent("2"), "track");
  assert.equal(detectIntent(""), "attachment");
  assert.equal(detectIntent("refund please"), "human");
  assert.equal(detectIntent("blah"), "unknown");
});
test("service matching", () => {
  assert.equal(matchService("pan card price", services)?.slug, "pan-card");
  assert.equal(matchService("bike insurance kitna", services)?.slug, "bike-insurance");
  assert.equal(matchService("xyz", services), null);
});
test("replies", () => {
  assert.match(priceReply(services[0], { amount: 90, kind: "from", note: null }, "https://x"), /from ₹90/);
  assert.match(priceReply(services[0], null, "https://x"), /quote this/);
  assert.match(documentsReply(services[1], "https://x"), /Aadhaar/);
  assert.match(payReply({ reference: "NC-1", amountPaise: 15000, status: "due" }, "https://x"), /₹150.*\/pay\/NC-1/s);
  assert.match(payReply(null, "https://x"), /don't see/);
});

test("a message from the welcome QR code gets the menu, not the payment reply", () => {
  assert.equal(detectIntent("*NISE COMPORT* · Kharangajhar, Telco, Jamshedpur\nHi NISE COMPORT, I scanned your QR code."), "menu");
});
