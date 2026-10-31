"use client";

import { messageForStatus, networkMessage } from "@/lib/net-messages";
import { coalesceInFlight, requestFlightKey } from "@/lib/inflight-requests";
import { trackApiActivity } from "@/lib/api-activity";

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

// First Turbopack compilation on Windows can take longer than a warm production request.
const JSON_TIMEOUT_MS = process.env.NODE_ENV === "development" ? 120_000 : 30_000;
const FILE_TIMEOUT_MS = 120_000;
// All UI code paths use this shared client. Identical concurrent clicks send one POST.
const pendingRequests = new Map<string, Promise<unknown>>();
const pendingUploads = new WeakMap<File, Map<string, Promise<unknown>>>();

/** Fetch errors can be caused by the hosting proxy, not just the visitor's internet connection. */
async function send(init: RequestInit, timeoutMs: number): Promise<Response> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) throw new SecureApiError(0, { error: networkMessage("offline"), code: "offline" });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(ROUTE, { ...init, signal: controller.signal });
  } catch (error) {
    const timedOut = controller.signal.aborted || (error instanceof Error && error.name === "AbortError");
    const offline = !timedOut && typeof navigator !== "undefined" && navigator.onLine === false;
    const kind = timedOut ? "timeout" : offline ? "offline" : "unavailable";
    throw new SecureApiError(timedOut ? 408 : 0, { error: networkMessage(kind), code: kind });
  } finally { clearTimeout(timer); }
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
  if (response.headers.get("x-nx-sealed") !== "1" || response.status !== 200) {
    // Not one of our sealed replies: the host, a proxy or the stale-clock check answered instead.
    const info = messageForStatus(response.status);
    throw new SecureApiError(response.status, { error: info.message, code: info.code });
  }
  const envelope = await response.json().catch(() => null) as ResponseEnvelope | null;
  if (!envelope || envelope.v !== 1 || envelope.a !== ALG || envelope.n !== nonce) throw new SecureApiError(502, { error: networkMessage("unavailable"), code: "unavailable" });
  const clear = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(b64urlToBytes(envelope.i)), additionalData: toArrayBuffer(responseAad(envelope.t, nonce)), tagLength: 128 },
    responseKey,
    toArrayBuffer(b64urlToBytes(envelope.c)),
  );
  const wrapped = JSON.parse(decoder.decode(clear)) as { z?: number; d?: T };
  if (!Number.isInteger(wrapped.z) || Number(wrapped.z) < 100 || Number(wrapped.z) > 599 || !("d" in wrapped)) throw new Error("Secure response validation failed.");
  return { status: Number(wrapped.z), data: wrapped.d as T };
}

async function secureApiOnce<T>(operation: string, input: unknown = {}): Promise<T> {
  const ctx = await prepare();
  const clear = encoder.encode(JSON.stringify({ o: operation, i: input }));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(ctx.iv), additionalData: toArrayBuffer(requestAad(ctx.ts, ctx.nonce)), tagLength: 128 },
    ctx.requestKey,
    toArrayBuffer(clear),
  );
  const response = await send({
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "content-type": "application/nise-envelope+json", "x-nx": "1" },
    body: JSON.stringify({
      v: 1, a: ALG, p: ctx.clientPub, s: bytesToB64url(ctx.salt), i: bytesToB64url(ctx.iv),
      t: ctx.ts, n: ctx.nonce, c: bytesToB64url(ciphertext),
    }),
  }, JSON_TIMEOUT_MS);
  const opened = await decryptJsonResponse<T>(response, ctx.responseKey, ctx.nonce);
  if (opened.status >= 400) throw new SecureApiError(opened.status, opened.data);
  return opened.data;
}

/**
 * Every JSON UI API call uses a single in-flight request for the same operation
 * and payload. This does not cache completed responses: retries are allowed.
 * Distinct actions/filters/records do not block one another.
 */
export function secureApi<T>(operation: string, input: unknown = {}): Promise<T> {
  return coalesceInFlight(pendingRequests, requestFlightKey(operation, input), () => trackApiActivity(secureApiOnce<T>(operation, input)));
}

/** Public static files only (for example blank PDF forms under /forms). Application data never goes through here. */
export function fetchStaticFile(path: string, init: RequestInit = {}): Promise<Response> {
  if (!path.startsWith("/forms/")) throw new Error("fetchStaticFile is only for files under /forms/.");
  return fetch(path, init);
}

export async function secureResult<T>(operation: string, input: unknown = {}) {
  try {
    return { ok: true as const, status: 200, result: await secureApi<T>(operation, input) };
  } catch (error) {
    if (error instanceof SecureApiError) return { ok: false as const, status: error.status, result: error.body as T };
    // Encryption, decoding and unexpected client errors are not proof of being offline.
    // A failed sealed-response decrypt can indicate that the browser has an old build.
    return { ok: false as const, status: 0, result: { error: networkMessage("secure"), code: "secure_failed" } as T };
  }
}

/**
 * File uploads are keyed by the actual File object (not just its name).
 * Repeated clicks on Import/Upload will not upload the same selected file twice.
 */
export function secureUpload<T>(operation: string, file: File, input: Record<string, unknown> = {}): Promise<T> {
  let pending = pendingUploads.get(file);
  if (!pending) {
    pending = new Map<string, Promise<unknown>>();
    pendingUploads.set(file, pending);
  }
  return coalesceInFlight(pending, requestFlightKey(operation, input), () => trackApiActivity(secureUploadOnce<T>(operation, file, input)));
}

async function secureUploadOnce<T>(operation: string, file: File, input: Record<string, unknown> = {}): Promise<T> {
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
  const response = await send({
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
  }, FILE_TIMEOUT_MS);
  const opened = await decryptJsonResponse<T>(response, ctx.responseKey, ctx.nonce);
  if (opened.status >= 400) throw new SecureApiError(opened.status, opened.data);
  return opened.data;
}

/** Avoid duplicate encrypted file fetches from repeated download clicks. */
export function secureFile(operation: string, input: unknown = {}) {
  return coalesceInFlight(pendingRequests, `file:${requestFlightKey(operation, input)}`, () => trackApiActivity(secureFileOnce(operation, input)));
}

async function secureFileOnce(operation: string, input: unknown = {}) {
  const ctx = await prepare();
  const clear = encoder.encode(JSON.stringify({ o: operation, i: input }));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(ctx.iv), additionalData: toArrayBuffer(requestAad(ctx.ts, ctx.nonce)), tagLength: 128 },
    ctx.requestKey,
    toArrayBuffer(clear),
  );
  const response = await send({
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "content-type": "application/nise-envelope+json", "x-nx": "1" },
    body: JSON.stringify({
      v: 1, a: ALG, p: ctx.clientPub, s: bytesToB64url(ctx.salt), i: bytesToB64url(ctx.iv),
      t: ctx.ts, n: ctx.nonce, c: bytesToB64url(ciphertext),
    }),
  }, FILE_TIMEOUT_MS);
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
  if (status >= 400) throw new SecureApiError(status, { error: status === 404 ? "This file is no longer available." : networkMessage("generic") });
  const bytes = decrypted.slice(4 + metadataLength);
  return { blob: new Blob([toArrayBuffer(bytes)], { type: metadata.t || "application/octet-stream" }), disposition: metadata.d };
}
