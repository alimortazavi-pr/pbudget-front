import { createSlice } from "@reduxjs/toolkit";

//Interfaces
import { ICreditState } from "@/ts/interfaces/credit.interface";

//Reducers
import reducers from "@/store/credit/reducers";

const initialState: ICreditState = {
  credits: null,
  totalDebtPrice: null,
  totalDuesPrice: null,
};

export const creditReducer = createSlice({
  name: "credit",
  initialState,
  reducers,
});

export default creditReducer.reducer;
