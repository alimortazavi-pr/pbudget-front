import { spawnSync } from "node:child_process";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  disable: process.env.NODE_ENV === "development",
});

const securityHeaders = [
  { key: "Content-Security-Policy", value: "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(self), microphone=(self), payment=()" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
] as const;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // دسترسی dev از دامنه‌های واقعی (مثلاً تست روی pdesk.ir / pbudget.ir قبل از دیپلوی)
  allowedDevOrigins: [
    "pdesk.ir",
    "www.pdesk.ir",
  ],
  async headers() {
    return [{ source: "/:path*", headers: [...securityHeaders] }];
  },
  async rewrites() {
    const apiRoot = (
      process.env.INTERNAL_API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "https://api.pdesk.ir/v1"
    ).replace(/\/v1\/?$/, "");
    return [
      {
        source: "/downloads/:path*",
        destination: `${apiRoot}/downloads/:path*`,
      },
    ];
  },
};

export default withSerwist(nextConfig);
