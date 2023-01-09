import { ICategory, ICategoryState } from "@/ts/interfaces/category.interface";
import { PayloadAction } from "@reduxjs/toolkit";

//Interfaces

//Tools

const reducers = {
  setCategories(
    state: ICategoryState,
    action: PayloadAction<ICategory[]>
  ): ICategoryState {
    return {
      ...state,
      categories: action.payload,
    };
  },
};

export default reducers;
