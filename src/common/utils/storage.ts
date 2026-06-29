import jsCookies from "js-cookie";

import type { ISaveToLocal } from "@/common/interfaces";
import { getCookieOptions } from "@/common/utils/cookie-options";

const AUTH_COOKIE = "userAuthorization";
const THEME_COOKIE = "pbudget-theme";

const cookieOpts = () => ({ expires: 90, ...getCookieOptions() });
const themeOpts = () => ({ expires: 365, ...getCookieOptions() });

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
    jsCookies.set(AUTH_COOKIE, JSON.stringify(data), cookieOpts());
  },

  clearAuthData() {
    jsCookies.remove(AUTH_COOKIE, getCookieOptions());
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
    jsCookies.set(THEME_COOKIE, theme, themeOpts());
    jsCookies.set("dark-mode", theme === "dark" ? "true" : "false", themeOpts());
  },
};

export function saveDataToLocal(data: ISaveToLocal) {
  storage.setAuthData(data);
}
