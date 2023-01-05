//Types
import { ICategory } from "./category.interface";

export interface IBudgetState {
  budgets: IBudget[];
  totalCostPrice: number;
  totalIncomePrice: number;
}

export interface IBudget {
  _id: string;
  user: string;
  category: ICategory;
  price: number;
  type: number;
  date: string;
  deleted: boolean;
}

export interface ICreateAndEditBudgetForm {
  price: string | number;
  type: number;
  category: string;
  date: Date | string;
}

export interface IValidationErrorsCreateAndEditBudgetForm {
  paths: string[];
  messages: {
    price: string;
    type: string;
    category: string;
    date: string;
  };
}
