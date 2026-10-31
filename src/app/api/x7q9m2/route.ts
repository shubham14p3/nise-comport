import { NextRequest } from "next/server";
import { targetFor } from "@/lib/secure-api-targets";
import { clientIp } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth";
import { canSeeDeskMenu, sidebarPermissionForPath } from "@/lib/sidebar-permissions";
import { internalApiHeaders, internalApiOrigin } from "@/lib/api-routing";
import {
  emptySecureFailure, openSecureBinaryRequest, openSecureRequest,
  secureBinary, secureJson, type SecureApiContext,
} from "@/lib/secure-api-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ROUTE = "/api/x7q9m2";

type Payload = { o?: string; i?: Record<string, unknown> };

/** Encrypted file uploads: customer documents, and posters in the admin area. */
const BINARY_OPS = {
  "L7d2R8mQ4vN6": "/api/admin/loader",
  "U7b3R8mQ4zL1": "/api/uploads",
  "P6m1T8vC3xK9": "/api/admin/media",
  "G5p8U2kV7nR3": "/api/admin/gallery/upload",
  "A9d5W3tL7mX2": "/api/mail/attach",
} as const;

function stringValue(input: Record<string, unknown>, key: string, max = 200) {
  return typeof input[key] === "string" ? input[key].slice(0, max) : "";
}

function fileTarget(operation: string, input: Record<string, unknown>) {
  const id = stringValue(input, "id", 80);
  if (!id) return null;
  if (operation === "E1n6V2kP9cF5") return `/api/uploads?id=${encodeURIComponent(id)}`;
  if (operation === "H3q7M0xP6cL2") return `/api/admin/jobs/${encodeURIComponent(id)}/file`;
  if (operation === "V8d4K1rF7nT5") { const fileId=stringValue(input,"fileId",80); return `/api/admin/requests/${encodeURIComponent(id)}/file${fileId?`?fileId=${encodeURIComponent(fileId)}`:""}`; }
  // Message centre: an attachment, a ticket's files as one zip, and a file of the linked request or print order.
  if (operation === "N4c8V1bH6qY3") return `/api/mail/file?id=${encodeURIComponent(id)}`;
  if (operation === "T2m7S5xK9wD4") return `/api/mail/zip?id=${encodeURIComponent(id)}`;
  if (operation === "B7p3L9zF2nR6") return `/api/mail/linked?id=${encodeURIComponent(id)}&t=${encodeURIComponent(stringValue(input, "t", 60))}`;
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

  // Use loopback for both modes, preserving the API token and CSRF checks.
  // internalApiHeaders sets the server-only x-nise-internal token on this request.
  const url = new URL(target.path, internalApiOrigin(process.env));
  const headers = internalApiHeaders(secret, url);

  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  // The visitor's IP for rate limits; the internal routes trust it only with the token above.
  headers.set("x-nise-client-ip", clientIp(request));
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
  // Only the encrypted gateway is exposed to browsers. Restrict staff to their
  // explicitly selected menu modules before forwarding to privileged internal APIs.
  const requiredMenu = sidebarPermissionForPath(target.path.split("?")[0]);
  if (requiredMenu) {
    const actor = await getCurrentUser();
    if (actor?.role === "staff" && !canSeeDeskMenu(actor.role, actor.permissions, requiredMenu)) {
      return secureJson(context, { error: "This staff module was not granted to your account.", code: "forbidden" }, { status: 403 });
    }
  }

  const body = "body" in target ? target.body : input;
  const response = await internalFetch(request, { method: target.method, path: target.path, body });
  return secureJson(context, await jsonFromInternal(response), { status: response.status, headers: passThroughHeaders(response) });
}

async function handleBinary(request: NextRequest) {
  const context = await openSecureBinaryRequest<Payload>(request, ROUTE);
  if (!context) return emptySecureFailure();
  try {
    const operation = typeof context.payload?.o === "string" ? context.payload.o : "";
    const uploadPath = BINARY_OPS[operation as keyof typeof BINARY_OPS];
    if (!uploadPath) return secureJson(context, { error: "Unsupported request." }, { status: 400 });

    const input = context.payload?.i && typeof context.payload.i === "object" ? context.payload.i : {};
    const name = stringValue(input, "n", 255);
    const type = stringValue(input, "t", 160) || "application/octet-stream";
    if (!name || !context.bytes.byteLength) return secureJson(context, { error: "Choose a file to upload." }, { status: 400 });

    const form = new FormData();
    const fileBytes = context.bytes.slice();
    form.set("file", new Blob([fileBytes.buffer as ArrayBuffer], { type }), name);
    // Poster uploads also carry a title, language and category.
    for (const key of ["title", "locale", "category", "tag"]) { const value = stringValue(input, key, 120); if (value) form.set(key, value); }
    const response = await internalFetch(request, { method: "POST", path: uploadPath }, form);
    return secureJson(context, await jsonFromInternal(response), { status: response.status, headers: passThroughHeaders(response) });
  } catch (error) {
    console.error("[opaque-api] encrypted upload failed", error instanceof Error ? error.message : "Unknown error");
    return secureJson(context, { error: "We couldn’t complete that just now. Please try again in a moment.", code: "unavailable" }, { status: 503 });
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
    return secureJson(context, { error: "We couldn’t complete that just now. Please try again in a moment.", code: "unavailable" }, { status: 503 });
  }
}

export async function GET() {
  return emptySecureFailure();
}
