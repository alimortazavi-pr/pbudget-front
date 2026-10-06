"use client";

import { useEffect, useRef } from "react";

import * as profileApi from "@/common/api/profile";
import { applyCustomTheme, DEFAULT_THEME, isDefaultTheme, readStoredTheme } from "@/common/theme/custom-theme";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

/**
 * Keeps the colour theme in step with the account. On sign-in the account's theme
 * wins (so a new device looks like the old one); an account without one adopts the
 * theme already chosen on this device, once.
 */
export function ThemeSync() {
  const user = useAppSelector(userSelector);
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user?._id || syncedFor.current === user._id) return;
    const switchedAccount = syncedFor.current !== null;
    syncedFor.current = user._id;
    if (user.theme) {
      applyCustomTheme(user.theme);
      return;
    }
    if (switchedAccount) {
      // Another account on the same device must not inherit this account's look.
      applyCustomTheme(DEFAULT_THEME);
      return;
    }
    const local = readStoredTheme();
    if (!isDefaultTheme(local)) void profileApi.updateUserTheme(local).catch(() => undefined);
  }, [user]);

  return null;
}
