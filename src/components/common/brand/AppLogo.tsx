import Image from "next/image";

import { APP_NAME_EN, APP_NAME_FA } from "@/common/constants/brand";

type AppLogoProps = {
  size?: number;
  showText?: boolean;
  className?: string;
};

export function AppLogo({ size = 40, showText = true, className = "" }: AppLogoProps) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <Image
        src="/assets/logo-mark.svg"
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-xl"
        priority
      />
      {showText ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{APP_NAME_FA}</p>
          <p className="truncate text-xs text-muted">{APP_NAME_EN}</p>
        </div>
      ) : null}
    </div>
  );
}
