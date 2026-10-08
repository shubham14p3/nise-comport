"use client";

import { trackApi } from "@/lib/api-loading";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const ROUTE = "/api/x7q9m2";
const ALG = "ECDH-P256-HKDF-SHA256-A256GCM";

type ResponseEnvelope = { v: 1; a: typeof ALG; i: string; t: number; n: string; c: string };

export class SecureApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    const message = body && typeof body === "object" && "error" in body && typeof body.error === "string"
      ? body.error
      : body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : "Request failed.";
    super(message);
    this.name = "SecureApiError";
    this.status = status;
    this.body = body;
  }
}

function bytesToB64url(value: ArrayBuffer | Uint8Array) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunk, bytes.length)));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function randomB64url(size: number) {
  return bytesToB64url(crypto.getRandomValues(new Uint8Array(size)));
}

function requestAad(ts: number, nonce: string) {
  return encoder.encode(`NC1|Q|POST|${ROUTE}|${ts}|${nonce}`);
}

function responseAad(ts: number, nonce: string) {
  return encoder.encode(`NC1|S|${ROUTE}|${ts}|${nonce}`);
}

async function deriveAesKey(sharedSecret: ArrayBuffer, salt: Uint8Array, info: string) {
  const hkdfKey = await crypto.subtle.importKey("raw", sharedSecret, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: toArrayBuffer(salt), info: toArrayBuffer(encoder.encode(info)) },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function getServerPublicJwk() {
  const raw = process.env.NEXT_PUBLIC_API_ENVELOPE_PUBLIC_JWK;
  if (!raw) throw new Error("Secure connection is not configured.");
  try { return JSON.parse(raw) as JsonWebKey; } catch { throw new Error("Secure connection is not configured."); }
}

async function prepare() {
  if (!globalThis.crypto?.subtle) throw new Error("This browser does not support the secure connection.");
  const serverPublic = await crypto.subtle.importKey("jwk", getServerPublicJwk(), { name: "ECDH", namedCurve: "P-256" }, false, []);
  const clientKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]) as CryptoKeyPair;
  const clientPub = await crypto.subtle.exportKey("jwk", clientKeys.publicKey);
  const sharedSecret = await crypto.subtle.deriveBits({ name: "ECDH", public: serverPublic }, clientKeys.privateKey, 256);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const nonce = randomB64url(18);
  const ts = Date.now();
  const requestKey = await deriveAesKey(sharedSecret, salt, `NC1|${ROUTE}|request`);
  const responseKey = await deriveAesKey(sharedSecret, salt, `NC1|${ROUTE}|response`);
  return { clientPub, sharedSecret, salt, iv, nonce, ts, requestKey, responseKey };
}

async function decryptJsonResponse<T>(response: Response, responseKey: CryptoKey, nonce: string): Promise<{ status: number; data: T }> {
  if (response.headers.get("x-nx-sealed") !== "1" || response.status !== 200) throw new Error("Secure response validation failed.");
  const envelope = await response.json() as ResponseEnvelope;
  if (envelope.v !== 1 || envelope.a !== ALG || envelope.n !== nonce) throw new Error("Secure response validation failed.");
  const clear = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(b64urlToBytes(envelope.i)), additionalData: toArrayBuffer(responseAad(envelope.t, nonce)), tagLength: 128 },
    responseKey,
    toArrayBuffer(b64urlToBytes(envelope.c)),
  );
  const wrapped = JSON.parse(decoder.decode(clear)) as { z?: number; d?: T };
  if (!Number.isInteger(wrapped.z) || Number(wrapped.z) < 100 || Number(wrapped.z) > 599 || !("d" in wrapped)) throw new Error("Secure response validation failed.");
  return { status: Number(wrapped.z), data: wrapped.d as T };
}

/**
 * Reads that every page asks for and that rarely change (who is signed in, the account snapshot,
 * saved addresses). They are answered from memory for a short while and shared while running, so
 * opening page after page does not ask the server again. They are forgotten the moment anything
 * that could change them is done (signing in or out, saving the profile, placing a request…)
 * and a hard refresh always starts clean.
 */
const SHARED_READS = new Set(["C4w7G2hN6kP9", "P8a2N5dK1vR7", "P3v8F1qL6sM4"]);
const FORGET_AFTER = new Set([
  "Q7m4kP2vL9sD", "H9d2M7qK4zF8", "Rec0rdLog1nQ", "L8t1B5rX9mQ4", "R6y0D3sJ8vM2", "H5w2Zc8nR3vK", "F2n8Vb6tW0xE",
  "T2f9K4pW7cL1", "B7n3Q8xH5rV0", "M1z6P9dS4kJ7", "F8c2L5vN0qR3", "Y4h7T1mK6pD9", "J9r5W2bC8nX1",
  "D6k0N9yR2tH5", "X1m7C4pV8qB3", "S5w2J9nF3kL7", "A4x8L1rN5vK3", "Z6m2C9pT4hQ7", "M9q2X5wJ8tB3", "G8q4T1vM6rC0",
]);
const SHARED_FOR_MS = 20_000;
const shared = new Map<string, { at: number; value: Promise<unknown> }>();

/** Every encrypted call shows a loading line while it runs. Pass a label to say what is loading. */
export function secureApi<T>(operation: string, input: unknown = {}, label = "Loading…"): Promise<T> {
  if (SHARED_READS.has(operation)) {
    const hit = shared.get(operation);
    if (hit && Date.now() - hit.at < SHARED_FOR_MS) return hit.value as Promise<T>;
    const value: Promise<T> = trackApi(label, secureApiRaw<T>(operation, input)).catch((reason) => {
      if (shared.get(operation)?.value === value) shared.delete(operation); // a failed read is never kept
      throw reason;
    });
    shared.set(operation, { at: Date.now(), value });
    return value;
  }
  const work = trackApi(label, secureApiRaw<T>(operation, input));
  if (!FORGET_AFTER.has(operation)) return work;
  return work.finally(() => shared.clear());
}

async function secureApiRaw<T>(operation: string, input: unknown = {}): Promise<T> {
  const ctx = await prepare();
  const clear = encoder.encode(JSON.stringify({ o: operation, i: input }));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(ctx.iv), additionalData: toArrayBuffer(requestAad(ctx.ts, ctx.nonce)), tagLength: 128 },
    ctx.requestKey,
    toArrayBuffer(clear),
  );
  const response = await fetch(ROUTE, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "content-type": "application/nise-envelope+json", "x-nx": "1" },
    body: JSON.stringify({
      v: 1, a: ALG, p: ctx.clientPub, s: bytesToB64url(ctx.salt), i: bytesToB64url(ctx.iv),
      t: ctx.ts, n: ctx.nonce, c: bytesToB64url(ciphertext),
    }),
  });
  const opened = await decryptJsonResponse<T>(response, ctx.responseKey, ctx.nonce);
  if (opened.status >= 400) throw new SecureApiError(opened.status, opened.data);
  return opened.data;
}

export async function secureResult<T>(operation: string, input: unknown = {}) {
  try {
    return { ok: true as const, status: 200, result: await secureApi<T>(operation, input) };
  } catch (error) {
    if (error instanceof SecureApiError) return { ok: false as const, status: error.status, result: error.body as T };
    return { ok: false as const, status: 0, result: { error: "You appear to be offline. Check your connection and try again." } as T };
  }
}

export function secureUpload<T>(operation: string, file: File, input: Record<string, unknown> = {}): Promise<T> {
  return trackApi("Uploading…", secureUploadRaw<T>(operation, file, input));
}

async function secureUploadRaw<T>(operation: string, file: File, input: Record<string, unknown> = {}): Promise<T> {
  const ctx = await prepare();
  const metadata = encoder.encode(JSON.stringify({ o: operation, i: { ...input, n: file.name, t: file.type } }));
  const fileBytes = new Uint8Array(await file.arrayBuffer());
  const clear = new Uint8Array(4 + metadata.byteLength + fileBytes.byteLength);
  new DataView(clear.buffer).setUint32(0, metadata.byteLength);
  clear.set(metadata, 4);
  clear.set(fileBytes, 4 + metadata.byteLength);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(ctx.iv), additionalData: toArrayBuffer(requestAad(ctx.ts, ctx.nonce)), tagLength: 128 },
    ctx.requestKey,
    clear,
  );
  const response = await fetch(ROUTE, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "content-type": "application/octet-stream",
      "x-nx": "1", "x-nx-b": "1", "x-nx-v": "1", "x-nx-a": ALG,
      "x-nx-p": bytesToB64url(encoder.encode(JSON.stringify(ctx.clientPub))),
      "x-nx-s": bytesToB64url(ctx.salt), "x-nx-i": bytesToB64url(ctx.iv),
      "x-nx-t": String(ctx.ts), "x-nx-n": ctx.nonce,
    },
    body: ciphertext,
  });
  const opened = await decryptJsonResponse<T>(response, ctx.responseKey, ctx.nonce);
  if (opened.status >= 400) throw new SecureApiError(opened.status, opened.data);
  return opened.data;
}

export function secureFile(operation: string, input: unknown = {}) {
  return trackApi("Loading file…", secureFileRaw(operation, input));
}

async function secureFileRaw(operation: string, input: unknown = {}) {
  const ctx = await prepare();
  const clear = encoder.encode(JSON.stringify({ o: operation, i: input }));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(ctx.iv), additionalData: toArrayBuffer(requestAad(ctx.ts, ctx.nonce)), tagLength: 128 },
    ctx.requestKey,
    toArrayBuffer(clear),
  );
  const response = await fetch(ROUTE, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "content-type": "application/nise-envelope+json", "x-nx": "1" },
    body: JSON.stringify({
      v: 1, a: ALG, p: ctx.clientPub, s: bytesToB64url(ctx.salt), i: bytesToB64url(ctx.iv),
      t: ctx.ts, n: ctx.nonce, c: bytesToB64url(ciphertext),
    }),
  });
  if (response.headers.get("x-nx-sealed") !== "1" || response.headers.get("x-nx-b") !== "1") {
    const opened = await decryptJsonResponse<unknown>(response, ctx.responseKey, ctx.nonce);
    if (opened.status >= 400) throw new SecureApiError(opened.status, opened.data);
    throw new Error("Secure file response is invalid.");
  }
  const ts = Number(response.headers.get("x-nx-t"));
  const returnedNonce = response.headers.get("x-nx-n");
  const iv = response.headers.get("x-nx-i");
  if (!iv || returnedNonce !== ctx.nonce || response.status !== 200 || !Number.isFinite(ts)) throw new Error("Secure response validation failed.");
  const encrypted = new Uint8Array(await response.arrayBuffer());
  const decrypted = new Uint8Array(await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(b64urlToBytes(iv)), additionalData: toArrayBuffer(responseAad(ts, ctx.nonce)), tagLength: 128 },
    ctx.responseKey,
    toArrayBuffer(encrypted),
  ));
  if (decrypted.byteLength < 4) throw new Error("Secure file response is invalid.");
  const view = new DataView(decrypted.buffer, decrypted.byteOffset, decrypted.byteLength);
  const metadataLength = view.getUint32(0);
  if (metadataLength < 2 || 4 + metadataLength > decrypted.byteLength) throw new Error("Secure file response is invalid.");
  const metadata = JSON.parse(decoder.decode(decrypted.subarray(4, 4 + metadataLength))) as { z?: number; t?: string; d?: string };
  const status = Number(metadata.z);
  if (!Number.isInteger(status) || status < 100 || status > 599) throw new Error("Secure file response is invalid.");
  if (status >= 400) throw new SecureApiError(status, { error: "Could not open this file." });
  const bytes = decrypted.slice(4 + metadataLength);
  return { blob: new Blob([toArrayBuffer(bytes)], { type: metadata.t || "application/octet-stream" }), disposition: metadata.d };
}
