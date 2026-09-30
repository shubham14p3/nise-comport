import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 "proxy" (formerly middleware). Runs before every matched request.
 * 1. Canonical host: sends www ↔ non-www to the one host in NEXT_PUBLIC_SITE_URL with a
 *    permanent redirect, so Google indexes one version of every page. (Preview domains are left alone.)
 * 2. Cross-site protection for the API: state-changing requests from another website are refused
 *    (defence in depth on top of SameSite=Lax cookies).
 */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function canonicalHost() {
  try { return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.nisecomport.com").host; } catch { return "www.nisecomport.com"; }
}

function isLocal(host: string) {
  return /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/.test(host) || /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(host) || host.endsWith(".local");
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
    if (crossSite) return NextResponse.json({ error: "This request came from another website and was blocked.", code: "cross_site" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|og/|icons/|images/).*)"],
};
