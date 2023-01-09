import { createSlice } from "@reduxjs/toolkit";

//Interfaces
import { ICategoryState } from "@/ts/interfaces/category.interface";

//Reducers
import reducers from "@/store/category/reducers";

const initialState: ICategoryState = {
  categories: [],
};

export const categoryReducer = createSlice({
  name: "category",
  initialState,
  reducers,
});

export default categoryReducer.reducer;
