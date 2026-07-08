"use client";

import Image from "next/image";

import { APP_NAME_EN, APP_NAME_FA, LOGO_MARK_SRC } from "@/common/constants/brand";

type AppLogoProps = {
  size?: number;
  showText?: boolean;
  className?: string;
  withBackground?: boolean;
};

export function AppLogo({
  size = 40,
  showText = true,
  className = "",
  withBackground = false,
}: AppLogoProps) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <span
        className={
          withBackground
            ? "relative shrink-0 rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10"
            : "relative shrink-0"
        }
        style={{ width: size, height: size }}
      >
        <Image
          src={LOGO_MARK_SRC}
          alt=""
          width={size}
          height={size}
          className="rounded-2xl"
          priority
        />
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
