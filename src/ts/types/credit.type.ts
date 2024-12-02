import { Dispatch, SetStateAction } from "react";
import {
  ICredit,
  ICreateAndEditCreditForm,
  IValidationErrorsCreateAndEditCreditForm,
} from "../interfaces/credit.interface";

export type createCreditProps = {};

export type editCreditProps = {
  credit: ICredit;
};

export type creditDatePickerProps = {
  form: ICreateAndEditCreditForm;
  setForm: Dispatch<SetStateAction<ICreateAndEditCreditForm>>;
  errors: IValidationErrorsCreateAndEditCreditForm;
  setErrors: Dispatch<SetStateAction<IValidationErrorsCreateAndEditCreditForm>>;
};

export type dailyTypeTabsProps = {
  dailyType: boolean;
  setDailyType: Dispatch<SetStateAction<boolean>>;
};

export type indexCreditsProps = {
  credits: ICredit[];
  totalDebtPrice: number;
  totalDuesPrice: number;
};

export type informationCreditProps = {
  credits: ICredit[];
  totalDebtPrice: number;
  totalDuesPrice: number;
};

export type singleCreditProps = {
  credit: ICredit;
};

export type setCreditsAction = {
  credits: ICredit[];
  totalDebtPrice: number;
  totalDuesPrice: number;
};

export type deleteCreditProps = {
  credit: ICredit;
};
