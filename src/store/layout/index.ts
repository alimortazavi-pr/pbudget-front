import { createSlice } from "@reduxjs/toolkit";

//Interfaces
import { ILayoutState } from "@/ts/interfaces/layout.interface";

//Reducers
import reducers from "@/store/layout/reducers";

const initialState: ILayoutState = {
  darkMode: false,
};

export const layoutReducer = createSlice({
  name: "layout",
  initialState,
  reducers,
});

export default layoutReducer.reducer;
