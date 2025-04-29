import { createSlice } from "@reduxjs/toolkit";

//Interfaces
import { IBoxState } from "@/ts/interfaces/box.interface";

//Reducers
import reducers from "@/store/box/reducers";

const initialState: IBoxState = {
  boxes: null,
};

export const boxReducer = createSlice({
  name: "box",
  initialState,
  reducers,
});

export default boxReducer.reducer;
