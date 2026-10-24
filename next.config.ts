import type { NextConfig } from "next";
import { legacyRedirects } from "./src/lib/legacy-redirects.ts";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // geolocation=(self): only our own pages may ask for location ("Use my current location" for addresses).
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/** Private areas: never indexed even if someone links to them. */
const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  // Read at run time from node_modules (support-mailbox reader); never bundled.
  serverExternalPackages: ["imapflow", "mailparser"],
  // Keep file tracing inside this application on shared /var/www hosting.
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  // Keep builds inside the hosting plan: 1 CPU, worker threads instead of extra processes
  // (the cPanel "Website Resources" panel shows ~1.3 GiB peak memory and 230 processes on the account).
  experimental: {
    cpus: 1,
    workerThreads: true,
  },
  images: { formats: ["image/avif", "image/webp"], minimumCacheTTL: 60 * 60 * 24 * 30 },
  // The share-image route reads this font from disk (Poppins covers English and Hindi).
  outputFileTracingIncludes: { "/api/og": ["./src/assets/fonts/**", "./public/images/logo/**"] },
  async redirects() {
    return legacyRedirects();
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/api/:path*", headers: noindex },
      { source: "/desk/:path*", headers: noindex },
      { source: "/desk", headers: noindex },
      { source: "/profile/:path*", headers: noindex },
      { source: "/profile", headers: noindex },
      { source: "/mail-x7q2", headers: noindex },
      { source: "/login", headers: noindex },
      { source: "/signup", headers: noindex },
      { source: "/forgot-password", headers: noindex },
      { source: "/pan/request", headers: noindex },
      { source: "/request", headers: noindex },
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }] },
      { source: "/og/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }] },
    ];
  },
};

export default nextConfig;
