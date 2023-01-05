export interface IProfileState {
  user: IProfile;
}

export interface IProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  emailActive: boolean;
  password: string;
  budget: number;
  deleted: boolean;
}

export interface IEditProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface IValidationErrorsEditProfileForm {
  paths: string[];
  messages: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
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
