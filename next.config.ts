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

const nextConfig: NextConfig = {
  // دسترسی dev از دامنه‌های واقعی (مثلاً تست روی pdesk.ir / pbudget.ir قبل از دیپلوی)
  allowedDevOrigins: [
    "pdesk.ir",
    "www.pdesk.ir",
    "business.pdesk.ir",
    "www.business.pdesk.ir",
  ],
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
