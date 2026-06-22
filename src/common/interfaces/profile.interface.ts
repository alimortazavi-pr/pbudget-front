export interface IProfileState {
  user: IProfile | null;
}

export interface IProfile {
  _id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  budget: number;
  isVerifiedMobile: boolean;
  hasPassword?: boolean;
  isAdmin?: boolean;
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
