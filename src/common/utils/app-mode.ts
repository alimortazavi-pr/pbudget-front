import jsCookies from "js-cookie";

import { APP_MODE_COOKIE, type AppMode } from "@/common/constants/app-mode";

export function getStoredAppMode(): AppMode {
  const saved = jsCookies.get(APP_MODE_COOKIE);
  // `simple` was the name used by the first released HMI layout. Keep old
  // cookies working, while moving the user to the richer command layout.
  if (saved === "simple") return "command";
  if (
    saved === "advanced" ||
    saved === "calendar" ||
    saved === "command" ||
    saved === "notebook"
  ) {
    return saved;
  }
  return "advanced";
}

export function setStoredAppMode(mode: AppMode) {
  jsCookies.set(APP_MODE_COOKIE, mode, { expires: 365, path: "/" });
}
