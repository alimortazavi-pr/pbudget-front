import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type {
  ICategory,
  ICategoryState,
} from "@/common/interfaces/category.interface";

const initialState: ICategoryState = {
  categories: null,
};

const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    setCategories(state, action: PayloadAction<ICategory[]>) {
      state.categories = action.payload;
    },
  },
});

export const categoryReducer = categorySlice.reducer;
export const { setCategories } = categorySlice.actions;
export const categoriesSelector = (state: { category: ICategoryState }) =>
  state.category.categories;
