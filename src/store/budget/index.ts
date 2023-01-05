import { createSlice } from "@reduxjs/toolkit";

//Interfaces
import { IBudgetState } from "@/ts/interfaces/budget.interface";

//Reducers
import reducers from "@/store/budget/reducers";

const initialState: IBudgetState = {
  budgets: [],
  totalCostPrice: 0,
  totalIncomePrice: 0,
};

export const budgetReducer = createSlice({
  name: "budget",
  initialState,
  reducers,
});

export default budgetReducer.reducer;
