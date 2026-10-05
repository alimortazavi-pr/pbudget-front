import { PATHS } from "@/common/constants";
import { storage } from "./storage";

/**
 * The session behind `token` is no longer valid (expired, revoked, deleted).
 * Remove only that account; if other signed-in accounts remain, continue with
 * the next one instead of signing the user out of everything.
 */
export function dropAccountAndContinue(token: string | undefined) {
  const data = storage.getAuthData();
  const remaining = (data?.users ?? []).filter((user) => user.token !== token);
  const isCurrent = !data?.token || data.token === token;

  if (!isCurrent && data) {
    storage.setAuthData({ token: data.token, users: remaining });
    return;
  }
  if (remaining.length) {
    storage.setAuthData({ token: remaining[0].token, users: remaining });
    if (typeof window !== "undefined") window.location.assign(PATHS.HOME);
    return;
  }
  storage.clearAuthData();
  if (typeof window !== "undefined") window.location.href = PATHS.GET_STARTED;
}

/** Make `token` the active account and reload so no state of the previous one leaks. */
export function activateAccount(token: string, destination: string = PATHS.HOME) {
  const data = storage.getAuthData();
  storage.setAuthData({ token, users: data?.users ?? [] });
  if (typeof window !== "undefined") window.location.assign(destination);
}

export function forceAuthLogout() {
  dropAccountAndContinue(storage.getToken());
}
