import { RootState } from "@/store/index";

//Interfaces
import { IBudget } from "@/ts/interfaces/budget.interface";

export function budgetsSelector(state: RootState): IBudget[] {
  return state.budget.budgets;
}

export function totalCostPriceSelector(state: RootState): number {
  return state.budget.totalCostPrice;
}

export function totalIncomePriceSelector(state: RootState): number {
  return state.budget.totalIncomePrice;
}
