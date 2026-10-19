import type { CustomTheme } from "@/common/theme/custom-theme";
import type { UserPreferences, WalletBalances } from "@/common/constants/user-preferences";

export interface IProfileState {
  user: IProfile | null;
}

export interface IProfile {
  _id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  budget: number;
  walletBalances: WalletBalances;
  isVerifiedMobile: boolean;
  hasPassword?: boolean;
  isAdmin?: boolean;
  preferences: UserPreferences;
  hasAnyBudget: boolean;
  /** Monthly finance summary in Telegram. */
  monthlySummaryEnabled?: boolean;
  /** Custom colour theme saved on the account (null = default theme). */
  theme?: CustomTheme | null;
}

export interface IEditProfileForm {
  firstName: string;
  lastName: string;
}

export interface IChangeMobileForm {
  mobile: string;
  code: string;
}

export interface IChangeUserBudgetForm {
  price: number | string;
}
