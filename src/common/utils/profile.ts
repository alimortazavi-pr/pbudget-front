import type { IProfile } from "@/common/interfaces/profile.interface";
import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
  type WalletBalances,
} from "@/common/constants/user-preferences";
import { normalizeWalletBalances } from "@/common/utils/wallet-balances";

export function normalizeProfile(user: Record<string, unknown>): IProfile {
  const rawPrefs = (user.preferences ?? {}) as Partial<UserPreferences>;
  const preferences: UserPreferences = {
    currency:
      rawPrefs.currency === "usd" ||
      rawPrefs.currency === "dinar" ||
      rawPrefs.currency === "toman"
        ? rawPrefs.currency
        : DEFAULT_USER_PREFERENCES.currency,
    dateCalendar:
      rawPrefs.dateCalendar === "gregorian" ||
      rawPrefs.dateCalendar === "jalali"
        ? rawPrefs.dateCalendar
        : DEFAULT_USER_PREFERENCES.dateCalendar,
    configured: Boolean(rawPrefs.configured),
  };

  const legacyBudget = Number(user.budget ?? 0);
  const walletBalances = normalizeWalletBalances(
    user.walletBalances as Partial<WalletBalances> | undefined,
    legacyBudget,
  );

  return {
    _id: String(user._id ?? ""),
    firstName: String(user.firstName ?? ""),
    lastName: String(user.lastName ?? ""),
    mobile: String(user.mobile ?? ""),
    budget: walletBalances.toman,
    walletBalances,
    isVerifiedMobile: Boolean(user.isVerifiedMobile ?? user.mobileActive),
    hasPassword:
      user.hasPassword !== undefined ? Boolean(user.hasPassword) : undefined,
    isAdmin: Boolean(user.isAdmin),
    preferences,
    hasAnyBudget: Boolean(user.hasAnyBudget),
  };
}
