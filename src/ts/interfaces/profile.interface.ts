export interface IProfileState {
  user: IProfile;
}

export interface IProfile {
  _id: string;
  firstName: string | null;
  lastName: string | null;
  mobile: string | null;
  profileImage?: string | null;
  mobileActive: boolean;
  budget: number | null;
  deleted: boolean;
}

export interface IEditProfileForm {
  firstName: string;
  lastName: string;
  mobile: string;
}

export interface IValidationErrorsEditProfileForm {
  paths: string[];
  messages: {
    firstName: string;
    lastName: string;
    mobile: string;
  };
}

export interface IChangeUserBudgetForm {
  price: string | number;
}

export interface IValidationErrorsChangeUserBudgetForm {
  paths: string[];
  messages: {
    price: string;
  };
}

export interface IChangeMobileForm {
  mobile: string;
  code: string;
}

export interface IValidationErrorsChangeMobileForm {
  paths: string[];
  messages: {
    mobile: string;
    code: string;
  };
}
