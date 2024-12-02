import { RootState } from "@/store/index";

//Interfaces
import { ICredit } from "@/ts/interfaces/credit.interface";

export function creditsSelector(state: RootState): ICredit[] | null {
  return state.credit.credits;
}

export function totalDebtPriceSelector(state: RootState): number | null {
  return state.credit.totalDebtPrice;
}

export function totalDuesPriceSelector(state: RootState): number | null {
  return state.credit.totalDuesPrice;
}
