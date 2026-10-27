import { createCipheriv, createHmac, randomBytes } from "node:crypto";
import { panRecords } from "@/db/schema";
import { db } from "@/lib/db";

export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function encryptionKey() {
  const encoded = process.env.PAN_ENCRYPTION_KEY;
  if (!encoded) throw new Error("PAN import encryption is not configured.");
  const key = Buffer.from(encoded, "base64");
  if (key.byteLength !== 32) throw new Error("PAN_ENCRYPTION_KEY must be base64 encoding of exactly 32 random bytes.");
  return key;
}
export function panIndexKey(key: Buffer) { return createHmac("sha256", key).update("NISE-COMPORT-PAN-INDEX-v1").digest(); }
export function encryptPan(value: string, key: Buffer) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [nonce, cipher.getAuthTag(), ciphertext].map(part => part.toString("base64url")).join(".");
}
/** Adds one PAN to PAN data (encrypted, no duplicates). Returns false when the key is not configured or the PAN is already there. */
export async function addPanRecord(pan: string, holderName: string) {
  const normalised = pan.trim().toUpperCase();
  if (!PAN_PATTERN.test(normalised) || !process.env.PAN_ENCRYPTION_KEY) return false;
  const key = encryptionKey();
  const panHash = createHmac("sha256", panIndexKey(key)).update(normalised).digest("hex");
  const rows = await db.insert(panRecords).values({ panHash, encryptedPan: encryptPan(normalised, key), holderName: holderName.trim().slice(0, 150) || "Customer", recordStatus: "requested" })
    .onConflictDoNothing().returning({ id: panRecords.id });
  return rows.length > 0;
}
