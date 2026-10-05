import type { IProfile } from "./profile.interface";

export interface IAuthState {
  token: string | null;
  isAuth: boolean;
  didTryAutoLogin: boolean;
  users: ISaveToLocalUser[];
}

export interface ISaveToLocal {
  token: string;
  users: ISaveToLocalUser[];
}

/**
 * One signed-in account as kept in the auth cookie. Only what the account
 * switcher needs: full profiles overflowed the 4KB cookie limit with 2-3
 * accounts (Persian names are ~6 bytes per letter once encoded), and the
 * browser then silently dropped the whole cookie.
 */
export type ISaveToLocalUser = Pick<IProfile, "_id" | "firstName" | "lastName" | "mobile"> & {
  token: string;
};

export interface ICheckMobileExistResult {
  isMustRegister: boolean;
  hasPassword: boolean;
  hasTelegram: boolean;
  otpEnabled: boolean;
  needsPasswordSetup?: boolean;
}

export interface ISignUpForm {
  firstName: string;
  lastName: string;
  mobile: string;
  code?: string;
  password?: string;
}

export interface ISignInForm {
  mobile: string;
  code: string;
}

export interface ISignInPasswordForm {
  mobile: string;
  password: string;
}
