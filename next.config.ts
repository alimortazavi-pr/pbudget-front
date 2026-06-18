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
    "pbudget.ir",
    "www.pbudget.ir",
    "budget.paradisecode.org",
  ],
};

export default withSerwist(nextConfig);
