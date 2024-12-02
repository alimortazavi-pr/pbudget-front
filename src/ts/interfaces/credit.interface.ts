//Types
import { ICategory } from "./category.interface";

export interface ICreditState {
  credits: ICredit[] | null;
  totalDebtPrice: number | null;
  totalDuesPrice: number | null;
}

export interface ICredit {
  _id: string;
  user: string;
  category: ICategory;
  budget: string;
  price: number;
  type: number;
  paid: boolean;
  person: string;
  deleted: boolean;
  year: string;
  month: string;
  day: string;
  description: string;
  createdAt: string;
}

export interface ICreateAndEditCreditForm {
  price: string | number;
  type: number;
  category: string;
  year: string;
  month: string;
  day: string;
  description: string;
  paid: boolean;
  person: string;
}

export interface IValidationErrorsCreateAndEditCreditForm {
  paths: string[];
  messages: {
    price: string;
    type: string;
    category: string;
    year: string;
    month: string;
    day: string;
    description: string;
    paid: boolean;
    person: string;
  };
}
