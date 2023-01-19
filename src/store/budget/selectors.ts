import { RootState } from "@/store/index";

//Interfaces
import { IBudget } from "@/ts/interfaces/budget.interface";

export function budgetsSelector(state: RootState): IBudget[] | null {
  return state.budget.budgets;
}

export function totalCostPriceSelector(state: RootState): number | null {
  return state.budget.totalCostPrice;
}

export function totalIncomePriceSelector(state: RootState): number | null {
  return state.budget.totalIncomePrice;
}
