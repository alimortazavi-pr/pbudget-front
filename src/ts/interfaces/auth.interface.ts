import { IProfile } from "./profile.interface";

export interface IAuthState {
  token: null | string;
  didTryAutoLogin: boolean;
  isAuth: boolean;
  users: ISaveToLocalUser[];
}

export interface IValidationErrorsCheckMobileExist {
  paths: string[];
  messages: {
    mobile: string;
  };
}

export interface ISignUpForm {
  firstName: string;
  lastName: string;
  mobile: string;
  code: string;
}

export interface IValidationErrorsSignUpForm {
  paths: string[];
  messages: {
    firstName: string;
    lastName: string;
    mobile: string;
    code: string;
  };
}

export interface ISignInForm {
  mobile: string;
  code: string;
}

export interface IValidationErrorsSignInForm {
  paths: string[];
  messages: {
    mobile: string;
    code: string;
  };
}

export interface IForgetCodeForm {
  mobile: string;
}

export interface IValidationErrorsForgetCodeForm {
  paths: string[];
  messages: {
    mobile: string;
  };
}

export interface ISaveToLocal {
  token: string;
  users: ISaveToLocalUser[];
}

export interface ISaveToLocalUser extends IProfile {
  token: string;
}
