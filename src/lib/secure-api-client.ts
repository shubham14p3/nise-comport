"use client";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const ROUTE = "/api/x7q9m2";
const ALG = "ECDH-P256-HKDF-SHA256-A256GCM";

type ResponseEnvelope = { v: 1; a: typeof ALG; i: string; t: number; n: string; z: number; c: string };

export class SecureApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any) {
    super(body && typeof body === "object" && typeof body.error === "string" ? body.error : body && typeof body === "object" && typeof body.message === "string" ? body.message : "Request failed.");
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

function responseAad(ts: number, nonce: string, status: number) {
  return encoder.encode(`NC1|S|${ROUTE}|${ts}|${nonce}|${status}`);
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

async function decryptJsonResponse<T>(response: Response, responseKey: CryptoKey, nonce: string): Promise<T> {
  if (response.headers.get("x-nx-sealed") !== "1") throw new Error("Secure response validation failed.");
  const envelope = await response.json() as ResponseEnvelope;
  if (envelope.v !== 1 || envelope.a !== ALG || envelope.n !== nonce || envelope.z !== response.status) throw new Error("Secure response validation failed.");
  const clear = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(b64urlToBytes(envelope.i)), additionalData: toArrayBuffer(responseAad(envelope.t, nonce, envelope.z)), tagLength: 128 },
    responseKey,
    toArrayBuffer(b64urlToBytes(envelope.c)),
  );
  return JSON.parse(decoder.decode(clear)) as T;
}

export async function secureApi<T>(operation: string, input: unknown = {}): Promise<T> {
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
  const body = await decryptJsonResponse<T>(response, ctx.responseKey, ctx.nonce);
  if (!response.ok) throw new SecureApiError(response.status, body);
  return body;
}

export async function secureResult<T>(operation: string, input: unknown = {}) {
  try {
    return { ok: true as const, status: 200, result: await secureApi<T>(operation, input) };
  } catch (error) {
    if (error instanceof SecureApiError) return { ok: false as const, status: error.status, result: error.body as T };
    return { ok: false as const, status: 0, result: { error: "You appear to be offline. Check your connection and try again." } as T };
  }
}

export async function secureUpload<T>(operation: string, file: File, input: Record<string, unknown> = {}): Promise<T> {
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
  const body = await decryptJsonResponse<T>(response, ctx.responseKey, ctx.nonce);
  if (!response.ok) throw new SecureApiError(response.status, body);
  return body;
}

export async function secureFile(operation: string, input: unknown = {}) {
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
    const body = await decryptJsonResponse<any>(response, ctx.responseKey, ctx.nonce);
    throw new SecureApiError(response.status, body);
  }
  const ts = Number(response.headers.get("x-nx-t"));
  const returnedNonce = response.headers.get("x-nx-n");
  const status = Number(response.headers.get("x-nx-z"));
  const iv = response.headers.get("x-nx-i");
  if (!iv || returnedNonce !== ctx.nonce || status !== response.status || !Number.isFinite(ts)) throw new Error("Secure response validation failed.");
  const encrypted = new Uint8Array(await response.arrayBuffer());
  const decrypted = new Uint8Array(await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(b64urlToBytes(iv)), additionalData: toArrayBuffer(responseAad(ts, ctx.nonce, status)), tagLength: 128 },
    ctx.responseKey,
    toArrayBuffer(encrypted),
  ));
  if (decrypted.byteLength < 4) throw new Error("Secure file response is invalid.");
  const view = new DataView(decrypted.buffer, decrypted.byteOffset, decrypted.byteLength);
  const metadataLength = view.getUint32(0);
  if (metadataLength < 2 || 4 + metadataLength > decrypted.byteLength) throw new Error("Secure file response is invalid.");
  const metadata = JSON.parse(decoder.decode(decrypted.subarray(4, 4 + metadataLength))) as { t?: string; d?: string };
  const bytes = decrypted.slice(4 + metadataLength);
  if (!response.ok) throw new SecureApiError(response.status, { error: "Could not open this file." });
  return { blob: new Blob([bytes], { type: metadata.t || "application/octet-stream" }), disposition: metadata.d };
}
