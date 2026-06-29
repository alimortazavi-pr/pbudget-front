import jsCookies from "js-cookie";

import type { ISaveToLocal } from "@/common/interfaces";

const AUTH_COOKIE = "userAuthorization";
const THEME_COOKIE = "pbudget-theme";
const BUSINESS_COOKIE = "activeBusinessId";

export const storage = {
  getAuthData(): ISaveToLocal | null {
    const raw = jsCookies.get(AUTH_COOKIE);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ISaveToLocal;
    } catch {
      return null;
    }
  },

  setAuthData(data: ISaveToLocal) {
    jsCookies.set(AUTH_COOKIE, JSON.stringify(data), { expires: 90, path: "/" });
  },

  clearAuthData() {
    jsCookies.remove(AUTH_COOKIE, { path: "/" });
  },

  getToken(): string | undefined {
    return storage.getAuthData()?.token;
  },

  getTheme(): "light" | "dark" {
    const saved = jsCookies.get(THEME_COOKIE);
    if (saved === "dark" || saved === "light") return saved;
    const legacy = jsCookies.get("dark-mode");
    if (legacy === "true") return "dark";
    return "light";
  },

  setTheme(theme: "light" | "dark") {
    jsCookies.set(THEME_COOKIE, theme, { expires: 365, path: "/" });
    jsCookies.set("dark-mode", theme === "dark" ? "true" : "false", {
      expires: 365,
      path: "/",
    });
  },

  getActiveBusinessId(): string | undefined {
    return jsCookies.get(BUSINESS_COOKIE) || undefined;
  },

  setActiveBusinessId(businessId: string | null) {
    if (businessId) {
      jsCookies.set(BUSINESS_COOKIE, businessId, { expires: 90, path: "/" });
    } else {
      jsCookies.remove(BUSINESS_COOKIE, { path: "/" });
    }
  },
};

export function saveDataToLocal(data: ISaveToLocal) {
  storage.setAuthData(data);
}
