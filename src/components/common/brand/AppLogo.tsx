"use client";

import Image from "next/image";

import {
  APP_NAME_EN,
  APP_NAME_FA,
  LOGO_MARK_DARK_SRC,
  LOGO_MARK_LIGHT_SRC,
} from "@/common/constants/brand";

type AppLogoProps = {
  size?: number;
  showText?: boolean;
  className?: string;
  variant?: "auto" | "light" | "dark";
  withBackground?: boolean;
};

export function AppLogo({
  size = 40,
  showText = true,
  className = "",
  variant = "auto",
  withBackground = true,
}: AppLogoProps) {
  const showLight = variant === "light" || variant === "auto";
  const showDark = variant === "dark" || variant === "auto";
  const pad = withBackground ? Math.max(4, Math.round(size * 0.12)) : 0;
  const outer = size + pad * 2;

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <span
        className={
          withBackground
            ? "relative shrink-0 rounded-2xl bg-gradient-to-br from-rose-50 via-violet-50 to-teal-50 p-1.5 shadow-sm ring-1 ring-rose-500/15 dark:from-rose-950/50 dark:via-violet-950/40 dark:to-teal-950/50 dark:ring-violet-400/20"
            : "relative shrink-0"
        }
        style={{ width: outer, height: outer }}
      >
        {showLight ? (
          <Image
            src={LOGO_MARK_LIGHT_SRC}
            alt=""
            width={size}
            height={size}
            className={
              variant === "auto"
                ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl dark:hidden"
                : "rounded-xl"
            }
            priority
          />
        ) : null}
        {showDark ? (
          <Image
            src={LOGO_MARK_DARK_SRC}
            alt=""
            width={size}
            height={size}
            className={
              variant === "auto"
                ? "absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 rounded-xl dark:block"
                : "rounded-xl"
            }
            priority
          />
        ) : null}
      </span>
      {showText ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{APP_NAME_FA}</p>
          <p className="truncate text-xs text-muted">{APP_NAME_EN}</p>
        </div>
      ) : null}
    </div>
  );
}
