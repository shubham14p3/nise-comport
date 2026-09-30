import { NextRequest } from "next/server";
import {
  emptySecureFailure, openSecureBinaryRequest, openSecureRequest,
  secureBinary, secureJson, type SecureApiContext,
} from "@/lib/secure-api-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ROUTE = "/api/x7q9m2";

type Payload = { o?: string; i?: Record<string, unknown> };

const OPS = {
  "Q7m4kP2vL9sD": { method: "POST", path: "/api/auth/password" },
  "N5c8R1xT6bW3": { method: "POST", path: "/api/auth/request-otp" },
  "H9d2M7qK4zF8": { method: "POST", path: "/api/auth/verify-otp" },
  "V3p6J0nS8yC1": { method: "POST", path: "/api/auth/password-reset/request" },
  "L8t1B5rX9mQ4": { method: "POST", path: "/api/auth/password-reset/confirm" },
  "C4w7G2hN6kP9": { method: "GET", path: "/api/auth/session" },
  "R6y0D3sJ8vM2": { method: "DELETE", path: "/api/auth/session" },
  "T2f9K4pW7cL1": { method: "PATCH", path: "/api/profile" },
  "B7n3Q8xH5rV0": { method: "POST", path: "/api/account/password" },
  "M1z6P9dS4kJ7": { method: "POST", path: "/api/account/email" },
  "F8c2L5vN0qR3": { method: "POST", path: "/api/account/email/confirm" },
  "Y4h7T1mK6pD9": { method: "DELETE", path: "/api/account/sessions" },
  "J9r5W2bC8nX1": { method: "POST", path: "/api/account/delete" },
  "P3v8F1qL6sM4": { method: "GET", path: "/api/addresses" },
  "D6k0N9yR2tH5": { method: "POST", path: "/api/addresses" },
  "K2p9D5xN1hW7": { method: "POST", path: "/api/coupons/validate" },
  "S5w2J9nF3kL7": { method: "POST", path: "/api/requests" },
  "A4x8L1rN5vK3": { method: "POST", path: "/api/print-jobs" },
  "Z6m2C9pT4hQ7": { method: "POST", path: "/api/pan/requests" },
  "L5v1N7qD9kR3": { method: "POST", path: "/api/admin/pan-imports" },
  "T7s3F8mP2cX6": { method: "POST", path: "/api/admin/wallet-credit" },
  "P8a2N5dK1vR7": { method: "GET", path: "/api/internal/profile-snapshot" },
} as const;

function stringValue(input: Record<string, unknown>, key: string, max = 200) {
  const value = input[key];
  return typeof value === "string" ? value.slice(0, max) : "";
}

function targetFor(operation: string, input: Record<string, unknown>) {
  if (operation in OPS) return OPS[operation as keyof typeof OPS];
  switch (operation) {
    case "X1m7C4pV8qB3": {
      const id = stringValue(input, "id", 80);
      return { method: "DELETE", path: `/api/addresses?id=${encodeURIComponent(id)}` };
    }
    case "G8q4T1vM6rC0": {
      const reference = stringValue(input, "reference", 80);
      return { method: "POST", path: `/api/requests/${encodeURIComponent(reference)}/cancel`, body: { reason: input.reason } };
    }
    case "R1k5V8nD3sJ9": {
      const id = stringValue(input, "id", 80);
      const { id: _id, ...body } = input;
      return { method: "PATCH", path: `/api/admin/jobs/${encodeURIComponent(id)}`, body };
    }
    case "C9p2W6mH4xB8": {
      const q = stringValue(input, "q", 100);
      return { method: "GET", path: `/api/admin/pan-imports?q=${encodeURIComponent(q)}` };
    }
    case "F4m9C1xT6qH3": {
      const reference = stringValue(input, "reference", 80);
      return { method: "GET", path: `/api/internal/request-detail?reference=${encodeURIComponent(reference)}` };
    }
    case "J2w7L5pD9nV4": {
      const q = stringValue(input, "q", 80);
      const status = stringValue(input, "status", 40);
      return { method: "GET", path: `/api/internal/admin-snapshot?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}` };
    }
    case "B6r1K8mQ3cT9": {
      const id = stringValue(input, "id", 80);
      return { method: "GET", path: `/api/internal/admin-request-detail?id=${encodeURIComponent(id)}` };
    }
    default:
      return null;
  }
}

function fileTarget(operation: string, input: Record<string, unknown>) {
  const id = stringValue(input, "id", 80);
  if (!id) return null;
  if (operation === "E1n6V2kP9cF5") return `/api/uploads?id=${encodeURIComponent(id)}`;
  if (operation === "H3q7M0xP6cL2") return `/api/admin/jobs/${encodeURIComponent(id)}/file`;
  if (operation === "V8d4K1rF7nT5") return `/api/admin/requests/${encodeURIComponent(id)}/file`;
  return null;
}

function passThroughHeaders(response: Response) {
  const headers = new Headers();
  const extended = response.headers as Headers & { getSetCookie?: () => string[] };
  const cookies = extended.getSetCookie?.() ?? [];
  if (cookies.length) {
    for (const cookie of cookies) headers.append("set-cookie", cookie);
  } else {
    const cookie = response.headers.get("set-cookie");
    if (cookie) headers.append("set-cookie", cookie);
  }
  return headers;
}

async function internalFetch(request: NextRequest, target: { method: string; path: string; body?: unknown }, bodyOverride?: BodyInit) {
  const secret = process.env.INTERNAL_API_TOKEN;
  if (!secret || secret.length < 32) throw new Error("Internal API transport is not configured.");

  const url = new URL(target.path, request.nextUrl.origin);
  const headers = new Headers();
  headers.set("x-nise-internal", secret);
  headers.set("origin", request.nextUrl.origin);

  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  if (forwarded) headers.set("x-forwarded-for", forwarded);
  else if (realIp) headers.set("x-real-ip", realIp);
  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers.set("user-agent", userAgent);

  let body = bodyOverride;
  if (body === undefined && target.method !== "GET" && target.method !== "HEAD") {
    headers.set("content-type", "application/json");
    body = JSON.stringify(target.body ?? {});
  }

  return fetch(url, {
    method: target.method,
    headers,
    body,
    cache: "no-store",
    redirect: "manual",
  });
}

async function jsonFromInternal(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return { error: response.ok ? "Unexpected server response." : "Request failed." };
  }
  return response.json().catch(() => ({ error: "Request failed." }));
}

async function handleJson(request: NextRequest, context: SecureApiContext<Payload>) {
  const operation = typeof context.payload?.o === "string" ? context.payload.o : "";
  const input = context.payload?.i && typeof context.payload.i === "object" ? context.payload.i : {};

  const binaryPath = fileTarget(operation, input);
  if (binaryPath) {
    const response = await internalFetch(request, { method: "GET", path: binaryPath });
    if (!response.ok) return secureJson(context, await jsonFromInternal(response), { status: response.status, headers: passThroughHeaders(response) });
    const bytes = new Uint8Array(await response.arrayBuffer());
    return secureBinary(context, bytes, {
      t: response.headers.get("content-type") || "application/octet-stream",
      d: response.headers.get("content-disposition") || "inline",
    }, { status: response.status, headers: passThroughHeaders(response) });
  }

  const target = targetFor(operation, input);
  if (!target) return secureJson(context, { error: "Unsupported request." }, { status: 400 });

  const body = "body" in target ? target.body : input;
  const response = await internalFetch(request, { method: target.method, path: target.path, body });
  return secureJson(context, await jsonFromInternal(response), { status: response.status, headers: passThroughHeaders(response) });
}

async function handleBinary(request: NextRequest) {
  const context = await openSecureBinaryRequest<Payload>(request, ROUTE);
  if (!context) return emptySecureFailure();
  try {
    const operation = typeof context.payload?.o === "string" ? context.payload.o : "";
    if (operation !== "U7b3R8mQ4zL1") return secureJson(context, { error: "Unsupported request." }, { status: 400 });

    const input = context.payload?.i && typeof context.payload.i === "object" ? context.payload.i : {};
    const name = stringValue(input, "n", 255);
    const type = stringValue(input, "t", 160) || "application/octet-stream";
    if (!name || !context.bytes.byteLength) return secureJson(context, { error: "Choose a file to upload." }, { status: 400 });

    const form = new FormData();
    const fileBytes = context.bytes.slice();
    form.set("file", new Blob([fileBytes.buffer as ArrayBuffer], { type }), name);
    const response = await internalFetch(request, { method: "POST", path: "/api/uploads" }, form);
    return secureJson(context, await jsonFromInternal(response), { status: response.status, headers: passThroughHeaders(response) });
  } catch (error) {
    console.error("[opaque-api] encrypted upload failed", error instanceof Error ? error.message : "Unknown error");
    return secureJson(context, { error: "Request failed." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if ((request.headers.get("content-type") || "").toLowerCase().includes("application/octet-stream")) {
    return handleBinary(request);
  }
  const context = await openSecureRequest<Payload>(request, ROUTE);
  if (!context) return emptySecureFailure();
  try {
    return await handleJson(request, context);
  } catch (error) {
    console.error("[opaque-api] encrypted request failed", error instanceof Error ? error.message : "Unknown error");
    return secureJson(context, { error: "Request failed." }, { status: 503 });
  }
}

export async function GET() {
  return emptySecureFailure();
}
