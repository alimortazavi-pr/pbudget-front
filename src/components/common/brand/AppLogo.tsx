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
  /** auto = light theme → on-light mark, dark theme → rich mark */
  variant?: "auto" | "light" | "dark";
};

export function AppLogo({
  size = 40,
  showText = true,
  className = "",
  variant = "auto",
}: AppLogoProps) {
  const showLight = variant === "light" || variant === "auto";
  const showDark = variant === "dark" || variant === "auto";

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <span
        className="relative shrink-0"
        style={{ width: size, height: size }}
      >
        {showLight ? (
          <Image
            src={LOGO_MARK_LIGHT_SRC}
            alt=""
            width={size}
            height={size}
            className={
              variant === "auto"
                ? "absolute inset-0 size-full rounded-xl dark:hidden"
                : "size-full rounded-xl"
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
                ? "absolute inset-0 hidden size-full rounded-xl dark:block"
                : "size-full rounded-xl"
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
