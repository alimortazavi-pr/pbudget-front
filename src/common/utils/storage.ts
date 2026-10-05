import jsCookies from "js-cookie";

import type { ISaveToLocal, ISaveToLocalUser } from "@/common/interfaces";
import { getCookieOptions } from "@/common/utils/cookie-options";

const AUTH_COOKIE = "pdesk-personal-auth";

/** Strip a profile down to what the account list stores. */
export function toStoredAccount(
  user: { _id: string; firstName?: string; lastName?: string; mobile?: string; token: string },
): ISaveToLocalUser {
  return {
    _id: user._id,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    mobile: user.mobile ?? "",
    token: user.token,
  } as ISaveToLocalUser;
}
const LEGACY_SHARED_AUTH_COOKIE = "userAuthorization";
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
    jsCookies.remove(LEGACY_SHARED_AUTH_COOKIE, { path: "/", domain: ".pdesk.ir" });
    const seen = new Set<string>();
    const users = data.users
      .filter((user) => user?.token && !seen.has(user._id) && seen.add(user._id))
      .map(toStoredAccount);
    jsCookies.set(AUTH_COOKIE, JSON.stringify({ token: data.token, users }), cookieOpts());
  },

  clearAuthData() {
    jsCookies.remove(AUTH_COOKIE, getCookieOptions());
    jsCookies.remove(LEGACY_SHARED_AUTH_COOKIE, { path: "/", domain: ".pdesk.ir" });
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
