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

export interface ISaveToLocalUser extends IProfile {
  token: string;
}

export interface ICheckMobileExistResult {
  isMustRegister: boolean;
  hasPassword: boolean;
  hasTelegram: boolean;
  otpEnabled: boolean;
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
