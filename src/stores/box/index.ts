import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { IBox, IBoxState } from "@/common/interfaces/box.interface";

const initialState: IBoxState = {
  boxes: null,
};

const boxSlice = createSlice({
  name: "box",
  initialState,
  reducers: {
    setBoxes(state, action: PayloadAction<IBox[]>) {
      state.boxes = action.payload;
    },
  },
});

export const boxReducer = boxSlice.reducer;
export const { setBoxes } = boxSlice.actions;
export const boxesSelector = (state: { box: IBoxState }) => state.box.boxes;
