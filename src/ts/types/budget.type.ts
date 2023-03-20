import { Dispatch, SetStateAction } from "react";
import {
  IBudget,
  ICreateAndEditBudgetForm,
  IValidationErrorsCreateAndEditBudgetForm,
} from "../interfaces/budget.interface";
import { ICategory } from "../interfaces/category.interface";

export type createBudgetProps = {};

export type editBudgetProps = {
  budget: IBudget;
};

export type budgetDatePickerProps = {
  form: ICreateAndEditBudgetForm;
  setForm: Dispatch<SetStateAction<ICreateAndEditBudgetForm>>;
  errors: IValidationErrorsCreateAndEditBudgetForm;
  setErrors: Dispatch<SetStateAction<IValidationErrorsCreateAndEditBudgetForm>>;
};

export type dailyTypeTabsProps = {
  dailyType: boolean;
  setDailyType: Dispatch<SetStateAction<boolean>>;
};

export type indexBudgetsProps = {
  budgets: IBudget[];
  totalCostPrice: number;
  totalIncomePrice: number;
};

export type informationBudgetProps = {
  budgets: IBudget[];
  totalCostPrice: number;
  totalIncomePrice: number;
};

export type singleBudgetProps = {
  budget: IBudget;
};

export type setBudgetsAction = {
  budgets: IBudget[];
  totalCostPrice: number;
  totalIncomePrice: number;
};

export type deleteBudgetProps = {
  budget: IBudget;
};
