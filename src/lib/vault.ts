import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

/**
 * Encryption for imported customer records. Uses RECORDS_ENCRYPTION_KEY (base64 of 32 random
 * bytes), falling back to PAN_ENCRYPTION_KEY so one key is enough. Keep the key out of the
 * database and back it up: without it the records can't be read.
 */
function key() {
  const encoded = process.env.RECORDS_ENCRYPTION_KEY?.trim() || process.env.PAN_ENCRYPTION_KEY?.trim();
  if (!encoded) throw new Error("Set RECORDS_ENCRYPTION_KEY (or PAN_ENCRYPTION_KEY) before importing customer records.");
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.byteLength !== 32) throw new Error("RECORDS_ENCRYPTION_KEY must be the base64 encoding of exactly 32 random bytes.");
  return bytes;
}

export function vaultReady() {
  try { key(); return true; } catch { return false; }
}

export function seal(value: unknown) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), nonce);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return ["v1", nonce, cipher.getAuthTag(), body].map((part) => typeof part === "string" ? part : part.toString("base64url")).join(".");
}

export function open<T = unknown>(sealed: string): T {
  const [version, nonce, tag, body] = sealed.split(".");
  if (version !== "v1" || !nonce || !tag || !body) throw new Error("Unreadable record.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(nonce, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8")) as T;
}

/** Keyed hash for finding and counting without decrypting (mobile, PAN, Aadhaar, duplicate rows). */
export function blindIndex(kind: string, value: string) {
  const indexKey = createHmac("sha256", key()).update("NISE-COMPORT-RECORD-INDEX-v1").digest();
  return createHmac("sha256", indexKey).update(`${kind}:${value}`).digest("base64url").slice(0, 43);
}
