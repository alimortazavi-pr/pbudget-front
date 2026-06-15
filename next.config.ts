import { spawnSync } from "node:child_process";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

/**
 * بیلد نیتیو (Capacitor):
 * با `CAPACITOR_BUILD=1` فعال می‌شود و خروجی استاتیک (out/) برای بسته‌شدن داخل اپ اندروید می‌سازد.
 * در این حالت سرویس‌ورکر serwist غیرفعال است (Capacitor خودش asset ها را لوکال سرو می‌کند و SW
 * با اسکیم capacitor/localhost تداخل می‌کند).
 */
const isCapacitorBuild = process.env.CAPACITOR_BUILD === "1";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  disable: process.env.NODE_ENV === "development",
});

const baseConfig: NextConfig = {
  // دسترسی dev از دامنه‌های واقعی (مثلاً تست روی pdesk.ir / pbudget.ir قبل از دیپلوی)
  allowedDevOrigins: [
    "pdesk.ir",
    "www.pdesk.ir",
    "pbudget.ir",
    "www.pbudget.ir",
    "budget.paradisecode.org",
  ],
};

const capacitorConfig: NextConfig = {
  ...baseConfig,
  output: "export",
  // در اکسپورت استاتیک، بهینه‌سازی تصویر سمت سرور وجود ندارد.
  images: { unoptimized: true },
  // خروجی پوشه‌ای (route/index.html) که WebView لوکال کاپاسیتور بهتر resolve می‌کند.
  trailingSlash: true,
};

const nextConfig: NextConfig = isCapacitorBuild ? capacitorConfig : baseConfig;

export default isCapacitorBuild ? nextConfig : withSerwist(nextConfig);
