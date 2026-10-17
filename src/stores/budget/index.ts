import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { IBudget, IBudgetState } from "@/common/interfaces/budget.interface";
import { BudgetType } from "@/types/enums";

const initialState: IBudgetState = {
  budgets: null,
  totalCostPrice: null,
  totalIncomePrice: null,
  revision: 0,
};

const budgetSlice = createSlice({
  name: "budget",
  initialState,
  reducers: {
    setBudgets(
      state,
      action: PayloadAction<{
        budgets: IBudget[];
        totalCostPrice: number;
        totalIncomePrice: number;
      }>,
    ) {
      state.budgets = action.payload.budgets;
      state.totalCostPrice = action.payload.totalCostPrice;
      state.totalIncomePrice = action.payload.totalIncomePrice;
    },
    /** Next page of an infinite list; rows already shown are skipped. */
    appendBudgets(state, action: PayloadAction<IBudget[]>) {
      const seen = new Set((state.budgets ?? []).map((b) => b._id));
      state.budgets = [...(state.budgets ?? []), ...action.payload.filter((b) => !seen.has(b._id))];
    },
    deleteBudget(state, action: PayloadAction<IBudget>) {
      if (!state.budgets) return;
      state.budgets = state.budgets.filter((b) => b._id !== action.payload._id);
      if (action.payload.type === BudgetType.INCOME) {
        state.totalIncomePrice =
          (state.totalIncomePrice ?? 0) - action.payload.price;
      } else {
        state.totalCostPrice =
          (state.totalCostPrice ?? 0) - action.payload.price;
      }
    },
    bumpBudgetRevision(state) {
      state.revision += 1;
    },
  },
});

export const budgetReducer = budgetSlice.reducer;
export const { setBudgets, appendBudgets, deleteBudget, bumpBudgetRevision } = budgetSlice.actions;
export const budgetsSelector = (state: { budget: IBudgetState }) =>
  state.budget.budgets;
export const totalIncomeSelector = (state: { budget: IBudgetState }) =>
  state.budget.totalIncomePrice;
export const totalCostSelector = (state: { budget: IBudgetState }) =>
  state.budget.totalCostPrice;
export const budgetRevisionSelector = (state: { budget: IBudgetState }) =>
  state.budget.revision;
