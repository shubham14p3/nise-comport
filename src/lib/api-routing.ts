/** Rules shared by the encrypted API gateway and the CSRF proxy guard.
 * Pure functions so deployment modes and security behavior can be regression-tested.
 */
export type ApiRoutingEnv = {
  APP_ENV?: string;
  NODE_ENV?: string;
  INTERNAL_API_PORT?: string;
};

export function internalApiOrigin(env: ApiRoutingEnv): string {
  const mode = (env.APP_ENV || (env.NODE_ENV === "production" ? "prod" : "local")).trim().toLowerCase();
  if (mode !== "prod" && mode !== "local") throw new Error("APP_ENV must be 'prod' or 'local'.");

  const rawPort = env.INTERNAL_API_PORT || (mode === "prod" ? "3020" : "3000");
  const port = Number(rawPort);
  if (!(/^[1-9]\d{0,4}$/).test(rawPort) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("INTERNAL_API_PORT must be a valid TCP port.");
  }

  return `http://127.0.0.1:${port}`;
}

/** The Origin must describe the loopback target, NOT the public browser origin. */
export function internalApiHeaders(secret: string, targetUrl: URL): Headers {
  const headers = new Headers();
  headers.set("x-nise-internal", secret);
  headers.set("origin", targetUrl.origin);
  return headers;
}

/** Exact public site hostnames, with optional www on each. No wildcard suffix matching. */
const PUBLIC_SITE_DOMAINS = [
  "nisecomport.aitapri.com", // Current deployed site.
  "nicecompote.aitapri.com", // Requested alternate subdomain.
  "nicecompote.com", // Planned custom domain.
  "nisecomport.com", // Existing branded domain in site documentation.
] as const;

function hostWithoutWww(host: string) {
  return host.trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
}

/** Used for canonical page redirects, not for granting cross-origin API access. */
export function isSiteAlias(host: string, canonicalHost: string, extraHosts = ""): boolean {
  const candidate = hostWithoutWww(host);
  if (!candidate || /[\\/@\s*]/.test(candidate)) return false;
  const allowed = [canonicalHost, ...PUBLIC_SITE_DOMAINS, ...extraHosts.split(",")];
  return allowed.some((entry) => candidate === hostWithoutWww(entry));
}

/** Same-origin API mutations only. A configured alias is never a CSRF bypass for another host. */
export function isCrossSiteApiRequest(
  host: string,
  _canonicalHost: string,
  origin: string | null,
  fetchSite: string | null,
): boolean {
  if (fetchSite === "cross-site") return true;
  if (origin) {
    try {
      const parsed = new URL(origin);
      return !["http:", "https:"].includes(parsed.protocol) || parsed.host.toLowerCase() !== host.toLowerCase();
    } catch {
      return true;
    }
  }
  return false;
}
