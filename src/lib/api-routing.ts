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
  if (!/^\d{1,5}$/.test(rawPort) || !Number.isInteger(port) || port < 1 || port > 65535) {
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

/** Reject cross-site mutations without relaxing checks for ordinary browsers. */
export function isCrossSiteApiRequest(
  host: string,
  canonicalHost: string,
  origin: string | null,
  fetchSite: string | null,
): boolean {
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      return originHost !== host && originHost !== canonicalHost;
    } catch {
      return true;
    }
  }
  return fetchSite === "cross-site";
}
