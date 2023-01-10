export interface IAuthState {
  token: null | string;
  didTryAutoLogin: boolean;
  isAuth: boolean;
}

export interface IValidationErrorsCheckEmailExist {
  paths: string[];
  messages: {
    email: string;
  };
}

export interface ISignUpForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface IValidationErrorsSignUpForm {
  paths: string[];
  messages: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  };
}

export interface ISignInForm {
  email: string;
  password: string;
}

export interface IValidationErrorsSignInForm {
  paths: string[];
  messages: {
    email: string;
    password: string;
  };
}

export interface IForgetPasswordForm {
  email: string;
}

export interface IValidationErrorsForgetPasswordForm {
  paths: string[];
  messages: {
    email: string;
  };
}

export interface IResetPasswordForm {
  email: string;
  code: string;
  password: string;
  passwordConfirmation: string;
}

export interface IValidationErrorsResetPasswordForm {
  paths: string[];
  messages: {
    email: string;
    code: string;
    password: string;
    passwordConfirmation: string;
  };
}
