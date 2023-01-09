import { RootState } from "@/store/index";
import { ICategory } from "@/ts/interfaces/category.interface";

//Interfaces
export function categoriesSelector(state: RootState): ICategory[] {
  return state.category.categories;
}
