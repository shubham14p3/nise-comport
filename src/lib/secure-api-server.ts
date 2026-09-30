import { createHash, webcrypto } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimits } from "@/db/schema";

const subtle = webcrypto.subtle;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const ALG = "ECDH-P256-HKDF-SHA256-A256GCM";
const MAX_CLOCK_SKEW_MS = 90_000;
const MAX_JSON_ENVELOPE_BYTES = 1024 * 1024;
const MAX_BINARY_ENVELOPE_BYTES = 21 * 1024 * 1024 + 64 * 1024;

type RequestEnvelope = {
  v: 1;
  a: typeof ALG;
  p: JsonWebKey;
  s: string;
  i: string;
  t: number;
  n: string;
  c: string;
};

type ResponseEnvelope = {
  v: 1;
  a: typeof ALG;
  i: string;
  t: number;
  n: string;
  c: string;
};

export type SecureApiContext<T = unknown> = {
  request: NextRequest;
  payload: T;
  sharedSecret: ArrayBuffer;
  salt: Uint8Array;
  nonce: string;
  route: string;
};

export type SecureBinaryContext<T = unknown> = SecureApiContext<T> & {
  bytes: Uint8Array;
};

let privateKeyPromise: Promise<CryptoKey> | null = null;

function b64urlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return new Uint8Array(Buffer.from(padded, "base64"));
}

function bytesToB64url(value: ArrayBuffer | Uint8Array) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  return Buffer.from(bytes).toString("base64url");
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function rememberNonce(nonce: string) {
  const key = "secure:" + createHash("sha256").update(nonce).digest("base64url");
  const inserted = await db.insert(rateLimits)
    .values({ key, windowStart: new Date(), count: 1 })
    .onConflictDoNothing()
    .returning({ key: rateLimits.key });
  return inserted.length === 1;
}

async function getServerPrivateKey() {
  if (!privateKeyPromise) {
    privateKeyPromise = (async () => {
      const raw = process.env.API_ENVELOPE_PRIVATE_JWK;
      if (!raw) throw new Error("API_ENVELOPE_PRIVATE_JWK is not configured");
      let jwk: JsonWebKey;
      try { jwk = JSON.parse(raw); } catch { throw new Error("API_ENVELOPE_PRIVATE_JWK is invalid JSON"); }
      return subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
    })();
  }
  return privateKeyPromise;
}

async function deriveAesKey(sharedSecret: ArrayBuffer, salt: Uint8Array, info: string) {
  const hkdfKey = await subtle.importKey("raw", sharedSecret, "HKDF", false, ["deriveKey"]);
  return subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: toArrayBuffer(salt), info: toArrayBuffer(encoder.encode(info)) },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function requestAad(route: string, ts: number, nonce: string) {
  return encoder.encode(`NC1|Q|POST|${route}|${ts}|${nonce}`);
}

function responseAad(route: string, ts: number, nonce: string) {
  return encoder.encode(`NC1|S|${route}|${ts}|${nonce}`);
}

async function deriveContext(request: NextRequest, route: string, envelope: {
  clientPub: JsonWebKey; salt: Uint8Array; iv: Uint8Array; ts: number; nonce: string; ciphertext: Uint8Array;
}) {
  const now = Date.now();
  if (Math.abs(now - envelope.ts) > MAX_CLOCK_SKEW_MS) return null;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(envelope.nonce)) return null;
  if (envelope.salt.length !== 16 || envelope.iv.length !== 12 || envelope.ciphertext.length < 16) return null;

  const clientPublic = await subtle.importKey(
    "jwk",
    envelope.clientPub,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const privateKey = await getServerPrivateKey();
  const sharedSecret = await subtle.deriveBits({ name: "ECDH", public: clientPublic }, privateKey, 256);
  const requestKey = await deriveAesKey(sharedSecret, envelope.salt, `NC1|${route}|request`);
  const clear = await subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(envelope.iv), additionalData: toArrayBuffer(requestAad(route, envelope.ts, envelope.nonce)), tagLength: 128 },
    requestKey,
    toArrayBuffer(envelope.ciphertext),
  );
  // Persist the nonce only after authentication succeeds. Concurrent replays race on
  // the primary key and only one request is allowed to continue.
  if (!await rememberNonce(envelope.nonce)) return null;
  return { clear: new Uint8Array(clear), sharedSecret, salt: envelope.salt };
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;
  try { return new URL(origin).host === host; } catch { return false; }
}

export function emptySecureFailure(status = 404) {
  return new NextResponse(null, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff",
      "cross-origin-resource-policy": "same-origin",
    },
  });
}

export async function openSecureRequest<T = unknown>(request: NextRequest, route: string): Promise<SecureApiContext<T> | null> {
  try {
    if (!sameOrigin(request)) return null;
    if (request.headers.get("x-nx") !== "1") return null;
    if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/nise-envelope+json")) return null;
    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_JSON_ENVELOPE_BYTES) return null;

    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_JSON_ENVELOPE_BYTES) return null;
    const envelope = JSON.parse(rawBody) as Partial<RequestEnvelope>;
    if (
      envelope.v !== 1 || envelope.a !== ALG || !envelope.p ||
      typeof envelope.s !== "string" || typeof envelope.i !== "string" ||
      typeof envelope.t !== "number" || typeof envelope.n !== "string" || typeof envelope.c !== "string"
    ) return null;

    const derived = await deriveContext(request, route, {
      clientPub: envelope.p,
      salt: b64urlToBytes(envelope.s),
      iv: b64urlToBytes(envelope.i),
      ts: envelope.t,
      nonce: envelope.n,
      ciphertext: b64urlToBytes(envelope.c),
    });
    if (!derived) return null;
    const payload = JSON.parse(decoder.decode(derived.clear)) as T;
    return { request, payload, sharedSecret: derived.sharedSecret, salt: derived.salt, nonce: envelope.n, route };
  } catch {
    return null;
  }
}

export async function openSecureBinaryRequest<T = unknown>(request: NextRequest, route: string): Promise<SecureBinaryContext<T> | null> {
  try {
    if (!sameOrigin(request)) return null;
    if (request.headers.get("x-nx") !== "1" || request.headers.get("x-nx-b") !== "1") return null;
    if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/octet-stream")) return null;
    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_BINARY_ENVELOPE_BYTES) return null;

    const v = Number(request.headers.get("x-nx-v"));
    const a = request.headers.get("x-nx-a");
    const p = request.headers.get("x-nx-p");
    const s = request.headers.get("x-nx-s");
    const i = request.headers.get("x-nx-i");
    const t = Number(request.headers.get("x-nx-t"));
    const n = request.headers.get("x-nx-n");
    if (v !== 1 || a !== ALG || !p || !s || !i || !Number.isFinite(t) || !n) return null;

    let clientPub: JsonWebKey;
    try { clientPub = JSON.parse(decoder.decode(b64urlToBytes(p))); } catch { return null; }
    const ciphertext = new Uint8Array(await request.arrayBuffer());
    if (ciphertext.byteLength > MAX_BINARY_ENVELOPE_BYTES) return null;

    const derived = await deriveContext(request, route, {
      clientPub,
      salt: b64urlToBytes(s),
      iv: b64urlToBytes(i),
      ts: t,
      nonce: n,
      ciphertext,
    });
    if (!derived || derived.clear.byteLength < 4) return null;

    const view = new DataView(derived.clear.buffer, derived.clear.byteOffset, derived.clear.byteLength);
    const metadataLength = view.getUint32(0);
    if (metadataLength < 2 || metadataLength > 16 * 1024 || 4 + metadataLength > derived.clear.byteLength) return null;
    const metadata = JSON.parse(decoder.decode(derived.clear.subarray(4, 4 + metadataLength))) as T;
    const bytes = derived.clear.subarray(4 + metadataLength);

    return { request, payload: metadata, bytes, sharedSecret: derived.sharedSecret, salt: derived.salt, nonce: n, route };
  } catch {
    return null;
  }
}

export async function secureJson(
  context: SecureApiContext,
  data: unknown,
  init: { status?: number; headers?: HeadersInit } = {},
) {
  const status = init.status ?? 200;
  const ts = Date.now();
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const responseKey = await deriveAesKey(context.sharedSecret, context.salt, `NC1|${context.route}|response`);
  const clear = encoder.encode(JSON.stringify({ z: status, d: data }));
  const ciphertext = await subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv), additionalData: toArrayBuffer(responseAad(context.route, ts, context.nonce)), tagLength: 128 },
    responseKey,
    toArrayBuffer(clear),
  );
  const envelope: ResponseEnvelope = {
    v: 1, a: ALG, i: bytesToB64url(iv), t: ts, n: context.nonce, c: bytesToB64url(ciphertext),
  };
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/nise-envelope+json; charset=utf-8");
  headers.set("cache-control", "no-store, max-age=0");
  headers.set("x-nx-sealed", "1");
  headers.set("x-content-type-options", "nosniff");
  headers.set("cross-origin-resource-policy", "same-origin");
  return NextResponse.json(envelope, { status: 200, headers });
}

export async function secureBinary(
  context: SecureApiContext,
  bytes: Uint8Array,
  metadata: Record<string, unknown>,
  init: { status?: number; headers?: HeadersInit } = {},
) {
  const status = init.status ?? 200;
  const ts = Date.now();
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const responseKey = await deriveAesKey(context.sharedSecret, context.salt, `NC1|${context.route}|response`);
  const meta = encoder.encode(JSON.stringify({ z: status, ...metadata }));
  const clear = new Uint8Array(4 + meta.byteLength + bytes.byteLength);
  new DataView(clear.buffer).setUint32(0, meta.byteLength);
  clear.set(meta, 4);
  clear.set(bytes, 4 + meta.byteLength);
  const ciphertext = await subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv), additionalData: toArrayBuffer(responseAad(context.route, ts, context.nonce)), tagLength: 128 },
    responseKey,
    clear,
  );
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/octet-stream");
  headers.set("cache-control", "no-store, max-age=0");
  headers.set("x-nx-sealed", "1");
  headers.set("x-nx-b", "1");
  headers.set("x-nx-i", bytesToB64url(iv));
  headers.set("x-nx-t", String(ts));
  headers.set("x-nx-n", context.nonce);
  headers.set("x-content-type-options", "nosniff");
  headers.set("cross-origin-resource-policy", "same-origin");
  return new NextResponse(ciphertext, { status: 200, headers });
}
