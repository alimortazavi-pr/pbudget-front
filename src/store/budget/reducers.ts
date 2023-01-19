import { budgetTypeEnum } from "@/ts/enums/budget.enum";
import { IBudget, IBudgetState } from "@/ts/interfaces/budget.interface";
import { setBudgetsAction } from "@/ts/types/budget.type";
import { PayloadAction } from "@reduxjs/toolkit";

//Interfaces

//Tools
import Cookies from "js-cookie";

const reducers = {
  setBudgets: (
    state: IBudgetState,
    action: PayloadAction<setBudgetsAction>
  ): IBudgetState => {
    return {
      ...state,
      budgets: action.payload.budgets,
      totalCostPrice: action.payload.totalCostPrice,
      totalIncomePrice: action.payload.totalIncomePrice,
    };
  },
  deleteBudget: (
    state: IBudgetState,
    action: PayloadAction<IBudget>
  ): IBudgetState => {
    let newTotalCostPrice: number = state.totalCostPrice || 0;
    let newTotalIncomePrice: number = state.totalIncomePrice || 0;
    if (action.payload.type === budgetTypeEnum.INCOME) {
      newTotalIncomePrice -= action.payload.price;
    } else {
      newTotalCostPrice -= action.payload.price;
    }

    return {
      ...state,
      budgets: [
        ...(state.budgets as IBudget[]).filter(
          (budget) => budget._id !== action.payload._id
        ),
      ],
      totalCostPrice: newTotalCostPrice,
      totalIncomePrice: newTotalIncomePrice,
    };
  },
};

export default reducers;
