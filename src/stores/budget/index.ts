import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { IBudget, IBudgetState } from "@/common/interfaces/budget.interface";

const initialState: IBudgetState = {
  budgets: null,
  totalCostPrice: null,
  totalIncomePrice: null,
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
    deleteBudget(state, action: PayloadAction<IBudget>) {
      if (!state.budgets) return;
      state.budgets = state.budgets.filter((b) => b._id !== action.payload._id);
      if (action.payload.type === 1) {
        state.totalIncomePrice =
          (state.totalIncomePrice ?? 0) - action.payload.price;
      } else {
        state.totalCostPrice =
          (state.totalCostPrice ?? 0) - action.payload.price;
      }
    },
  },
});

export const budgetReducer = budgetSlice.reducer;
export const { setBudgets, deleteBudget } = budgetSlice.actions;
export const budgetsSelector = (state: { budget: IBudgetState }) =>
  state.budget.budgets;
export const totalIncomeSelector = (state: { budget: IBudgetState }) =>
  state.budget.totalIncomePrice;
export const totalCostSelector = (state: { budget: IBudgetState }) =>
  state.budget.totalCostPrice;
