import type { IProfile } from "@/common/interfaces/profile.interface";
import type {
  UserCurrency,
  WalletBalances,
} from "@/common/constants/user-preferences";

export const EMPTY_WALLET_BALANCES: WalletBalances = {
  toman: 0,
  usd: 0,
  dinar: 0,
};

export function normalizeWalletBalances(
  raw?: Partial<WalletBalances> | null,
  legacyBudget?: number,
): WalletBalances {
  const budget = Number(legacyBudget ?? 0);
  const tomanRaw = raw?.toman;
  const usd = Number(raw?.usd ?? 0) || 0;
  const dinar = Number(raw?.dinar ?? 0) || 0;
  const toman = Number(tomanRaw ?? budget) || 0;

  if (
    (raw == null || (tomanRaw === 0 && usd === 0 && dinar === 0)) &&
    budget !== 0
  ) {
    return {
      toman: budget,
      usd: 0,
      dinar: 0,
    };
  }

  return {
    toman,
    usd,
    dinar,
  };
}

export function getWalletBalance(
  user: Pick<IProfile, "walletBalances" | "budget"> | null | undefined,
  currency: UserCurrency,
): number {
  if (!user) return 0;
  if (user.walletBalances) {
    return user.walletBalances[currency] ?? 0;
  }
  return currency === "toman" ? user.budget : 0;
}

export type WalletMutationResponse = {
  userBudget?: number;
  userWalletBalances?: WalletBalances;
  currency?: UserCurrency;
};

export function mergeProfileWallet(
  user: IProfile,
  response: WalletMutationResponse,
): IProfile {
  if (response.userWalletBalances) {
    const walletBalances = normalizeWalletBalances(response.userWalletBalances);
    return {
      ...user,
      walletBalances,
      budget: walletBalances.toman,
    };
  }

  if (response.userBudget !== undefined) {
    const currency = response.currency ?? user.preferences.currency;
    const walletBalances = normalizeWalletBalances(user.walletBalances, user.budget);
    walletBalances[currency] = response.userBudget;
    return {
      ...user,
      walletBalances,
      budget: walletBalances.toman,
    };
  }

  return user;
}
