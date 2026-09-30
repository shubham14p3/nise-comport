import { NextResponse, type NextRequest } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const OPAQUE_API = "/api/x7q9m2";
const PRIVATE_API_PREFIXES = [
  "/api/auth/", "/api/account/", "/api/profile", "/api/addresses", "/api/requests",
  "/api/pan/requests", "/api/print-jobs", "/api/uploads", "/api/coupons/validate",
  "/api/admin/", "/api/internal/",
];

function canonicalHost() {
  try { return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.nisecomport.com").host; } catch { return "www.nisecomport.com"; }
}

function isLocal(host: string) {
  return /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/.test(host) || /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(host) || host.endsWith(".local");
}

function privateApi(pathname: string) {
  return PRIVATE_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const canonical = canonicalHost();
  const { pathname } = request.nextUrl;

  const sameSiteAlias = host.replace(/^www\./, "") === canonical.replace(/^www\./, "");
  if (process.env.NODE_ENV === "production" && process.env.CANONICAL_HOST_REDIRECT !== "false" && host && host !== canonical && sameSiteAlias && !isLocal(host) && !pathname.startsWith("/api/")) {
    const target = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${canonical}`);
    return NextResponse.redirect(target, 308);
  }

  // Private business APIs are server-internal only. Browsers use the encrypted opaque endpoint.
  if (pathname.startsWith("/api/") && pathname !== OPAQUE_API && privateApi(pathname)) {
    const expected = process.env.INTERNAL_API_TOKEN;
    const supplied = request.headers.get("x-nise-internal");
    if (!expected || expected.length < 32 || supplied !== expected) {
      return new NextResponse(null, {
        status: 404,
        headers: { "cache-control": "no-store, max-age=0", "x-content-type-options": "nosniff" },
      });
    }
  }

  if (pathname.startsWith("/api/") && !SAFE_METHODS.has(request.method) && !pathname.startsWith("/api/cron/")) {
    const origin = request.headers.get("origin");
    const fetchSite = request.headers.get("sec-fetch-site");
    let crossSite = fetchSite === "cross-site";
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        crossSite = originHost !== host && originHost !== canonical;
      } catch { crossSite = true; }
    }
    if (crossSite) {
      if (pathname === OPAQUE_API) return new NextResponse(null, { status: 404, headers: { "cache-control": "no-store" } });
      return NextResponse.json({ error: "This request came from another website and was blocked.", code: "cross_site" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|og/|icons/|images/).*)"],
};
