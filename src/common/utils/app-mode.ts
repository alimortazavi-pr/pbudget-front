import jsCookies from "js-cookie";

import { APP_MODE_COOKIE, type AppMode } from "@/common/constants/app-mode";

export function getStoredAppMode(): AppMode {
  const saved = jsCookies.get(APP_MODE_COOKIE);
  if (saved === "simple" || saved === "advanced") return saved;
  return "advanced";
}

export function setStoredAppMode(mode: AppMode) {
  jsCookies.set(APP_MODE_COOKIE, mode, { expires: 365, path: "/" });
}
